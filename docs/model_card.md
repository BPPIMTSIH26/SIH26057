---
language:
- en
license: apache-2.0
tags:
- computer-vision
- object-detection
- yolo
- yolov8
- onnx
- sonar
- anomaly-detection
- sagar
metrics:
- mAP
---

# SAGAR SonarVision - Underwater Anomaly Detection

**SAGAR (SonarVision)** is a state-of-the-art YOLOv8-based object detection model optimized for Side-Scan Sonar (SSS) imagery. It is designed to autonomously detect and classify underwater anomalies and objects of interest with high precision.

This repository hosts the **ONNX** exported version of the model, enabling highly efficient, cross-platform inference on edge devices, autonomous underwater vehicles (AUVs), and marine monitoring stations.

## 📊 Model Details
- **Architecture:** YOLOv8 (Ultralytics)
- **Format:** ONNX (`.onnx`)
- **Input Size:** 640x640 pixels
- **Training Epochs:** 100
- **Primary Use Case:** Underwater Sonar Anomaly Detection

### 🎯 Detected Classes
The model is trained to detect the following 5 distinct underwater classes:
1. `human` (Divers / Swimmers)
2. `ghost_net` (Abandoned fishing nets)
3. `submarine_pipeline` (Underwater infrastructure)
4. `shipwreck` (Sunken vessels)
5. `mine_cylinder` (Unexploded ordnance / cylindrical objects)

---

## 📈 Evaluation Metrics

The model was rigorously evaluated on a synthetic and real-world side-scan sonar validation set. 

| Metric | Score |
|---|---|
| **mAP50 (Mean Average Precision)** | **0.764** |
| **mAP50-95** | 0.538 |
| **Overall Precision (P)** | 0.788 |
| **Overall Recall (R)** | 0.740 |

### Class-Specific mAP50 Breakdown:
* **Ghost Net:** `0.995`
* **Submarine Pipeline:** `0.994`
* **Human:** `0.752`
* **Shipwreck:** `0.545`
* **Mine Cylinder:** `0.533`

---

## 💻 How to Use (Inference)

You can easily run inference on this ONNX model using the `ultralytics` package or raw `onnxruntime` in Python.

### Prerequisites
```bash
pip install ultralytics onnxruntime huggingface_hub
```

### Python Snippet (Ultralytics API)
The easiest way to perform inference and utilize automatic non-maximum suppression (NMS):

```python
from ultralytics import YOLO
from huggingface_hub import hf_hub_download

# 1. Download the model from Hugging Face
model_path = hf_hub_download(repo_id="Narayan-nkj/sagar-sonar-detector", filename="sonar_detector.onnx")

# 2. Load the ONNX model
model = YOLO(model_path, task='detect')

# 3. Run Inference on a sonar image
results = model.predict("path/to/your/sonar_image.jpg", conf=0.50)

# 4. Display Results
for result in results:
    result.show()  # Displays the image with bounding boxes
```

---

## ⚠️ Limitations & Intended Use
* **Acoustic Shadows:** The model relies heavily on the acoustic shadow signatures present in side-scan sonar. Performance may degrade if the sonar altitude or grazing angle drastically alters the shadow profiles.
* **Environmental Noise:** High sea states, thermoclines, or excessive water column noise may induce false positives. A confidence threshold of >= 0.60 is recommended for production deployments.

## 🤝 Citation & Acknowledgements
Developed as part of the **NetraSonar** project for autonomous underwater surveillance and environmental cleanup initiatives.
