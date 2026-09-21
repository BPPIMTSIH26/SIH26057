# Multi-Class Model Verification

This report confirms the classification fidelity of the DRISHTI Sonar anomaly detector against the established taxonomy.

## Dataset Class Distribution
The DRISHTI dataset uses the following strict YOLO integer-to-class mapping:
- `0`: `crab_pot`
- `1`: `submarine_pipeline`
- `2`: `shipwreck`
- `3`: `ghost_net`
- `4`: `mine_cylinder`

## Verification Observations
- **Label Alignment**: Analysis of the training labels in `backend/HG_DATA` verified that classes `0` through `4` are actively utilized. The `drishti.yaml` data contract perfectly mirrors this taxonomy.
- **Inference Decoding**: During processing via the FastAPI backend (`backend/app/ml/inference.py`), the array mapping exactly correlates the integer predictions from the YOLO bounding box tensor to these 5 distinct strings.
- **Frontend Presentation**: The React dashboard displays these specific anomaly tags, color-coding markers and maintaining correct metadata association upon API retrieval.

**Verification Status**: ✅ PASSED. All 5 classes are preserved end-to-end from Hugging Face ground truth through to the MapLibre visualization.
