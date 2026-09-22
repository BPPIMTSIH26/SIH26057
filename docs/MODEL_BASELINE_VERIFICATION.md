# Model Baseline Verification

## Preprocessing Contract
The S.A.G.A.R dataset requires a precise preprocessing sequence to match the synthetic aperture characteristics.
1. **Adaptive Despeckling**: Lee Filter (7x7 window size).
2. **CLAHE**: Contrast Limited Adaptive Histogram Equalization with `clipLimit=3.0` and a tileGridSize of `(8, 8)`.
3. **Dimensions**: The inputs are scaled to 640x640 for the detection engine.

## Model Training (YOLOv8)
The model was dynamically trained using `backend/scripts/train_sagar.py` running on Apple Metal Performance Shaders (MPS). 

- **Input**: 5,205 labeled images
- **Classes**: 5 (`crab_pot`, `submarine_pipeline`, `shipwreck`, `ghost_net`, `mine_cylinder`)
- **Output Artifact**: `backend/models/sagar_run/weights/best.pt`

## ONNX Execution Path
The `best.pt` model was exported to an ONNX graph (`src/models/sonar_detector.onnx`) via `backend/scripts/export_onnx.py`. The ONNX format acts as a deterministic, framework-agnostic payload optimized for deployment in the edge environment via `onnxruntime`.

**Verification Status**: ✅ PASSED. The pipeline functions natively on macOS.
