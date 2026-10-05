import os
import logging
from fastapi import HTTPException
from app.core.config import get_settings
from app.ml.base_provider import BaseDetectionProvider

logger = logging.getLogger("sonar-x.model_manager")
settings = get_settings()

class ModelManager:
    _instance = None
    _provider: BaseDetectionProvider = None
    _load_error: str = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialize_provider()
        return cls._instance

    def _initialize_provider(self):
        """
        Attempt to load the configured model provider.
        On failure: logs the error and sets _load_error instead of raising.
        The backend remains operational; inference endpoints return 503.
        """
        try:
            provider = settings.MODEL_PROVIDER.lower()

            if provider == "demo":
                from app.ml.demo_provider import DemoDetectionProvider
                self._provider = DemoDetectionProvider()
                logger.info("Loaded Demo detection provider (synthetic detections)")

            elif provider == "onnx":
                model_path = os.path.join(settings.MODEL_DIR, "sonar_detector.onnx")
                from app.ml.onnx_provider import OnnxYOLOProvider
                self._provider = OnnxYOLOProvider(model_path)
                logger.info(f"Loaded ONNX model from {model_path}")

            else:
                # YOLO provider — requires torch + ultralytics
                candidate_paths = [
                    os.path.join(settings.MODEL_DIR, "unified_run", "weights", "best.pt"),
                    os.path.join(settings.MODEL_DIR, "sagar_run", "weights", "best.pt"),
                    os.path.join(settings.MODEL_DIR, "aquascan_model", "weights", "best.pt"),
                    os.path.join(settings.MODEL_DIR, "yolov8n.pt"),
                    os.path.join(settings.MODEL_DIR, "best.pt"),
                ]
                model_path = None
                for p in candidate_paths:
                    if os.path.exists(p) and os.path.getsize(p) > 100000:
                        model_path = p
                        break
                if not model_path:
                    model_path = candidate_paths[0]

                from app.ml.yolo_provider import RealYOLOProvider
                self._provider = RealYOLOProvider(model_path)
                logger.info(f"Loaded YOLO model from {model_path}")

            self._load_error = None
        except Exception as e:
            self._provider = None
            self._load_error = str(e)
            logger.error(
                f"Model load failed ({settings.MODEL_PROVIDER}): {e}. "
                "Inference endpoints will return 503 until the model is available."
            )

    def get_provider(self) -> BaseDetectionProvider:
        if self._provider is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Model not available: {self._load_error}. "
                    "Ensure the model file exists and restart the backend."
                )
            )
        return self._provider

    def get_status(self) -> dict:
        if self._provider is None:
            return {
                "provider": settings.MODEL_PROVIDER,
                "model_name": "UNAVAILABLE",
                "loaded": False,
                "error": self._load_error,
                "classes": [],
            }
        provider_name = self._provider.provider_name
        model_name = (
            "SONAR-X ONNX Model" if provider_name == "onnx"
            else "SONAR-X YOLO Model"
        )
        classes = ["human", "metal_debris", "ghost_net", "unknown_man_made_object", "crab_pot", "submarine_pipeline", "shipwreck", "mine_cylinder", "reef"]
        if hasattr(self._provider, 'model') and hasattr(self._provider.model, 'names'):
            classes = list(self._provider.model.names.values())
        elif hasattr(self._provider, 'classes') and self._provider.classes:
            classes = self._provider.classes

        return {
            "provider": provider_name,
            "model_name": model_name,
            "version": "1.0",
            "classes": classes,
            "loaded": True,
        }

model_manager = ModelManager()

