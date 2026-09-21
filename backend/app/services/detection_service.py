import time
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database.models import Detection
from app.database.repositories import SonarImageRepository, DetectionRepository
from app.ml.model_manager import model_manager
from app.schemas.detection import DetectionResponse

class DetectionService:
    def __init__(self, db: Session):
        self.image_repo = SonarImageRepository(db)
        self.det_repo = DetectionRepository(db)
        self.db = db

    def run_detection(self, image_id: str) -> DetectionResponse:
        import cv2
        import os
        from app.core.config import get_settings
        settings = get_settings()

        image = self.image_repo.get(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
            
        target_path = image.processed_path or image.original_path
        if not target_path:
            raise HTTPException(status_code=400, detail="No valid image path found")

        provider = model_manager.get_provider()
        
        start_time = time.time()
        
        img = cv2.imread(target_path)
        if img is None:
            raise HTTPException(status_code=500, detail="Failed to load image for detection")
            
        h, w = img.shape[:2]
        tile_size = 640
        stride = 320
        
        det_results = []
        
        if h <= tile_size and w <= tile_size:
            det_results = provider.detect(target_path)
        else:
            # Tiling: Deterministic 50% overlap, remap before geotagging
            temp_dir = os.path.join(settings.UPLOAD_DIR, "temp_tiles")
            os.makedirs(temp_dir, exist_ok=True)
            
            for y in range(0, h, stride):
                for x in range(0, w, stride):
                    y_end = min(y + tile_size, h)
                    x_end = min(x + tile_size, w)
                    
                    # Ensure tile is exactly tile_size x tile_size if we pad, but spec says "remap before geotagging".
                    # Let's crop what we have. YOLO letterboxes anyway, but we should preserve origins.
                    tile = img[y:y_end, x:x_end]
                    tile_path = os.path.join(temp_dir, f"tile_{image_id}_{y}_{x}.png")
                    cv2.imwrite(tile_path, tile)
                    
                    tile_detections = provider.detect(tile_path)
                    
                    for d in tile_detections:
                        # Remap coordinates
                        d.bbox.x1 += x
                        d.bbox.x2 += x
                        d.bbox.y1 += y
                        d.bbox.y2 += y
                        det_results.append(d)
                        
                    os.remove(tile_path)
                    
        # Basic NMS / Deduplication (50px center distance merge)
        # Spec: "Merge by calibrated confidence and 50 px center distance."
        merged_results = []
        for det in sorted(det_results, key=lambda x: x.confidence, reverse=True):
            cx = (det.bbox.x1 + det.bbox.x2) / 2
            cy = (det.bbox.y1 + det.bbox.y2) / 2
            
            is_duplicate = False
            for m in merged_results:
                mcx = (m.bbox.x1 + m.bbox.x2) / 2
                mcy = (m.bbox.y1 + m.bbox.y2) / 2
                # 50px center distance
                if ((cx - mcx)**2 + (cy - mcy)**2)**0.5 < 50:
                    if det.class_name == m.class_name:
                        is_duplicate = True
                        break
            if not is_duplicate:
                merged_results.append(det)
                
        det_results = merged_results

        processing_time_ms = int((time.time() - start_time) * 1000)

        # Save detections to db
        db_detections = []
        for r in det_results:
            db_detections.append(Detection(
                mission_id=image.mission_id,
                sonar_image_id=image.id,
                class_name=r.class_name,
                confidence=r.confidence,
                bbox_x1=r.bbox.x1,
                bbox_y1=r.bbox.y1,
                bbox_x2=r.bbox.x2,
                bbox_y2=r.bbox.y2,
                mask=r.mask,
                area=r.area,
                model_version=f"{provider.provider_name}-v1",
                dataset_version="AquaScan-1K"
            ))
            
        if db_detections:
            self.det_repo.create_bulk(db_detections)

        return DetectionResponse(
            mission_id=image.mission_id,
            image_id=image.id,
            provider=provider.provider_name,
            processing_time_ms=processing_time_ms,
            detections=det_results
        )
