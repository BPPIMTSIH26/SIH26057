# 🌊 S.A.G.A.R. — Ocean-X Command
### Autonomous Underwater Anomaly Intelligence & Seabed Survey Reconnaissance

<div align="center">

[![SIH 2026](https://img.shields.io/badge/Smart_India_Hackathon-2026_National_Finals-0284c7?style=flat-square)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Organization-BPPIMTSIH26-4f46e5?style=flat-square)](https://github.com/BPPIMTSIH26)
[![Problem Statement](https://img.shields.io/badge/Problem_Statement_ID-26057-059669?style=flat-square)](https://github.com/BPPIMTSIH26/SIH26057)
[![Architecture](https://img.shields.io/badge/Architecture-FastAPI_•_React_19_•_PyTorch_•_MapLibre-0f172a?style=flat-square)](#)
[![Dataset](https://img.shields.io/badge/Dataset-HuggingFace_narayan--nkj%2Fsagar--sss-ff9000?style=flat-square)](https://huggingface.co/datasets/narayan-nkj/sagar-sss)

</div>

> **Smart India Hackathon (SIH 2026) | Problem Statement ID: 26057**  
> **Institution:** B.P. Poddar Institute of Management & Technology (**BPPIMTSIH26**)  
> **Lead Architect & Deep Learning Engineer:** **Narayan Kumar Jha** ([@narayan-nkj](https://github.com/narayan-nkj))

---

## 📌 Problem Statement Overview (SIH 26057)

| Attribute | Specification Details |
| :--- | :--- |
| **Problem Statement ID** | **26057** |
| **Problem Statement Title** | **AI-assisted seabed survey analysis for faster anomaly detection & classification** |
| **Category** | Software / Maritime Defense / Hydrographic Intelligence |
| **Domain Bucket** | Smart Automation / Robotics & Autonomous Systems / Earth & Marine Sciences |
| **Target End-Users** | Hydrographic Surveyors, Naval Defense Units, Port Authorities, Offshore Energy Operators |
| **Core Innovation** | Zero-Shot Open-World Anomaly Detection + 14-Stage Acoustic Filtering + Multi-Modal Verification |

### The Real-World Challenge
Side-Scan Sonar (SSS) and Synthetic Aperture Sonar (SAS) surveys generate massive volumes of acoustic backscatter data during seabed mapping operations. Traditional survey analysis faces critical bottlenecks:
1. **Severe Acoustic Noise & Artifacts**: High speckle noise, non-uniform time-varied gain (TVG) attenuation, blind nadir gaps, and acoustic shadow occlusions.
2. **Open-World Anomaly Dilemma**: Standard detectors fail on novel or rare underwater objects (unexploded ordnance, severed submarine cables, novel wrecks) not present in rigid training datasets.
3. **Fatigue & Latency in Manual Review**: Human hydrographers take hours or days to manually scan gigabytes of waterfall acoustic imagery, delaying critical maritime safety decisions.
4. **Lack of Multi-Modal Confirmation**: Sonar alone cannot definitively confirm target identity without cross-referencing optical / camera sensor feeds from Autonomous Underwater Vehicles (AUVs).

---

## 💡 The S.A.G.A.R. Solution
**S.A.G.A.R.** (**S**onar **A**nomaly **G**eospatial **A**nalytical **R**econnaissance) is an end-to-end maritime intelligence command system designed to autonomously process, enhance, detect, cross-verify, and report seabed anomalies with sub-meter geospatial accuracy.

```mermaid
flowchart TD
    A[Raw Sonar Swath / Survey Feed] --> B[14-Stage Image Processing Pipeline]
    B --> C[Acoustic Despeckling & CLAHE]
    C --> D[Quality Assessment & 5-Class Mask Gen]
    D --> E[Multi-Scale Feature Extractor & Baseline Normality]
    
    E --> F{Dual Inference Engine}
    F -->|Known Hazard Classifier| G[Ultralytics YOLO11 / ONNX Detector]
    F -->|Open-World Novelty Model| H[Mahalanobis Seabed Normality Engine]
    
    G --> I[Candidate Anomaly Georeferencing]
    H --> I
    
    I --> J[Temporal Change Engine: Epoch Differential]
    J --> K[Multi-Modal Optical Cross-Verification]
    K --> L[Automated Priority Triage Matrix P1 / P2 / P3]
    
    L --> M[Interactive MapLibre GIS Workspace]
    L --> N[Supreme Admin Command & Access Console]
    L --> O[Automated Hydrographic PDF / JSON Mission Report]
```

---

## 🌟 The Five Pillars of Intelligence

### 1. 🌐 Local Seabed Baseline Normality Engine
- Computes acoustic texture, roughness, and intensity statistics across local sliding windows.
- Calculates **Mahalanobis Distance** against the local geological baseline to answer: *"What is statistically abnormal for this specific seabed patch?"*
- Robust against variable seabed geologies (mud, sand ripples, rocky reefs, silt).

### 2. 🎯 Open-World Zero-Shot Anomaly Detection
- Powered by high-speed **ONNX Runtime** and **Ultralytics YOLO11 (trained on AquaScan-1K)** for real-time edge or cloud deployment.
- Detects high-reflectance acoustic highlights paired with physical acoustic shadows to accurately estimate 3D target height and footprint.
- Classifies critical hazard categories:
  - **Shipwrecks** (Nordmeer, Grecian, Defiance, Monohansett, John J. Audubon)
  - **Ghost Fishing Nets & Marine Entanglements**
  - **Subsea Pipelines & Structural Leaks**
  - **Explosive Ordnance / Mine Cylinders**

### 3. 🕰️ Temporal Change Detection Engine
- Compares sonar swaths from sequential survey epochs (e.g., month-over-month) using normalized cross-correlation and structural similarity indexing (SSIM).
- Automatically flags new objects, disappeared objects, or significant shape/reflectance changes in repeated seabed transects.

### 4. 🔬 5-Class Quality Assurance Mask Generator
Generates a pixel-accurate diagnostic overlay over every processed sonar tile:
- 🟩 **Clear Seabed** (background / known geology)
- 🟨 **Anomalous High-Reflectance Targets**
- 🟦 **Acoustic Shadow Regions**
- 🟥 **Sensor Dropout / Saturated Pixels**
- ⬛ **Nadir / Ignored Regions**

### 5. 🛡️ Military-Grade Access Control & Supreme Admin Console
- **Multi-Factor Gmail OTP Verification**: High-security email dispatch for operator authentication.
- **Auto-Lookup Personnel Registry**: Instant pre-filling of registered naval and hydrographic personnel details.
- **Supreme Admin Authorization Gateway**:
  - Restricts access until new accounts are explicitly approved by the Supreme Admin (`narayan.nkj@gmail.com`).
  - Real-time approval, role upgrade (Analyst, Operator, Supreme Admin), or instant revocation.

---

## 🖥️ System Architecture & UI Tour

<div align="center">

| Module | Route / Component | Description |
| :--- | :--- | :--- |
| **Tactical Dashboard** | `/` (`Dashboard.tsx`) | Real-time mission health, sensor telemetry, active alerts, and priority triage feed. |
| **Geospatial GIS Map** | `/map` (`MapWorkspace.tsx`) | Full MapLibre GL map with bathymetric layers, swath navigation tracks, and bounding boxes. |
| **14-Stage Processing Lab** | `/image-processing` (`ImageProcessing.tsx`) | Interactive side-by-side viewer for raw, enhanced, and 5-class QA diagnostic masks. |
| **Temporal Comparison** | `/temporal` (`TemporalComparison.tsx`) | Epoch-over-epoch differential analysis to detect seabed shifts and newly submerged targets. |
| **Survey Upload Portal** | `/upload` (`UploadProcess.tsx`) | Ingest raw SSS/SAS waterfalls, side-scan TIFFs, and AUV optical camera survey packages. |
| **Mission Review & Reports** | `/review` (`ReviewReport.tsx`) | Comprehensive hazard classification, confidence breakdowns, and exportable mission dossiers. |
| **Supreme Admin Console** | `/settings` (`Settings.tsx`) | Manage operator credentials, grant/revoke clearance, and inspect system audit logs. |

</div>

---

## 🛠️ Technology Stack

```
SIH26057-OceanX/
├── backend/                 # FastAPI API, YOLOv8/ONNX Models & Auditing Module
│   ├── app/                 # Routers, ML inference, services & database models
│   ├── auditing/            # Audit reports, API specifications, launch scripts & configs
│   ├── data/                # Bathymetric sonar swaths, imagery, and SQLite db
│   ├── models/              # Pretrained neural network weights (YOLO / ONNX)
│   └── tests/               # Auth, security, and image processing test suites
├── frontend/                # React 19 + TypeScript + Vite + MapLibre GL 3D
│   ├── src/                 # Tactical dashboard, map workspace, processing lab
│   └── public/              # High-resolution hydrographic assets and UI icons
├── package.json             # Root unified launcher scripts (npm start, npm stop)
└── README.md                # System documentation & technical specification
```

### Core Technologies
- **Frontend**: React 19, TypeScript, Vite 5, Tailwind CSS v4, MapLibre GL JS, Recharts, Lucide Icons.
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2.
- **Computer Vision & AI**: OpenCV (`cv2`), PyTorch, Ultralytics YOLO11, ONNX Runtime, NumPy, SciPy, Pillow.
- **Geospatial Processing**: Shapely, PyProj, GeoPandas, Turf.js.
- **Security**: Argon2/PBKDF2 password hashing, JWT bearer tokens, SMTP Gmail OTP integration.
- **DevOps & Deployment**: Docker Compose, Vercel (frontend), Render (backend), Shell Automation (`start.sh`, `stop.sh`).

### ☁️ Cloud Data Storage

All production data is stored on **Neon** — a serverless, auto-scaling cloud platform:

| Layer | Service | Details |
| :--- | :--- | :--- |
| **Relational Database** | [Neon Serverless PostgreSQL](https://neon.tech) | Stores all mission records, anomaly detections, user accounts, image processing jobs, and audit logs via SQLAlchemy ORM. Connection pooling is handled by Neon's built-in PgBouncer (`-pooler` endpoint). |
| **Blob / Object Storage** | Neon S3-Compatible Blob Store | All uploaded sonar imagery, processed outputs (enhanced tiles, quality masks, inference overlays), and report assets are stored in an S3-compatible bucket (`assets`) hosted on Neon's integrated blob storage. Accessed via `boto3` with S3v4 signatures. |
| **Local Fallback** | Filesystem (`data/uploads/`) | When cloud storage is unavailable (e.g., local development without credentials), the backend gracefully falls back to the local `data/uploads/` directory. All API image URLs are transparently served from either source. |

> **Configuration**: All cloud credentials are set via environment variables (`DATABASE_URL`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`). See `.env.example` for the full template.

---


## 🗄️ S.A.G.A.R. Side-Scan Sonar Dataset

The sonar training dataset is maintained separately on Hugging Face by **Narayan Kumar Jha** and is automatically fetched at startup — it is **not** bundled with this repository to keep cloning instant.

> 📦 **Dataset**: [narayan-nkj/sagar-sss](https://huggingface.co/datasets/narayan-nkj/sagar-sss) on Hugging Face Hub  
> 👤 **Curator**: Narayan Kumar Jha ([@narayan-nkj](https://github.com/narayan-nkj))  
> 📐 **Format**: YOLO — `{split}/images/*.jpg` + `{split}/labels/*.txt`, 640 px tiles  
> 🏷️ **License**: CC-BY-SA-4.0  

| Split | Images | Labels |
| :--- | :--- | :--- |
| train | 3,875 | 3,875 |
| val | 630 | 630 |
| test | 700 | 700 |
| **total** | **5,205** | **5,205** |

**Detected Classes:**

| ID | Class | Present |
| :--- | :--- | :--- |
| 0 | `crab_pot` | — (excluded) |
| 1 | `submarine_pipeline` | ✓ |
| 2 | `shipwreck` | ✓ |
| 3 | `ghost_net` | ✓ (100% synthetic) |
| 4 | `mine_cylinder` | ✓ |

The dataset is fetched automatically on first startup by `backend/scripts/fetch_huggingface_dataset.py`. No manual download needed.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Git**
- *(Optional)* **Docker & Docker Compose**

---

### Option A: One-Command Startup (Recommended)

From the project root directory, execute:

```bash
# Preferred: Launch entire platform (Backend on :8000 & Frontend on :5173)
npm start
```

*Or directly via the orchestration script:*
```bash
bash backend/auditing/scripts/start.sh
```

*To gracefully stop all background services:*
```bash
npm stop
```

- **Frontend Application**: `http://localhost:5173`
- **Backend Swagger API**: `http://localhost:8000/docs`
- **Interactive Backend Root**: `http://localhost:8000`

---

### Option B: Manual Setup

#### 1. Backend Service (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Launch FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Application (React + Vite)
```bash
cd frontend

# Install packages
npm install

# Launch Vite development server
npm run dev
```

---

### Option C: Docker Compose

```bash
docker-compose up --build
```

---

## 🛡️ Personnel Access Governance & Clearance Tiers

| Role | Authorized Identifier | Clearance & Operational Capabilities |
| :--- | :--- | :--- |
| **Supreme Admin** | `narayan.nkj@gmail.com` | Full System Governance, Operator Approval & Clearance Delegation, Access Revocation, Mission Triage |
| **Senior Operator** | `admin@sonarnetra.mil` | Mission Command, 14-Stage Processing, Model Execution, Report Export |
| **Field Analyst** | `analyst@sonarnetra.mil` | Sonar Swath View, Anomaly Inspection, Optical Verification |

> **Security & Authentication Protocol**: All operator credentials are encrypted with salted hashes (Argon2 / PBKDF2) and validated dynamically via multi-factor Gmail OTP dispatch. Direct plaintext passwords are strictly prohibited across documentation and repositories.

---

## ⚠️ Model Limitations & Prototype Results

> **NOTE:** All performance metrics, confidence scores, and processing benchmarks presented in this documentation and within the application represent **prototype results** derived from controlled testing environments.

### Primary Limitations
1. **Highly Turbid Environments**: The model struggles in areas with excessive suspended sediment or organic material which causes severe acoustic scattering.
2. **Depth Constraints**: Operations beyond 100 meters depth or in extreme thermocline layers may result in degraded detection accuracy due to sound velocity profile variations.
3. **Nadir Blind Spots**: Standard side-scan sonar limitations apply; the model cannot detect objects directly beneath the towfish (the nadir gap) unless complementary downward-facing sensors are fused.
4. **Novel Geologies**: While the Mahalanobis novelty engine handles most seabeds, extreme volcanic rock formations can currently trigger higher false-positive anomaly rates.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate operator and generate JWT token |
| `GET` | `/api/auth/lookup-operator` | Auto-lookup registered personnel by email |
| `POST` | `/api/auth/send-otp` | Dispatch 6-digit verification code to Gmail |
| `POST` | `/api/auth/verify-otp` | Validate submitted OTP code |
| `GET` | `/api/auth/users` | List all registered personnel *(Supreme Admin only)* |
| `PATCH` | `/api/auth/users/{id}/access` | Grant or revoke operator access clearance |
| `GET` | `/api/anomalies` | Retrieve all detected seabed anomalies with coordinates |
| `GET` | `/api/missions` | Query active and archived survey missions |
| `POST` | `/api/v1/image-processing/jobs` | Submit sonar image for 14-stage enhancement & QA masking |
| `GET` | `/api/v1/image-processing/jobs/{id}` | Inspect processing progress and download enhanced artifacts |
| `GET` | `/api/reports/generate/{id}` | Generate formal hydrographic anomaly dossier (PDF/JSON) |

---

## 👥 Hackathon Team & Acknowledgements

- **Organization**: **BPPIMTSIH26** (B.P. Poddar Institute of Management and Technology)
- **Smart India Hackathon 2026**: Problem Statement **26057**
- **Project Title**: Ocean-X (S.A.G.A.R. Command)

### Team Structure & Contributions:

#### 🌟 Core Project Leadership
- 👑 **Narayan Kumar Jha** ([@narayan-nkj](https://github.com/narayan-nkj)) — **Team Lead, System Architect & Full-Stack Intelligence Lead** *(Supreme Admin)*
- 💡 **Ahana** ([@I-Lawrence](https://github.com/I-Lawrence)) — **Core Lead: Deep Learning & Acoustic Feature Modeling**
- 🎯 **Ishika Chowdhury** ([@i5hika0x](https://github.com/i5hika0x)) — **Core Lead: Sonar Vision & Geospatial Intelligence**

#### ⚓ Engineering & Domain Specialists
- 🌐 **Sayantan Pachal** ([@sayantan-pachal](https://github.com/sayantan-pachal)) — **Geospatial Processing & GIS Swath Pipeline Specialist**
- ⚙️ **Shivam Gupta** ([@shiv2345king](https://github.com/shiv2345king)) — **Backend Infrastructure & Model Optimization Engineer**
- 🔬 **Shougata Sikder** ([@Shougata2003](https://github.com/Shougata2003)) — **Hydrographic Anomaly Verification & QA Pipeline Specialist**

---

<div align="center">
  <sub>Engineered with precision for Smart India Hackathon 2026. S.A.G.A.R. Command System.</sub>
</div>
