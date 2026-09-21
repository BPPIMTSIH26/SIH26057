import cv2
import os
import numpy as np
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.database.models import SonarImage
from app.database.repositories import SonarImageRepository
from app.core.config import get_settings
from app.schemas.sonar import PreprocessResponse

settings = get_settings()

class PreprocessingService:
    def __init__(self, db: Session):
        self.repo = SonarImageRepository(db)

    def preprocess(self, image_id: str) -> PreprocessResponse:
        image = self.repo.get(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        if not image.original_path or not os.path.exists(image.original_path):
            raise HTTPException(status_code=400, detail="Original image missing")

        # Prevent double processing
        if getattr(image, "preprocess_applied", False) and image.processed_path:
            return PreprocessResponse(
                image_id=image.id,
                original_path=image.original_path,
                processed_path=image.processed_path,
                operations=["skipped (already processed)"]
            )

        img = cv2.imread(image.original_path)
        if img is None:
            raise HTTPException(status_code=500, detail="Failed to load image for preprocessing")

        operations = []

        # 1. Grayscale
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            operations.append("grayscale")

        # 2. Deterministic Lee 7x7 (approximated with uniform filter / local variance)
        # Lee filter: Img = Mean + K * (Img - Mean), where K = Var / (Var + NoiseVar)
        # For simplicity and OpenCV compatibility, we use a custom implementation or an approximation.
        # A simpler robust approximation that meets "Lee 7x7" requirement for now:
        img = img.astype(np.float32)
        mean_img = cv2.blur(img, (7, 7))
        mean_img_sq = cv2.blur(img**2, (7, 7))
        var_img = mean_img_sq - mean_img**2
        noise_var = np.mean(var_img) # Estimate noise variance as mean variance
        
        # Avoid division by zero
        K = var_img / (var_img + noise_var + 1e-6)
        lee_filtered = mean_img + K * (img - mean_img)
        img = np.clip(lee_filtered, 0, 255).astype(np.uint8)
        operations.append("lee_filter_7x7")

        # 3. CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img = clahe.apply(img)
        operations.append("clahe_3_8x8")

        # Save processed
        filename = os.path.basename(image.original_path)
        processed_path = os.path.join(settings.PROCESSED_DIR, f"proc_{filename}")
        cv2.imwrite(processed_path, img)

        # Update DB
        image.processed_path = processed_path
        if hasattr(image, "preprocess_applied"):
            image.preprocess_applied = True
        self.repo.update(image)

        return PreprocessResponse(
            image_id=image.id,
            original_path=image.original_path,
            processed_path=processed_path,
            operations=operations
        )

