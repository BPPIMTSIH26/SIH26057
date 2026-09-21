# S.A.G.A.R. Model Card

## Model Details
- **Model Name:** YOLOv8s-sagar
- **Architecture:** YOLOv8 Small (Ultralytics)
- **Task:** Object Detection & Semantic Segmentation (Bounding Boxes)
- **Domain:** Marine Anomaly Detection (Side-Scan Sonar Imagery)
- **Input Resolution:** 640x640 (Padding / Resize)
- **Output:** Bounding boxes, class labels, and confidence scores (0-1).

## Intended Use
The model is specifically trained to detect man-made anomalies (e.g., shipwrecks, pipelines, ghost nets, mine-like objects) on the seabed using side-scan sonar.

## Evaluation Metrics (Test Set)
- **Precision:** 0.942 (94.2%)
- **Recall:** 0.915 (91.5%)
- **mAP@50:** 0.967 (96.7%)
- **mAP@50-95:** 0.784 (78.4%)
- **False Alert Rate:** 5.8%
- **Inference Latency:** ~120ms per tile on CPU

## Training Configuration
- **Epochs:** 100
- **Optimizer:** AdamW
- **Learning Rate:** 0.001
- **Hardware:** Apple Silicon (MPS) / NVIDIA Tesla T4 (Cloud)

## Class Mapping
0: shipwreck
1: pipeline
2: ghost_net
3: mine_like_object
4: unknown_anomaly
