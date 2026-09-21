import os
import cv2
import numpy as np
import time
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from PIL import Image
import uuid

from app.database.models import ImageProcessingJob
from app.core.config import get_settings
from app.services.s3_service import S3Service

settings = get_settings()
RESULTS_DIR = os.path.join(settings.UPLOAD_DIR, "processing_results")
os.makedirs(RESULTS_DIR, exist_ok=True)

class ImageProcessingService:
    @staticmethod
    def _save_file(image_arr, filename):
        path = os.path.join(RESULTS_DIR, filename)
        if len(image_arr.shape) == 2:
            cv2.imwrite(path, image_arr)
        else:
            cv2.imwrite(path, cv2.cvtColor(image_arr, cv2.COLOR_RGB2BGR))
            
        s3_url = S3Service.upload_file(path, f"uploads/processing_results/{filename}")
        return s3_url if s3_url else f"/api/uploads/processing_results/{filename}"

    @staticmethod
    def _detect_regions(img, orig_h, orig_w):
        regions = []
        yolo_ran = False
        try:
            from app.ml.model import DetectorService
            detector = DetectorService(model_path="models/sonar_detector.onnx", noise_filter_pred_cnt=1)
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB) if len(img.shape) == 2 else img
            img_resized = cv2.resize(img_rgb, (640, 640))
            img_tensor = img_resized.transpose(2, 0, 1)
            img_tensor = np.expand_dims(img_tensor, axis=0).astype(np.float32) / 255.0
            
            result = detector.infer(img_tensor)
            detections = result.get("detections", [])
            yolo_ran = True
            
            for i, det in enumerate(detections):
                bbox = det.get("bbox", [0, 0, 0, 0])
                scale_x = orig_w / 640.0
                scale_y = orig_h / 640.0
                bx = float(bbox[0]) * scale_x
                by = float(bbox[1]) * scale_y
                bw = float(bbox[2] - bbox[0]) * scale_x
                bh = float(bbox[3] - bbox[1]) * scale_y
                regions.append({
                    "id": f"anomaly-{i}",
                    "label": det.get("label", "anomaly"),
                    "objectConfidence": float(det.get("confidence", 0.85)),
                    "shadowConfidence": 0.0,
                    "uncertainty": 1.0 - float(det.get("confidence", 0.85)),
                    "boundingBox": {"x": bx, "y": by, "width": bw, "height": bh},
                    "features": {
                        "brightnessReturn": float(np.mean(img)),
                        "shadowContinuity": 0.85,
                        "shapeScore": 0.8,
                        "textureScore": 0.7,
                        "seabedSimilarity": 0.3
                    },
                    "explanation": f"Detected {det.get('label', 'anomaly')} with {float(det.get('confidence', 0.85))*100:.1f}% confidence."
                })
        except Exception as e:
            import logging
            logging.getLogger("sonar-x").warning(f"YOLO model error: {e}")

        # HEURISTIC SUPPLEMENT: Run acoustic shadow detection when YOLO found nothing
        # This catches wrecks, reefs, mines, and other objects YOLO wasn't trained on
        if len(regions) == 0:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
            
            # Adaptive threshold for dark shadow regions
            _, shadow_thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(shadow_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            min_area = max(200, int(orig_h * orig_w * 0.001))
            candidates = []
            background_brightness = float(np.mean(gray))
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > min_area:
                    x, y, w, h = cv2.boundingRect(cnt)
                    aspect_ratio = max(w, h) / max(min(w, h), 1)
                    # Filter out very elongated thin lines (likely scan artifacts)
                    if aspect_ratio < 8:
                        roi = gray[y:y+h, x:x+w]
                        roi_brightness = float(np.mean(roi)) if roi.size > 0 else 0.0
                        contrast_ratio = (background_brightness - roi_brightness) / max(background_brightness, 1.0)
                        # Only keep high-contrast shadow regions (likely real objects)
                        if contrast_ratio > 0.3:
                            candidates.append((contrast_ratio, area, cnt, x, y, w, h, roi_brightness))

            candidates.sort(key=lambda c: c[0], reverse=True)
            
            # Classify based on size and shape
            for i, (contrast_ratio, area, cnt, x, y, w, h, roi_brightness) in enumerate(candidates[:5]):
                # Determine anomaly type based on features
                aspect = max(w, h) / max(min(w, h), 1)
                relative_area = area / (orig_h * orig_w)
                
                if relative_area > 0.05:
                    label = "likely_object"
                    anomaly_type = "Wreck/Large Object"
                elif relative_area > 0.01:
                    label = "likely_object"
                    anomaly_type = "Debris/Structure"
                else:
                    label = "likely_object"
                    anomaly_type = "Unidentified Object"
                
                # Convert contrast ratio to a confidence-like score (0.3-0.85 range)
                obj_confidence = round(min(0.85, 0.3 + contrast_ratio * 0.6), 4)
                
                roi_std = float(np.std(gray[y:y+h, x:x+w])) if gray[y:y+h, x:x+w].size > 0 else 0.0
                
                regions.append({
                    "id": f"shadow-anomaly-{i}",
                    "label": label,
                    "objectConfidence": obj_confidence,
                    "shadowConfidence": round(min(1.0, contrast_ratio), 4),
                    "uncertainty": round(1.0 - obj_confidence, 4),
                    "detection_method": "acoustic_shadow_analysis",
                    "boundingBox": {"x": float(x), "y": float(y), "width": float(w), "height": float(h)},
                    "features": {
                        "brightnessReturn": round(roi_brightness, 2),
                        "brightnessStd": round(roi_std, 2),
                        "contrastRatio": round(contrast_ratio, 4),
                        "areaPixels": int(area),
                        "shadowContinuity": round(min(1.0, contrast_ratio * 1.2), 4),
                        "shapeScore": round(1.0 - (aspect / 8.0), 4),
                        "textureScore": round(min(1.0, roi_std / 50.0), 4),
                        "seabedSimilarity": round(max(0, 1.0 - contrast_ratio), 4),
                    },
                    "explanation": (
                        f"{anomaly_type} detected via acoustic shadow analysis: "
                        f"high-contrast region {w}×{h}px with {contrast_ratio*100:.0f}% contrast ratio. "
                        f"Confidence: {obj_confidence*100:.1f}%. Requires human review."
                    )
                })
        return regions


    @staticmethod
    def process_job_sync(db: Session, job_id: str, file_path: str):

        try:
            job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
            if not job:
                return

            start_time = time.time()
            job.status = "processing"
            job.stage = "loading and validation"
            job.progress = 10
            db.commit()

            # 1. Validation and Loading
            if not os.path.exists(file_path):
                raise ValueError("File not found")
            
            # Load with cv2
            img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
            if img is None:
                raise ValueError("Failed to load or corrupt image")
            
            orig_h, orig_w = img.shape[:2]
            
            max_dim = 1280
            if max(orig_h, orig_w) > max_dim:
                scale = max_dim / float(max(orig_h, orig_w))
                new_w, new_h = int(orig_w * scale), int(orig_h * scale)
                img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
                orig_h, orig_w = img.shape[:2]
            
            if len(img.shape) == 3 and img.shape[2] == 3:
                img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            elif len(img.shape) == 3 and img.shape[2] == 4:
                img_gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
            else:
                img_gray = img

            job.stage = "noise reduction"
            job.progress = 25
            db.commit()

            # 2. Adaptive Speckle/Noise Reduction
            min_dim = min(orig_h, orig_w)
            ksize = 5 if min_dim >= 5 else (3 if min_dim >= 3 else 1)
            denoised = cv2.GaussianBlur(img_gray, (ksize, ksize), 0) if ksize > 1 else img_gray.copy()

            job.stage = "contrast enhancement"
            job.progress = 40
            db.commit()

            # 3. Adaptive Contrast Enhancement (CLAHE)
            tile_h = max(2, min(8, orig_h // 4))
            tile_w = max(2, min(8, orig_w // 4))
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(tile_w, tile_h))
            enhanced = clahe.apply(denoised)

            job.stage = "pixel normalization"
            job.progress = 55
            db.commit()

            # 4. Pixel normalization
            if np.isnan(enhanced).any() or np.isinf(enhanced).any():
                raise ValueError("Image contains NaN or Infinity values")
            
            # Using robust min-max on percentiles
            p1, p99 = np.percentile(enhanced, (1, 99))
            if p99 > p1:
                normalized = np.clip(enhanced, p1, p99)
                normalized = cv2.normalize(normalized, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
            else:
                normalized = enhanced.copy()

            job.stage = "quality assessment"
            job.progress = 70
            db.commit()

            # 5. Quality Assessment on the true cleaned sonar imagery
            brightness = float(np.mean(normalized))
            contrast = float(np.std(normalized))
            sat_pixels = float(np.sum(normalized >= 250) / normalized.size * 100)
            missing_pixels = float(np.sum(normalized <= 5) / normalized.size * 100)
            
            overall_score = max(0, min(100, 100 - (sat_pixels * 1.5) - (missing_pixels * 1.2) + min(15, contrast / 5)))
            category = "excellent" if overall_score > 80 else "good" if overall_score > 60 else "moderate" if overall_score > 40 else "poor"

            qa = {
                "overallScore": round(overall_score, 2),
                "category": category,
                "speckleNoise": "low" if contrast > 35 else "medium",
                "dataDropoutPercentage": round(missing_pixels, 2),
                "imageCoveragePercentage": 100.0,
                "motionDistortion": "unavailable",
                "shadowVisibility": "good" if contrast > 35 else "fair",
                "missingRegionPercentage": round(missing_pixels, 2),
                "contrastScore": round(contrast, 2),
                "signalQuality": round(brightness, 2),
                "warnings": []
            }
            if sat_pixels > 10:
                qa["warnings"].append("High acoustic saturation detected in acoustic highlights.")
            if missing_pixels > 15:
                qa["warnings"].append("Significant acoustic dropout detected in swath.")

            job.stage = "quality mask generation"
            job.progress = 80
            db.commit()

            # 6. Quality mask generation (matching the true sonar image dimensions)
            mask = np.full((orig_h, orig_w), 2, dtype=np.uint8) # 2 = Usable
            mask[normalized <= 5] = 4 # 4 = Missing / dropout
            mask[normalized >= 250] = 4 # 4 = Saturated
            
            # Acoustic shadow candidate
            _, shadow_thresh = cv2.threshold(normalized, 40, 255, cv2.THRESH_BINARY_INV)
            mask[(shadow_thresh == 255) & (mask != 4)] = 3 # 3 = Shadow candidate

            mask_stats = {
                "usablePercentage": round(float(np.sum(mask == 2) / mask.size * 100), 2),
                "uncertainPercentage": round(float(np.sum(mask == 1) / mask.size * 100), 2),
                "ignoredPercentage": round(float(np.sum(mask == 0) / mask.size * 100), 2),
                "missingPercentage": round(float(np.sum(mask == 4) / mask.size * 100), 2),
                "shadowPercentage": round(float(np.sum(mask == 3) / mask.size * 100), 2)
            }

            # Create color mask for visualization (matching dimensions)
            color_mask = np.zeros((orig_h, orig_w, 3), dtype=np.uint8)
            color_mask[mask == 1] = [255, 255, 0] # yellow
            color_mask[mask == 2] = [0, 255, 0] # green
            color_mask[mask == 3] = [0, 0, 255] # blue
            color_mask[mask == 4] = [255, 0, 0] # red

            base_name = f"job_{job_id}"
            job.processed_image_path = ImageProcessingService._save_file(normalized, f"{base_name}_processed.jpg")
            job.quality_mask_path = ImageProcessingService._save_file(color_mask, f"{base_name}_qmask.jpg")

            # 7. Anomaly & Object/Shadow Detection
            job.stage = "anomaly detection"
            job.progress = 90
            db.commit()

            regions = ImageProcessingService._detect_regions(img_gray, orig_h, orig_w)
            job.region_analysis = json.dumps(regions)

            # Inference binary mask
            inf_mask = np.zeros((orig_h, orig_w), dtype=np.uint8)
            for reg in regions:
                bb = reg["boundingBox"]
                x, y, w, h = int(bb["x"]), int(bb["y"]), int(bb["width"]), int(bb["height"])
                cv2.rectangle(inf_mask, (max(0, x), max(0, y)), (min(orig_w, x + w), min(orig_h, y + h)), 255, -1)
            job.inference_mask_path = ImageProcessingService._save_file(inf_mask, f"{base_name}_infmask.jpg")

            meta = {
                "originalWidth": int(orig_w),
                "originalHeight": int(orig_h),
                "processedWidth": int(orig_w),
                "processedHeight": int(orig_h),
                "normalizationMethod": "min-max robust (p1-p99)",
                "noiseReductionMethod": "adaptive median filter",
                "contrastMethod": "CLAHE (adaptive tile)",
                "resizeMethod": "full-fidelity (aspect-ratio preserved)",
                "processingVersion": "1.1.0"
            }

            job.quality_assessment = json.dumps(qa)
            job.mask_statistics = json.dumps(mask_stats)
            job.metadata_json = json.dumps(meta)
            job.warnings = json.dumps(qa["warnings"])
            
            job.processing_duration_ms = int((time.time() - start_time) * 1000)
            job.status = "completed"
            job.stage = "completed"
            job.progress = 100
            db.commit()

        except Exception as e:
            if db:
                db.rollback()
                job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
                if job:
                    job.status = "failed"
                    job.stage = "failed"
                    job.warnings = json.dumps([str(e)])
                    db.commit()
            print(f"Error processing image {job_id}: {e}")

    @staticmethod
    def analyze_job(*args, **kwargs):
        from app.database.database import SessionLocal, get_db
        from app.main import app
        db = None
        own_session = False
        if len(args) == 2:
            db, job_id = args
        elif len(args) == 1:
            job_id = args[0]
            if get_db in app.dependency_overrides:
                override = app.dependency_overrides[get_db]
                db = next(override())
            else:
                db = SessionLocal()
            own_session = True
        else:
            job_id = kwargs.get("job_id")
            db = kwargs.get("db")
            if not db:
                if get_db in app.dependency_overrides:
                    override = app.dependency_overrides[get_db]
                    db = next(override())
                else:
                    db = SessionLocal()
                own_session = True

        try:
            job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
            if not job:
                return

            start_time = time.time()
            job.status = "processing"
            job.stage = "running anomaly detection"
            job.progress = 75
            db.commit()

            original_file_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(job.original_image_path))
            img = cv2.imread(original_file_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Original image not found for analysis.")
            
            orig_h, orig_w = img.shape[:2]
            max_dim = 1280
            if max(orig_h, orig_w) > max_dim:
                scale = max_dim / float(max(orig_h, orig_w))
                new_w, new_h = int(orig_w * scale), int(orig_h * scale)
                img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
                orig_h, orig_w = img.shape[:2]

            regions = ImageProcessingService._detect_regions(img, orig_h, orig_w)
            job.region_analysis = json.dumps(regions)
            
            # Inference binary mask
            inf_mask = np.zeros((orig_h, orig_w), dtype=np.uint8)
            for reg in regions:
                bb = reg["boundingBox"]
                x, y, w, h = int(bb["x"]), int(bb["y"]), int(bb["width"]), int(bb["height"])
                cv2.rectangle(inf_mask, (max(0, x), max(0, y)), (min(orig_w, x + w), min(orig_h, y + h)), 255, -1)
                
            base_name = f"job_{job_id}"
            job.inference_mask_path = ImageProcessingService._save_file(inf_mask, f"{base_name}_infmask.jpg")

            job.processing_duration_ms = (job.processing_duration_ms or 0) + int((time.time() - start_time) * 1000)
            job.status = "completed"
            job.stage = "completed"
            job.progress = 100
            db.commit()

        except Exception as e:
            if db:
                db.rollback()
                job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
                if job:
                    job.status = "failed"
                    job.stage = "analysis failed"
                    warnings = []
                    if job.warnings:
                        try:
                            warnings = json.loads(job.warnings)
                        except Exception:
                            warnings = [job.warnings]
                    warnings.append(f"Analysis Error: {str(e)}")
                    job.warnings = json.dumps(warnings)
                    db.commit()
            print(f"Error in analysis for job {job_id}: {e}")
        finally:
            if own_session and db:
                db.close()
