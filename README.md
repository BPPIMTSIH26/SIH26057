# SIH26057: Ocean-X (S.A.G.A.R. Command)

**Context-Aware Open-World Underwater Anomaly Intelligence**

## Problem Statement Details

| Attribute | Details |
| :--- | :--- |
| **Problem Statement ID** | 26057 |
| **Problem Statement Title** | AI-assisted seabed survey analysis for faster detection, classification, and human verification of underwater anomalies |
| **Project Title** | Ocean-X: Context-Aware Open-World Underwater Anomaly Intelligence |
| **Category** | Software |
| **Project Overview** | A framework that asks "What is normal for this environment?" instead of just identifying objects. It learns a local seabed baseline, detects deviations, identifies changes across temporal surveys, explains evidence, prioritizes findings for specific missions, and incorporates human-guided feedback for continuous improvement. |

## Tech Stack & Dependencies

| Layer | Technology / Tool | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React, TypeScript, Vite | Core UI Framework |
| **Styling** | Tailwind CSS | Responsive & Custom UI Styling |
| **Mapping & GIS** | Leaflet, MapLibre, QGIS, GeoJSON | Geographic Data Rendering & Real-Time Map Workspace |
| **Data Visualization** | Recharts | Live & Historical Trendline Charts |
| **Backend API** | FastAPI, Uvicorn | High-performance Python REST APIs |
| **Database** | PostgreSQL, PostGIS, SQLAlchemy | Geospatial Relational Database & ORM |
| **AI / ML** | Python, PyTorch, Ultralytics YOLO | Open-world anomaly detection & object candidate extraction |
| **Data Processing** | OpenCV, NumPy, SciPy, scikit-learn | Image tiling, spatial deviation, and feature extraction |
| **Geospatial Processing** | GeoPandas, Shapely, PyProj | Vector manipulation, affine/homography transformation |

## The Four Pillars of Intelligence

| Pillar | Focus Area | Description |
| :--- | :--- | :--- |
| **Local Seabed Baseline** | Foundational Normality | *What is normal here?* Divides SSS images into tiles, extracts acoustic and texture features, and builds a seabed fingerprint to establish a local baseline. |
| **Open-World Anomaly Detection** | Known vs. Unknown | *What doesn't fit known classes?* Detects anomalous regions and uses embedding distances to classify them as known objects (e.g., Tyre) or unknown anomalies. |
| **Temporal Change Intelligence** | Survey Comparison | *What changed between surveys?* Georeferences and registers previous (T1) and current (T2) surveys to calculate pixel, feature, and object differences. |
| **Human-Guided Learning** | Active Learning Loop | *Can the system learn from the operator?* Presents anomalies for human review, captures labels, and stores feedback to create a curated dataset for future training. |

## Complete Data Flow Pipeline

| Stage | Process / Action | Output |
| :--- | :--- | :--- |
| **1. Input** | Sonar Survey Data is ingested | SSS Sonar Data |
| **2. Preprocessing** | Image tiling and normalization | Overlapping Tiles |
| **3. Feature Extraction** | Extracts Acoustic, Texture (GLCM/LBP), and Deep Embeddings (ResNet/ViT) | Feature Vectors |
| **4. Fingerprinting** | Combines features into a unified profile | Seabed Fingerprint |
| **5. Local Baseline** | Calculates Mahalanobis/Cosine deviation against local & regional neighbourhood | Seabed Normality Map |
| **6. Open-World Engine** | Runs YOLO and calculates embedding distances against known classes | Known Object / Unknown Anomaly |
| **7. Temporal Engine** | Aligns current survey with previous survey and calculates changes | Temporal Anomaly Score |
| **8. Priority & Output** | Explains the anomaly and assigns priority based on mission parameters | High-Priority Unknown Change |

## Features & UI Architecture

- **Premium Dashboard**: Features a high-contrast dark theme (Background: `#0B0E14`, Surfaces: `#12161E`) with strict adherence to professional spacing, typography, and responsive grid layouts.
- **AI Analysis Widgets**: Real-time integration of AI-driven evidence (Spatial Deviation, Temporal Change, Known Similarity) and severity reporting.
- **Mission Priority Logic**: Custom weights adjust the final priority score (P1, P2, P3) based on the operator's mission (e.g., Detect marine debris vs. General survey).
- **Active Learning Workflow**: Dashboard tailored for human validators to confirm unknowns, label known objects, or reject false positives without requiring immediate model retraining.
