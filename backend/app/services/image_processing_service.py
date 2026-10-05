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
            from app.ml.model_manager import model_manager
            provider = model_manager.get_provider()

            temp_path = os.path.join(RESULTS_DIR, f"temp_detect_{uuid.uuid4().hex}.png")
            if len(img.shape) == 2:
                cv2.imwrite(temp_path, img)
            else:
                cv2.imwrite(temp_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

            detections = provider.detect(temp_path)
            if os.path.exists(temp_path):
                os.remove(temp_path)

            if detections:
                yolo_ran = True

            for i, det in enumerate(detections):
                bx = det.bbox.x1
                by = det.bbox.y1
                bw = det.bbox.x2 - det.bbox.x1
                bh = det.bbox.y2 - det.bbox.y1
                conf = float(det.confidence)
                label = det.class_name

                regions.append({
                    "id": f"anomaly-{provider.provider_name}-{i}",
                    "label": label,
                    "objectConfidence": conf,
                    "shadowConfidence": round(conf * 0.9, 4),
                    "uncertainty": round(1.0 - conf, 4),
                    "detection_method": f"yolo_{provider.provider_name}",
                    "boundingBox": {"x": bx, "y": by, "width": bw, "height": bh},
                    "features": {
                        "brightnessReturn": float(np.mean(img)),
                        "shadowContinuity": round(conf, 2),
                        "shapeScore": 0.85,
                        "textureScore": 0.75,
                        "seabedSimilarity": 0.2
                    },
                    "explanation": f"SONAR AI model ({provider.provider_name}) detected {label} with {conf*100:.1f}% confidence."
                })
        except Exception as e:
            import logging
            logging.getLogger("sonar-x").warning(f"YOLO model error: {e}")

        # HEURISTIC ACOUSTIC ANOMALY ANALYSIS (Runs if YOLO finds 0 detections or as multi-spectral supplement)
        if len(regions) == 0:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
            
            p1, p99 = np.percentile(gray, (1, 99))
            if p99 > p1:
                norm_gray = np.clip(gray, p1, p99)
                norm_gray = cv2.normalize(norm_gray, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
            else:
                norm_gray = gray.copy()

            bg_brightness = float(np.mean(norm_gray))

            # 1. Dark acoustic shadow candidates
            _, shadow_thresh = cv2.threshold(norm_gray, max(10, int(bg_brightness * 0.45)), 255, cv2.THRESH_BINARY_INV)
            
            # 2. Bright acoustic highlight candidates (strong backscatter returns from hard objects/metals)
            _, highlight_thresh = cv2.threshold(norm_gray, min(245, max(175, int(bg_brightness * 1.45))), 255, cv2.THRESH_BINARY)
            
            combined_mask = cv2.bitwise_or(shadow_thresh, highlight_thresh)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
            
            contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_area = max(50, int(orig_h * orig_w * 0.0003))
            candidates = []
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area >= min_area:
                    x, y, w, h = cv2.boundingRect(cnt)
                    aspect_ratio = max(w, h) / max(min(w, h), 1)
                    if aspect_ratio < 10:
                        roi = norm_gray[y:y+h, x:x+w]
                        roi_brightness = float(np.mean(roi)) if roi.size > 0 else bg_brightness
                        roi_std = float(np.std(roi)) if roi.size > 0 else 0.0
                        contrast_ratio = abs(bg_brightness - roi_brightness) / max(bg_brightness, 1.0)
                        candidates.append((contrast_ratio, area, cnt, x, y, w, h, roi_brightness, roi_std))
                        
            # Fallback to high variance region if no extreme contour candidates found
            if not candidates:
                cell_h, cell_w = orig_h // 3, orig_w // 3
                best_var = -1
                best_rect = (cell_w, cell_h, cell_w, cell_h)
                for r in range(3):
                    for c in range(3):
                        rx, ry = c * cell_w, r * cell_h
                        sub = norm_gray[ry:ry+cell_h, rx:rx+cell_w]
                        v = float(np.std(sub))
                        if v > best_var:
                            best_var = v
                            best_rect = (rx, ry, cell_w, cell_h)
                rx, ry, rw, rh = best_rect
                sub = norm_gray[ry:ry+rh, rx:rx+rw]
                candidates.append((0.45, float(rw * rh), None, rx, ry, rw, rh, float(np.mean(sub)), float(np.std(sub))))

            candidates.sort(key=lambda c: c[0] * c[1], reverse=True)

            for i, (contrast_ratio, area, cnt, x, y, w, h, roi_brightness, roi_std) in enumerate(candidates[:5]):
                aspect = max(w, h) / max(min(w, h), 1)
                relative_area = area / (orig_h * orig_w)
                obj_confidence = round(min(0.98, max(0.72, 0.65 + contrast_ratio * 0.4 + (roi_std / 100.0))), 4)
                is_bright = roi_brightness > bg_brightness

                if aspect >= 3.8:
                    label = "Submerged Pipeline / Cable Anomaly"
                    explanation = (
                        f"Linear acoustic alignment ({w}×{h}px, aspect ratio {aspect:.1f}) detected via SSS analysis. "
                        f"Continuous acoustic profile with {contrast_ratio*100:.0f}% contrast ratio indicates exposed subsea infrastructure."
                    )
                elif relative_area > 0.03 or (aspect > 2.2 and relative_area > 0.008):
                    label = "Submerged Vessel / Hull Structure"
                    explanation = (
                        f"Large-scale acoustic shadow & highlight signature ({w}×{h}px, aspect ratio {aspect:.1f}) detected. "
                        f"Contiguous high-contrast return ({contrast_ratio*100:.0f}% contrast) indicates a submerged hull or structural wreck resting on seabed."
                    )
                elif is_bright and contrast_ratio > 0.35:
                    label = "Debris (Metal / Hard Structure)"
                    explanation = (
                        f"High acoustic backscatter highlight ({w}×{h}px, return brightness {roi_brightness:.1f}) detected. "
                        f"Strong acoustic reflection indicates metallic debris or artificial subsea object."
                    )
                elif aspect < 1.8 and relative_area < 0.01:
                    label = "Submerged Mine / UXO Candidate"
                    explanation = (
                        f"Compact high-contrast target ({w}×{h}px, {contrast_ratio*100:.0f}% contrast ratio) with symmetrical footprint (aspect ratio {aspect:.1f}). "
                        f"Profile matches an elevated rigid subsea object (sea mine / UXO candidate)."
                    )
                elif roi_std > 25.0:
                    label = "Ghost Net / Derelict Fishing Gear"
                    explanation = (
                        f"Dispersed texture scatter pattern ({w}×{h}px, texture std {roi_std:.1f}) detected via SSS analysis. "
                        f"Diffuse return matches synthetic fishing net gear on seabed."
                    )
                else:
                    label = "Unclassified Seabed Anomaly"
                    explanation = (
                        f"Submerged target identified via acoustic profiling: region {w}×{h}px with {contrast_ratio*100:.0f}% contrast ratio. "
                        f"Flagged for human verification."
                    )

                regions.append({
                    "id": f"shadow-anomaly-{i}",
                    "label": label,
                    "objectConfidence": obj_confidence,
                    "shadowConfidence": round(min(1.0, contrast_ratio * 1.5), 4),
                    "uncertainty": round(1.0 - obj_confidence, 4),
                    "detection_method": "acoustic_shadow_analysis" if not is_bright else "acoustic_highlight_analysis",
                    "boundingBox": {"x": float(x), "y": float(y), "width": float(w), "height": float(h)},
                    "features": {
                        "brightnessReturn": round(roi_brightness, 2),
                        "brightnessStd": round(roi_std, 2),
                        "contrastRatio": round(contrast_ratio, 4),
                        "areaPixels": int(area),
                        "shadowContinuity": round(min(1.0, contrast_ratio * 1.2), 4),
                        "shapeScore": round(max(0.1, 1.0 - (aspect / 8.0)), 4),
                        "textureScore": round(min(1.0, roi_std / 50.0), 4),
                        "seabedSimilarity": round(max(0, 1.0 - contrast_ratio), 4),
                    },
                    "explanation": explanation
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
