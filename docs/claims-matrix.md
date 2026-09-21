# S.A.G.A.R. Evaluation and Claims Matrix

| Claim | UI location | Source code | Dataset/model artifact | Reproduction command | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 14-Stage Image Processing Pipeline | `/image-processing` | `backend/app/services/image_processing_service.py` | N/A | Upload image | Live |
| Object detection and semantic segmentation | Map & Dashboard | `backend/app/services/ml_inference_service.py` | `narayan-nkj/sagar-sss` | Run pipeline | Live |
| Confidence scoring and noise filtering | Map popups & Review | `backend/app/api/routes_detection.py` | YOLO confidence output | Inspect anomaly | Live |
| Temporal comparison (Epoch differential) | `/temporal` | `frontend/src/pages/TemporalComparison.tsx` | Demo Seed Data | Visit `/temporal` | Live |
| Anomaly reporting (JSON/CSV/PDF) | `/review` | `backend/app/api/routes_reports.py` | DB records | Click "Download" | Live (PDF), JSON/CSV (Pending) |
| Human Review State Transitions | `/review` | `frontend/src/pages/ReviewReport.tsx` | DB `review_status` | Update anomaly state | Live |
| Privacy and Data Attribution | `/privacy-policy` | `frontend/src/pages/PrivacyPolicy.tsx` | N/A | Visit footer links | Planned |

### Empirical Evaluation Metrics
| Metric | Real / Synthetic | Value | Measurement Source |
| :--- | :--- | :--- | :--- |
| Precision | Mixed (Dataset) | 94.2% | YOLOv8 `val` step (`ml/evaluate.py`) |
| Recall | Mixed (Dataset) | 91.5% | YOLOv8 `val` step (`ml/evaluate.py`) |
| mAP@50 | Mixed (Dataset) | 96.7% | YOLOv8 `val` step (`ml/evaluate.py`) |
| mAP@50-95 | Mixed (Dataset) | 78.4% | YOLOv8 `val` step (`ml/evaluate.py`) |
| False Alert Rate | Mixed (Dataset) | 5.8% | Derived (1 - Precision) |
| Latency | Real | ~120ms | Average inference on CPU |
