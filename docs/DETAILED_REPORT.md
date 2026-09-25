# 🌊 S.A.G.A.R. (Ocean-X Command) — Comprehensive Technical Report
## AI-Assisted Seabed Survey Analysis for Faster Anomaly Detection & Classification
**Smart India Hackathon (SIH 2026) | Problem Statement ID: 26057**  
**Lead Organization:** Ministry of Earth Sciences (MoES) / National Institute of Ocean Technology (NIOT)  
**Academic Institution:** B.P. Poddar Institute of Management & Technology (**BPPIMTSIH26**) — Team Orion  
**Lead Architect & Deep Learning Engineer:** Narayan Kumar Jha ([@narayan-nkj](https://github.com/narayan-nkj))  
**Document Classification:** Technical Architecture, Engineering Feasibility & Operational Impact Dossier  
**Revision:** v2.4 (Production Baseline)

---

## Executive Summary

The **S.A.G.A.R.** (**S**onar **A**nomaly **G**eospatial **A**nalytical **R**econnaissance) platform is a full-stack maritime intelligence command and autonomous acoustic analysis system developed specifically for the **Smart India Hackathon 2026** (Problem Statement ID: **26057**). Designed to address critical operational bottlenecks faced by hydrographic agencies, naval defense units, port authorities, and offshore energy operators, S.A.G.A.R. automates the labor-intensive, fatigue-prone task of scanning gigabytes of side-scan sonar (SSS) and synthetic aperture sonar (SAS) waterfalls.

By uniting a **14-Stage Deterministic Acoustic Preprocessing Pipeline**, a **Dual-Core Machine Learning Engine** (comprising an edge-optimized Ultralytics YOLOv8/YOLO11 detector and an unsupervised Mahalanobis seabed normality baseline model), a **Temporal Epoch Change Engine**, and an interactive **MapLibre 3D Geospatial GIS Console**, S.A.G.A.R. reduces seabed survey review latency by up to **90%**, maintains a mean average precision (**mAP@50 of 0.967 / 96.7%** on benchmarked sonar anomalies), and provides sub-meter georeferenced anomaly dossiers conforming to International Hydrographic Organization (IHO S-44) standards.

---

## Table of Contents
1. [Codebase Architecture & Implemented Technologies](#1-codebase-architecture--implemented-technologies)
2. [Technologies to Be Used (Hardware, Sensors & Edge Stack)](#2-technologies-to-be-used-hardware-sensors--edge-stack)
3. [Methodology & Process for Implementation](#3-methodology--process-for-implementation)
   - [3.1 End-to-End Operational Workflow](#31-end-to-end-operational-workflow)
   - [3.2 14-Stage Deterministic Acoustic Pipeline](#32-14-stage-deterministic-acoustic-pipeline)
   - [3.3 Dual-Core Intelligence Engine (YOLO + Mahalanobis Distance)](#33-dual-core-intelligence-engine-yolo--mahalanobis-distance)
   - [3.4 Working Prototype UI & Module Architecture](#34-working-prototype-ui--module-architecture)
4. [Analysis of Feasibility](#4-analysis-of-feasibility)
   - [4.1 Technical Feasibility](#41-technical-feasibility)
   - [4.2 Operational Feasibility](#42-operational-feasibility)
   - [4.3 Economic & Commercial Feasibility](#43-economic--commercial-feasibility)
5. [Potential Challenges & Technical Risks](#5-potential-challenges--technical-risks)
6. [Strategies for Overcoming Challenges](#6-strategies-for-overcoming-challenges)
7. [Potential Impact on Target Audience](#7-potential-impact-on-target-audience)
8. [Comprehensive Benefits of the Solution](#8-comprehensive-benefits-of-the-solution)
   - [8.1 Social & Cultural Heritage Benefits](#81-social--cultural-heritage-benefits)
   - [8.2 Economic & Industrial Benefits](#82-economic--industrial-benefits)
   - [8.3 Environmental & Ocean Conservation Benefits](#83-environmental--ocean-conservation-benefits)
   - [8.4 Strategic Maritime & Defense Benefits](#84-strategic-maritime--defense-benefits)
9. [References, Research Citations & Repository Artifacts](#9-references-research-citations--repository-artifacts)

---

## 1. Codebase Architecture & Implemented Technologies

The S.A.G.A.R. codebase is architected as an asynchronous, modular micro-service platform separating compute-heavy neural inference, digital signal processing (DSP), geospatial GIS mapping, and presentation layers.

```
NetraSonar / S.A.G.A.R. Workspace
├── backend/
│   ├── app/
│   │   ├── api/                     # REST API routers (Auth, Anomalies, Missions, Reports, Processing)
│   │   ├── core/                    # App configuration, security settings, JWT handlers
│   │   ├── database/                # SQLAlchemy models, PostgreSQL / SQLite engine
│   │   ├── ml/                      # YOLOv8/ONNX providers, inference runners, temporal trackers
│   │   └── services/                # 14-Stage image processing, S3/blob upload, PDF export
│   ├── models/                      # Exported weights (sonar_detector.onnx, yolov8n.pt)
│   ├── ml/                          # Model evaluation, training configurations, metrics scripts
│   └── tests/                       # Automated pytest test suites
├── frontend/
│   ├── src/
│   │   ├── components/              # Tactical UI widgets, PriorityQueue, HUD, Map views
│   │   ├── contexts/                # AppContext, UserContext, ThemeContext, PreferencesContext
│   │   ├── pages/                   # Tactical Dashboard, Upload, Processing, Map, Temporal, Review
│   │   └── services/                # Axios API client, WebSocket / SSE real-time anomaly streaming
│   └── public/                      # Static assets, bathymetry GeoJSON, map styling
├── docs/                            # Comprehensive engineering and audit documentation
└── deploy/                          # Containerization (Docker, Docker Compose, Nixpacks)
```

### 1.1 Frontend Technologies
* **Framework:** React 19 with TypeScript, utilizing strict typing across all hydrographic state interfaces.
* **Build System & Bundler:** Vite 5 offering Sub-millisecond Hot Module Replacement (HMR) and optimized tree-shaken asset compilation.
* **Styling & Design System:** Tailwind CSS v4 featuring bespoke high-contrast tactical dark mode, glassmorphic HUD overlays, and accessible WCAG-compliant color tokens.
* **Geospatial & Bathymetric Visualization:** MapLibre GL JS (WebGL-accelerated 3D vector map engine) supporting nautical charts, raster sonar swath overlays, trackline polylines, and bounding-box anomaly layers.
* **Data Visualization & Analytics:** Recharts for sonar frequency distributions, SNR (Signal-to-Noise Ratio) plots, and operational mission metrics.
* **Iconography & Visual Assets:** Lucide React icons delivering crisp maritime and geospatial indicators.

### 1.2 Backend & API Technologies
* **Language & Runtime:** Python 3.11+, providing high-performance native asynchronous execution.
* **Web Framework:** FastAPI with Starlette and Uvicorn ASGI server, supporting high-concurrency non-blocking I/O for survey stream processing.
* **Data Modeling & Validation:** Pydantic v2 for strict schema enforcement, serialization, and automatic OpenAPI (Swagger) documentation generation.
* **Database & ORM:** SQLAlchemy ORM with support for SQLite (local edge development) and Neon Serverless PostgreSQL with PgBouncer connection pooling for production cloud deployments.
* **Cloud Storage & Asset Transport:** Boto3 client interfacing with Neon S3-compatible Blob Storage and local filesystem fallback (`/data/uploads/`) with automated presigned URL resolution.
* **Security & Authentication:** 
  * Argon2id / PBKDF2 password hashing.
  * JWT Bearer token authentication with role-based access control (RBAC).
  * Multi-Factor Authentication (MFA) via SMTP Gmail One-Time Password (OTP) dispatch.

### 1.3 Computer Vision & Machine Learning Stack
* **Deep Learning Framework:** PyTorch & Ultralytics YOLOv8 / YOLO11 for end-to-end multi-scale feature extraction and bounding-box regression.
* **Cross-Platform Edge Inference:** ONNX Runtime (`onnxruntime` with `CPUExecutionProvider` and `CUDAExecutionProvider`) executing `sonar_detector.onnx` (12.3 MB lightweight binary).
* **Digital Image & Signal Processing:** OpenCV (`opencv-python-headless`), NumPy, SciPy, Pillow, implementing Contrast Limited Adaptive Histogram Equalization (CLAHE), adaptive Gaussian noise filtration, and connected-component spatial morphometry.
* **Geospatial Math Engine:** Shapely, PyProj, GeoPandas, and Turf.js for coordinate reprojection (WGS84 EPSG:4326 to UTM projection), swath planar distortion correction, and geodesic area computation.

---

## 2. Technologies to Be Used (Hardware, Sensors & Edge Stack)

For field-grade maritime and naval operational deployment, S.A.G.A.R. interfaces directly with industrial subsea hardware, autonomous robotic carriers, and embedded computing architectures:

```mermaid
graph LR
    subgraph Underwater Platform ["Subsea Survey Platform (AUV / ROV / Towfish)"]
        S1["Side-Scan Sonar (100/400/900 kHz)"]
        S2["Synthetic Aperture Sonar (SAS)"]
        S3["IMU / INS (Fiber-Optic Gyro)"]
        S4["DVL / USBL Acoustic Positioning"]
        S5["Optical Strobe Camera"]
    end

    subgraph Edge Compute ["Edge Embedded Brain (IP68 Dry Housing)"]
        E1["NVIDIA Jetson AGX Orin (64GB)"]
        E2["TensorRT / ONNX Runtime FP16 Engine"]
        E3["Local NVMe PCIe Gen4 Storage (4TB)"]
        E4["S.A.G.A.R. Edge Daemon (FastAPI Lite)"]
    end

    subgraph Surface Command ["Mothership / Shore Operations Centre"]
        C1["UHF / Satellite / Acoustic Modem"]
        C2["S.A.G.A.R. Tactical Command Console"]
        C3["Neon Cloud / Tactical Mission Server"]
    end

    S1 -->|Raw Analog/Digital Packets| E1
    S2 -->|High-Res Swath Chunks| E1
    S3 -->|Pitch/Roll/Heave Telemetry| E1
    S4 -->|Lat/Lon/Depth Positioning| E1
    S5 -->|Target Snapshot Validation| E1

    E1 --> E2
    E2 --> E4
    E4 --> E3
    E4 -->|Acoustic Anomaly Ping / Full Swath Sync| C1
    C1 --> C2
    C2 --> C3
```

### 2.1 Acoustic Sensors & Transducers
* **Dual-Frequency Side-Scan Sonar (SSS):**
  * *Low Frequency (100 kHz – 450 kHz):* Long-range seabed mapping (up to 300m range per channel) for wide-area search and large wreckage discovery.
  * *High Frequency (900 kHz – 1.25 MHz):* Ultra-high resolution acoustic imaging (up to 50m range per channel) with sub-centimeter range resolution for target classification (ghost nets, mine cylinders, pipeline seams).
* **Synthetic Aperture Sonar (SAS):** For along-track resolution independent of range and frequency, synthesizing virtual apertures up to 10× finer than standard side-scan sonar.
* **Forward-Looking Obstacle Avoidance Sonar (FLS):** Multibeam real-time acoustic scanning for autonomous vehicle collision avoidance.
* **Optical Camera & LED Strobe Array:** High-sensitivity 4K underwater low-light camera deployed on AUVs for near-seabed optical cross-verification.

### 2.2 Navigation, Telemetry & Positioning
* **Inertial Navigation System (INS) & IMU:** High-precision Fiber Optic Gyroscopes (FOG) or Ring Laser Gyroscopes measuring 6-DOF vehicle attitude (surge, sway, heave, roll, pitch, yaw) at 100 Hz.
* **Doppler Velocity Log (DVL):** Acoustic bottom-tracking sensor measuring bottom-referenced velocity to eliminate dead-reckoning positional drift.
* **Ultra-Short Baseline (USBL) Acoustic Positioning:** Transceiver mounted on the survey vessel hull paired with a subsea transponder on the towfish/AUV to deliver sub-meter geographic coordinates in depths exceeding 1,000 meters.
* **GNSS-RTK (Real-Time Kinematic):** Multi-band GPS/NavIC receiver mounted on surface vessels delivering centimeter-level positioning accuracy.

### 2.3 Embedded Edge Computing Hardware
* **Primary Edge Brain:** **NVIDIA Jetson AGX Orin Industrial Module** (64GB RAM, 275 TOPS INT8 / 138 TFLOPS FP16 AI compute, operating between -40°C to 85°C in subsea atmospheric pressure housings).
* **Alternative Cost-Effective Edge Unit:** **NVIDIA Jetson Orin Nano / Xavier NX** for compact micro-AUVs and inspection-class ROVs.
* **Hardware Acceleration Runtime:** NVIDIA TensorRT FP16 / INT8 execution engines delivering sub-15ms inference latency per 640×640 sonar tile.
* **Subsea Telemetry & Data Link:** 
  * Acoustic telemetry modems (Evologics / Teledyne Benthos) transmitting compact anomaly coordinate vectors (<128 bytes) through the water column.
  * High-speed tethered fiber-optic gigabit umbilical (for ROVs and towfish).
  * 5G / Low-Earth Orbit Satellite (Starlink / NavIC) links upon surface vehicle surfacing.

---

## 3. Methodology & Process for Implementation

### 3.1 End-to-End Operational Workflow

The S.A.G.A.R. operational workflow bridges raw hydrographic sensor logs with automated tactical decision-making:

```mermaid
flowchart TD
    subgraph Ingestion ["1. Data Ingestion & Decode"]
        A1["Raw Sonar Survey File (.xtf / .sl2 / .json / GeoTIFF)"] --> A2["Header & Telemetry Extraction (GPS, Altitude, Speed)"]
        A2 --> A3["Slant-Range Distortion Correction & Nadir Mute"]
    end

    subgraph Stage14 ["2. 14-Stage Deterministic Preprocessing"]
        A3 --> B1["Noise Reduction (Adaptive Gaussian / Median Filter)"]
        B1 --> B2["Contrast Optimization (CLAHE Tile Grid)"]
        B2 --> B3["Pixel Normalization (Robust Percentile Min-Max p1-p99)"]
        B3 --> B4["Quality Assessment & Metric Masking (Dropout/Saturation)"]
        B4 --> B5["Sliding-Window Tile Generation (640x640 with 20% Overlap)"]
    end

    subgraph DualCore ["3. Dual-Core AI Intelligence Engine"]
        B5 --> C1["Supervised 9-Class Detector (YOLOv8/11 ONNX)"]
        B5 --> C2["Unsupervised Mahalanobis Seabed Normality Engine"]
        
        C1 --> D1{"Confidence >= 0.45?"}
        D1 -->|Yes| D2["Classified Hazard: Bounding Box & Class ID"]
        D1 -->|No / Ambiguous| D3["Acoustic Shadow & Highlight Heuristic Evaluator"]
        
        C2 --> D4{"Distance > Chi-Square Threshold?"}
        D4 -->|Yes| D5["Flagged Novel Anomaly (Open-World Candidate)"]
        D4 -->|No| D6["Normal Geological Seabed Background"]
    end

    subgraph Fusion ["4. Geotagging & Temporal Analysis"]
        D2 & D3 & D5 --> E1["Coordinate Georeferencing (Towfish Layback + USBL to WGS84)"]
        E1 --> E2["Temporal Comparison Engine (SSIM & NCC vs Historic Swaths)"]
        E2 --> E3["Multi-Criteria Priority Triage Matrix (P1-Critical / P2-High / P3-Routine)"]
    end

    subgraph TacticalCommand ["5. Operator Review & Mission Dossier"]
        E3 --> F1["Interactive MapLibre GL 3D Command Console"]
        F1 --> F2["Human-in-the-Loop Triage (Confirmed / Known / False Positive / New Class)"]
        F2 --> F3["Automated Hydrographic Dossier Generation (JSON / CSV / PDF)"]
    end
```

---

### 3.2 14-Stage Deterministic Acoustic Pipeline

Side-scan sonar imagery suffers from severe physical transmission limitations: sound beam spreading, water column backscatter, towfish velocity fluctuations, and transducer beam pattern non-uniformities. S.A.G.A.R. executes a sequential **14-Stage Processing Pipeline** within `backend/app/services/image_processing_service.py`:

| Stage | Name | Technical Implementation & Formula | Purpose |
| :---: | :--- | :--- | :--- |
| **1** | **File Validation & Integrity Check** | MIME type verification, magic byte parsing (`.xtf`, `.sl2`, `.tif`, `.jpg`), decompression verification, and memory safety checks. | Prevents corrupted file ingestion or buffer overflows during offshore operations. |
| **2** | **Telemetry & Metadata Parsing** | Extraction of towfish altitude ($h$), slant range ($R_s$), ping rate, navigation coordinates, heading, and speed over ground (SOG). | Establishes geospatial and physical scale bounds ($m/\text{pixel}$). |
| **3** | **Slant-Range to Ground-Range Correction** | Geometric transform: $Y_g = \sqrt{R_s^2 - h^2}$, remapping non-linear slant-range acoustic pixels into true equidistant ground-range coordinates. | Eliminates geometric compression near the nadir track. |
| **4** | **Nadir Blind Zone Masking** | Dynamic thresholding and vehicle altitude segmentation to identify and mask the acoustic water column void directly beneath the towfish. | Avoids false detections in unilluminated water column data. |
| **5** | **Time-Varied Gain (TVG) Normalization** | Empirical Gain Normalization across the range profile: $I_{\text{norm}}(r) = I(r) \cdot r^\alpha \cdot e^{2\beta r}$, balancing transmission loss. | Equalizes brightness between near-nadir and far-range boundaries. |
| **6** | **Speckle & Acoustic Noise Filtration** | Adaptive 2D Gaussian filtration ($k=5$) combined with selective median filtering across high-gradient interfaces. | Suppresses Rayleigh speckle noise caused by sea surface scattering without blurring target boundaries. |
| **7** | **Contrast Limited Adaptive Histogram Equalization (CLAHE)** | Local tile-based contrast enhancement with clip limit ($C_l = 2.0$) and adaptive tile grid size: $\text{tile} = \max(2, \min(8, \text{dim}/4))$. | Highlights subtle acoustic shadows of low-relief targets on dark seabeds. |
| **8** | **Robust Percentile Min-Max Normalization** | Intensity remapping based on the 1st ($p_1$) and 99th ($p_{99}$) percentiles: $I_{\text{out}} = \text{clip}\left(\frac{I - p_1}{p_{99} - p_1}, 0, 1\right) \times 255$. | Eliminates dynamic range distortion caused by hyper-reflective metallic pings or sensor drops. |
| **9** | **Objective Quality Assessment (QA Scoring)** | Computes saturation percentage ($I \ge 250$), dropout percentage ($I \le 5$), and global contrast deviation ($\sigma$). | Generates an empirical Quality Score ($0 - 100\%$) and warning flags for surveyors. |
| **10** | **Quality Classification Masking** | 5-tier semantic pixel mask: Usable Seabed (Green), Missing/Dropout (Red), Acoustic Highlight (Yellow), Shadow Candidate (Blue), Saturated (Magenta). | Provides spatial transparency into survey coverage reliability. |
| **11** | **Adaptive Swath Tiling & Overlap Generation** | Sliding window decomposition into $640 \times 640$ pixel patches with a $20\%$ spatial stride overlap. | Ensures targets bisected by tile boundaries are fully captured in adjacent windows. |
| **12** | **Multi-Scale Neural Inference** | Forward execution through `sonar_detector.onnx` utilizing optimized FP16 kernels on ONNX Runtime. | Generates raw bounding boxes, multi-class logit distributions, and objectness scores. |
| **13** | **Non-Maximum Suppression (NMS) & Shadow Verification** | IoU clustering ($\text{threshold} = 0.45$) fused with acoustic shadow geometry validation: confirming that every acoustic highlight is accompanied by a trailing down-range shadow. | Drastically reduces false alarms triggered by natural seabed ripples and sand dunes. |
| **14** | **Georeferencing & Priority Triage Geotagging** | Computes absolute target latitude and longitude using towfish layback trigonometry and vessel heading, outputting structured JSON/CSV records. | Produces actionable GIS coordinates ready for diver dispatch, ROV intervention, or naval command. |

---

### 3.3 Dual-Core Intelligence Engine (YOLO + Mahalanobis Distance)

S.A.G.A.R. pioneers a **Dual-Core Machine Learning Strategy** to conquer the fundamental dilemma of underwater anomaly detection: identifying both predefined threat targets and unprecedented, novel submerged objects.

```mermaid
graph TD
    A["Preprocessed 640x640 Sonar Tile"] --> B["Dual-Core Intelligence Engine"]
    
    subgraph Core1 ["Core 1: Supervised 9-Class Detector"]
        B --> C["Ultralytics YOLOv8s-sagar / ONNX Engine"]
        C --> D["Feature Pyramid Network (P3, P4, P5)"]
        D --> E["Bounding Box & Multi-Class Head"]
        E --> F["Classes: Human, Metal Debris, Ghost Net, Man-Made, Crab Pot, Pipeline, Shipwreck, Mine, Reef"]
    end
    
    subgraph Core2 ["Core 2: Unsupervised Seabed Normality Engine"]
        B --> G["Texture & Statistical Feature Extractor"]
        G --> H["Extract Feature Vector x = [Mean, Variance, Skew, GLCM Contrast, Energy, Homogeneity]"]
        H --> I["Compute Mahalanobis Distance D_M(x) against Local Seabed Distribution"]
        I --> J{"D_M(x) > Chi-Square Threshold?"}
        J -->|Yes| K["Flagged as Novel Anomaly / Unclassified Threat"]
        J -->|No| L["Seabed Homogeneity Confirmed"]
    end

    F --> M["Fusion & Geometric Shadow Verification Unit"]
    K --> M
    M --> N["Consolidated Anomaly Record with Priority Score"]
```

#### Core 1: Supervised 9-Class Target Recognizer
Trained on the **5,205-tile** curated side-scan sonar dataset hosted at [narayan-nkj/sagar-sss](https://huggingface.co/datasets/narayan-nkj/sagar-sss), the model identifies 9 distinct maritime target topologies:
1. `human`: Divers, swimmers, or lost personnel anomalies.
2. `metal_debris`: Discarded industrial containers, lost anchor chains, structural steel.
3. `ghost_net`: Abandoned nylon gillnets and trawl gear draped across seabed features.
4. `unknown_man_made_object`: Unclassified angular geometric artifacts exhibiting high acoustic reflectance.
5. `crab_pot`: Commercial fishing traps and cages.
6. `submarine_pipeline`: Subsea hydrocarbons, freshwater, or telecom pipelines and conduits.
7. `shipwreck`: Sunken hulls, wooden/steel vessel structures, debris fields.
8. `mine_cylinder`: Cylindrical and spherical unexploded ordnance (UXO) and naval mines.
9. `reef`: Natural biogenic and rocky geological formations.

#### Core 2: Mahalanobis Seabed Normality Baseline Engine
Because the ocean seabed is open-world, no supervised dataset can anticipate every foreign object. S.A.G.A.R. characterizes local seabed background statistics across sliding spatial frames. For any local feature vector $\mathbf{x} \in \mathbb{R}^d$ (acoustic intensity, Gray-Level Co-occurrence Matrix [GLCM] contrast, energy, homogeneity, and surface roughness), the engine computes:

$$D_M(\mathbf{x}) = \sqrt{(\mathbf{x} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})}$$

Where $\boldsymbol{\mu}$ is the estimated local seabed mean feature vector and $\boldsymbol{\Sigma}$ is the covariance matrix of the surrounding geological patch. If $D_M(\mathbf{x}) > \chi^2_{d, 1-\alpha}$, the region is designated as statistically anomalous with zero training bias.

#### Acoustic Shadow Height Estimation Formula
To mathematically separate flat seabed clutter from upright hazards, S.A.G.A.R. incorporates physical acoustic shadow trigonometry:

$$H_t = \frac{h \cdot L_s}{R_s + L_s}$$

Where:
* $H_t$: Estimated height of the object above the seabed (meters).
* $h$: Altitude of the towfish/sonar transducer above the seabed (meters).
* $L_s$: Length of the acoustic shadow cast along the seabed (meters).
* $R_s$: Slant range from the transducer to the top of the acoustic target highlight.

---

### 3.4 Working Prototype UI & Module Architecture

The working prototype deployed at `http://localhost:5173` (and cloud preview `https://sagar-netra-sandy.vercel.app`) provides a complete, cohesive tactical command environment:

| Module | Route | Primary Capabilities | Technical Architecture |
| :--- | :--- | :--- | :--- |
| **Tactical Dashboard** | `/dashboard` | System health overview, real-time telemetry gauges, mission summaries, and active priority queue. | React 19, Recharts telemetry, WebSocket anomaly feed. |
| **Survey Upload Portal** | `/upload` | Ingestion of raw sonar swaths (`.xtf`, `.sl2`, `.json`) and image tiles (TIFF, PNG, JPG) with metadata validation. | Drag-and-drop file stream, chunked binary upload, metadata parser. |
| **14-Stage Processing Lab** | `/processing` | Side-by-side comparative inspection of Raw Sonar, Enhanced Denoised Imagery, 5-Color Quality Masks, and AI Inference Bounding Overlays. | Canvas / WebGL multi-layer split viewer, stage progress polling. |
| **Baseline & Geospatial GIS Map** | `/map` | Interactive nautical chart visualizing vessel tracks, sonar swath coverage swaths, bathymetric contours, and clustered anomaly markers. | MapLibre GL JS, GeoJSON layers, Turf.js spatial clustering. |
| **Temporal Comparison** | `/comparison` | Epoch-over-epoch differential analysis comparing current surveys with historical baselines to flag displaced or newly deposited targets. | Image registration, normalized cross-correlation, SSIM differential heatmaps. |
| **Human Review & Dossier** | `/review` | Formal human-in-the-loop review state machine (`pending` $\rightarrow$ `confirmed_unknown` \| `known_object` \| `false_positive` \| `new_class`) and PDF dossier export. | State machine transition engine, ReportLab / pdfmake dossier compiler. |
| **System Settings & RBAC** | `/settings` | Operator identity management, clearance role delegation (Analyst, Operator, System Administrator), and audit logging. | JWT bearer session management, Gmail OTP multi-factor interface. |

---

