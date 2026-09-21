# 🌊 S.A.G.A.R. — Ocean-X Command
### Autonomous Underwater Anomaly Intelligence & Seabed Survey Reconnaissance

<div align="center">

[![SIH 2026](https://img.shields.io/badge/Smart_India_Hackathon-2026_National_Finals-0284c7?style=flat-square)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Organization-BPPIMTSIH26-4f46e5?style=flat-square)](https://github.com/BPPIMTSIH26)
[![Problem Statement](https://img.shields.io/badge/Problem_Statement_ID-26057-059669?style=flat-square)](https://github.com/BPPIMTSIH26/SIH26057)

</div>

> **Smart India Hackathon (SIH 2026) | Problem Statement ID: 26057**  
> **Institution:** B.P. Poddar Institute of Management & Technology (**BPPIMTSIH26**)  
> **Lead Architect:** **Narayan Kumar Jha** ([@narayan-nkj](https://github.com/narayan-nkj))

---

## 📌 1. Project Overview & Architecture

S.A.G.A.R. (Sonar Anomaly Geospatial Analytical Reconnaissance) is an end-to-end maritime intelligence command system. It autonomously processes, enhances, detects, and geolocates seabed anomalies using Side-Scan Sonar (SSS) data.

**Architecture:**
- **Frontend**: React 19, TypeScript, Vite, MapLibre GL for 3D geospatial rendering.
- **Backend**: FastAPI, SQLAlchemy, Celery (via Redis), Uvicorn.
- **Machine Learning**: PyTorch (MPS accelerated on macOS), Ultralytics YOLOv8, ONNX Runtime.
- **Data Persistence**: SQLite (dev) / PostgreSQL (prod).

---

## 🖥️ 2. React Frontend & Backend Startup Instructions

### Prerequisites (Python, Node, Docker, Redis)
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **Redis**: Required for Celery task queuing.
- **PostgreSQL**: Optional for production, defaults to SQLite.

### macOS Setup (Apple Silicon / Intel)
Ensure Homebrew is installed, then run:
```bash
brew install redis node python
brew services start redis
```
*Note: PyTorch will automatically utilize `mps` (Metal Performance Shaders) on Apple Silicon.*

### Startup Commands
From the project root:
```bash
# Install dependencies
npm install

# Start both frontend and backend orchestration
bash backend/scripts/mac_demo.sh
# Alternatively: npm start
```

---

## 🔐 3. Environment Variables

Create a `backend/.env` file. **Never commit secrets.**
```env
# Example .env (No secret values)
DATABASE_URL=sqlite:///./sql_app.db
SECRET_KEY=your_secure_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
REDIS_URL=redis://localhost:6379/0
```

---

## 🔬 4. Image Processing & Swath Enhancement Workflow

The 14-stage processing pipeline includes:
- **Acoustic Despeckling**: Lee 7x7 filter to reduce reverberation while preserving shadow boundaries.
- **CLAHE**: Contrast Limited Adaptive Histogram Equalization (clipLimit=3.0, 8x8 grid).

**Workflow**:
1. User uploads a sonar image via the `/upload` or Image Processing UI.
2. The UI immediately reflects a `submitting` state.
3. The image is sent to the FastAPI backend, which creates a background Celery task.
4. The UI polls `/api/v1/image-processing/jobs/{id}` and displays a loading progress bar.
5. Thumbnails resolve correctly using absolute API URLs; if broken, a fallback "Preview Unavailable" state is shown.
6. Once complete, the enhanced image and 5-class QA mask are returned.

---

## 🎯 5. Real Side-Scan Sonar Inference Workflow

1. A real sonar image is passed to the trained ONNX/YOLO model.
2. The model detects bounding boxes and assigns a class confidence.
3. Detected pixel coordinates are projected to geographic latitude/longitude.
4. The frontend fetches anomalies from `/api/anomalies` and renders them on the MapLibre GIS workspace.
5. If inference fails or yields zero detections, it is reported honestly. We do not invent fake detections.

---

## 🧠 6. Model Training, Calibration & ONNX Export

To train the detector natively on macOS (MPS):
```bash
# Run a 5-epoch training loop to generate best.pt
python backend/scripts/train_drishti.py --epochs 5

# Export PyTorch weights to an optimized ONNX graph
python backend/scripts/export_onnx.py
```
The model dynamically creates the dataset configuration (`data.yaml`), trains using YOLOv8n, and exports `backend/models/drishti_best.onnx`.

---

## 🗄️ 7. Dataset Acquisition & Verification

We use the [DRISHTI Side Scan Sonar Dataset](https://huggingface.co/datasets/rehan9599/drishti-sss).

- **Exact Location**: `backend/HG_DATA/`
- **Revision**: `627849579f6dcee0897a112c6796736eb7900032`
- **License**: CC BY-NC-SA 4.0 (Attribution to Rehan9599)
- **Split Counts**:
  - Train: 3,875 images / labels
  - Val: 630 images / labels
  - Test: 700 images / labels
  - Total: 5,205 images / labels
- **Classes**: `crab_pot`, `submarine_pipeline`, `shipwreck`, `ghost_net`, `mine_cylinder`.

**To Download & Verify**:
```bash
python backend/scripts/download_drishti.py
python backend/scripts/verify_drishti_dataset.py
```
This generates `DATASET_VERIFICATION.json` to prove provenance and bounding-box validity.

---

## 🌊 8. Water-Only Map Validation

To prevent anomalies from rendering on land, we employ **Water-Only Validation**:
- **Method**: GeoJSON Polygon validation using Turf.js (`booleanPointInPolygon`) and backend coordinate bounding.
- **Scattered Generation**: The `seed_synthetic_anomalies.py` script samples randomized [longitude, latitude] coordinates within predefined subregions, guaranteeing a scattered 2D distribution instead of collinear lines.
- **Supported Ports**: Mumbai, Chennai, Kolkata (Hooghly River), Kochi, Visakhapatnam, Jawaharlal Nehru, Paradip, Thunder Bay (Lake Huron).

**Diagnostic Inspection**:
The frontend logs rejected points. To inspect rejected/invalid points, open the Browser Console and look for:
`[Diagnostics] Rejected X anomaly markers for rendering on land.`

---

## 🛠️ 9. Database Seed & Coordinate Repair

If legacy demo data contains collinear or land-based points, run the repair script:
```bash
# Dry run to inspect repairs
python backend/scripts/repair_demo_coordinates.py --dry-run

# Apply repairs idempotently
python backend/scripts/repair_demo_coordinates.py
```
*Note: Real production sonar detections are strictly preserved. Only synthetic demo records are moved.*

---

## ✅ 10. Testing & Verification Commands

**Frontend**:
```bash
cd frontend && npm test
npm run build
```

**Backend**:
```bash
cd backend && python -m pytest -q
python -m compileall .
```

**Final Verification**:
```bash
python backend/scripts/final_verify.py
```

---

## 📦 11. Git LFS & External Storage

The DRISHTI dataset (~2.0 GB) is **not** pushed via standard Git to avoid repository size limits.
- The `backend/HG_DATA/` directory is tracked by `.gitignore`.
- Users must run `download_drishti.py` to acquire the exact reproducible dataset locally.
- Git LFS can be used for model binaries (`*.pt`, `*.onnx`) up to your organization's quota limits.

---

## 🤝 12. Contribution Guidelines

1. Ensure you have least-privilege contributor access.
2. Branch from `main`: `git checkout -b feature/your-feature`.
3. Create meaningful, atomic commits. Do not combine unrelated changes.
4. Run `npm test` and `pytest -q` before pushing.
5. Create a Pull Request against `BPPIMTSIH26/SIH26057`.

---

## ⚠️ 13. Known Limitations

- **Map Boundary Precision**: The demo water polygons used for spatial isolation are synthetic bounds intended for demonstration. They are **not** survey-grade nautical charts.
- **Mac Training Speed**: While MPS acceleration is supported, full 100-epoch training may take significant time on base M-series chips.
- **Zero-Detection Edge Cases**: If the model evaluates an image as purely noise, it will return zero detections. This is correct behavior and not a bug.
