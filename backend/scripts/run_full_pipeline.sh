#!/bin/bash
set -e

LOGFILE="full_pipeline.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "Starting full pipeline at $(date)"

echo "[1/6] Downloading AquaScan-1K.zip..."
mkdir -p backend/data/aquascan_raw
# We use curl with -L to follow redirects, and -s to keep the output clean.
curl -L -s "https://zenodo.org/api/records/18771165/files/AquaScan-1K.zip/content" -o backend/data/aquascan_raw/AquaScan-1K.zip

echo "[2/6] Ingesting dataset..."
python3 backend/scripts/ingest_dataset.py

echo "[3/6] Merging datasets..."
python3 backend/scripts/merge_datasets.py

echo "[4/6] Training unified model (100 epochs)..."
python3 backend/scripts/train_unified.py --epochs 100

echo "[5/6] Exporting ONNX..."
python3 backend/scripts/export_onnx.py

echo "[6/6] Cleaning up data to save disk space..."
rm -rf backend/data/aquascan_raw/AquaScan-1K.zip
rm -rf backend/data/dataset
rm -rf backend/data/unified_dataset

echo "Pipeline completely finished at $(date)"
