"""
Demo detection provider — zero heavy dependencies.

Returns deterministic synthetic detections seeded from the image path.
Used when MODEL_PROVIDER=demo so the app runs on Render without
requiring torch / ultralytics (2 GB+).
"""
import hashlib
import random
from typing import List

from app.schemas.detection import DetectionResult, BBox
from app.ml.base_provider import BaseDetectionProvider


_CLASSES = ["human", "metal_debris", "ghost_net", "unknown_man_made_object"]


class DemoDetectionProvider(BaseDetectionProvider):
    """Returns synthetic detections for demonstration purposes."""

    @property
    def provider_name(self) -> str:
        return "demo"

    def detect(self, image_path: str) -> List[DetectionResult]:
        # Seed from path so results are consistent per image.
        seed = int(hashlib.md5(image_path.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)

        num_detections = rng.randint(0, 3)
        results: List[DetectionResult] = []

        for _ in range(num_detections):
            cls = rng.choice(_CLASSES)
            x1 = rng.uniform(0.05, 0.6)
            y1 = rng.uniform(0.05, 0.6)
            x2 = x1 + rng.uniform(0.1, 0.35)
            y2 = y1 + rng.uniform(0.1, 0.35)
            conf = rng.uniform(0.52, 0.97)

            results.append(
                DetectionResult(
                    class_name=cls,
                    confidence=round(conf, 3),
                    bbox=BBox(
                        x1=round(x1, 4),
                        y1=round(y1, 4),
                        x2=round(x2, 4),
                        y2=round(y2, 4),
                    ),
                )
            )

        return results
