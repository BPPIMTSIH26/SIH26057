import os
import cv2
import numpy as np
from typing import List
from app.ml.base_provider import BaseDetectionProvider
from app.schemas.detection import DetectionResult, BBox
from app.core.config import get_settings

settings = get_settings()

class OnnxYOLOProvider(BaseDetectionProvider):
    def __init__(self, model_path: str):
        self.model_path = self._resolve_model_path(model_path)
        self.session = None
        self.input_name = None
        self.input_shape = None
        self.classes = [
            "crab_pot",
            "submarine_pipeline",
            "shipwreck",
            "ghost_net",
            "mine_cylinder",
            "metal_debris",
            "human",
            "unknown_man_made_object"
        ]
        self._load_model()

    def _resolve_model_path(self, path: str) -> str:
        candidates = [
            path,
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "sonar_detector.onnx"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "sagar_run", "weights", "best.onnx"),
            "models/sonar_detector.onnx",
            "models/sagar_run/weights/best.onnx",
            "backend/models/sonar_detector.onnx",
            "backend/models/sagar_run/weights/best.onnx"
        ]
        for c in candidates:
            if os.path.exists(c) and os.path.getsize(c) > 100000:
                return c
        return path
        
    def _load_model(self):
        if not os.path.exists(self.model_path) or os.path.getsize(self.model_path) < 100000:
            # Attempt to copy or fetch
            try:
                from scripts.fetch_model import main as fetch_main
                fetch_main()
            except Exception:
                pass
            
        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
            self.input_name = self.session.get_inputs()[0].name
            self.input_shape = self.session.get_inputs()[0].shape
        except Exception as e:
            raise RuntimeError(f"Failed to load ONNX model at {self.model_path}: {e}")

    @property
    def provider_name(self) -> str:
        return "onnx"
        
    def _preprocess(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read {image_path}")
            
        original_h, original_w = img.shape[:2]
        
        input_h, input_w = 640, 640 
        if self.input_shape and isinstance(self.input_shape[2], int):
            input_h, input_w = self.input_shape[2], self.input_shape[3]
            
        img_resized = cv2.resize(img, (input_w, input_h))
        img_chw = img_resized.transpose((2, 0, 1))
        img_rgb = img_chw[::-1, :, :]
        img_tensor = np.ascontiguousarray(img_rgb, dtype=np.float32) / 255.0
        img_tensor = np.expand_dims(img_tensor, axis=0)
        
        return img_tensor, original_w, original_h, input_w, input_h

    def _nms(self, boxes, confidences, iou_threshold=0.45):
        if len(boxes) == 0:
            return []
        boxes_arr = np.array(boxes)
        conf_arr = np.array(confidences)
        x1 = boxes_arr[:, 0]
        y1 = boxes_arr[:, 1]
        x2 = boxes_arr[:, 2]
        y2 = boxes_arr[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = conf_arr.argsort()[::-1]
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter)
            inds = np.where(ovr <= iou_threshold)[0]
            order = order[inds + 1]
        return keep

    def detect(self, image_path: str) -> List[DetectionResult]:
        if not self.session:
            raise RuntimeError("ONNX model is not loaded")
            
        try:
            img_tensor, orig_w, orig_h, in_w, in_h = self._preprocess(image_path)
            
            outputs = self.session.run(None, {self.input_name: img_tensor})
            output = outputs[0]
            output = output[0].T
            
            raw_detections = []
            
            for row in output:
                class_scores = row[4:]
                if len(class_scores) == 0:
                    continue
                    
                cls = int(np.argmax(class_scores))
                conf = float(class_scores[cls])
                
                threshold = min(settings.CONFIDENCE_THRESHOLD, 0.30)
                if conf > threshold:
                    cx, cy, w, h = row[0:4]
                    cx = cx * (orig_w / in_w)
                    cy = cy * (orig_h / in_h)
                    w = w * (orig_w / in_w)
                    h = h * (orig_h / in_h)
                    
                    x1 = cx - (w / 2)
                    y1 = cy - (h / 2)
                    x2 = cx + (w / 2)
                    y2 = cy + (h / 2)
                    
                    class_name = self.classes[cls] if cls < len(self.classes) else f"anomaly_{cls}"
                    raw_detections.append({
                        "class_name": class_name,
                        "confidence": conf,
                        "bbox": [x1, y1, x2, y2],
                        "area": float(w * h)
                    })
                    
            if raw_detections:
                boxes = [d["bbox"] for d in raw_detections]
                confs = [d["confidence"] for d in raw_detections]
                keep = self._nms(boxes, confs, iou_threshold=0.45)
                raw_detections = [raw_detections[i] for i in keep]
                
            return [
                DetectionResult(
                    class_name=d["class_name"],
                    confidence=d["confidence"],
                    bbox=BBox(x1=d["bbox"][0], y1=d["bbox"][1], x2=d["bbox"][2], y2=d["bbox"][3]),
                    area=d["area"]
                )
                for d in raw_detections
            ]
            
        except Exception as e:
            import logging
            logger = logging.getLogger("sonar-x.onnx")
            logger.error(f"Inference error: {e}")
            return []

