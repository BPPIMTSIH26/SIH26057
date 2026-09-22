"""
Model Training Script — AquaScan-1K
====================================
Trains a YOLOv8n model on real AquaScan-1K images and writes
a model_registry.json with all provenance fields and real metrics.

Prerequisites:
  1. Ingest the dataset: python3 backend/scripts/ingest_dataset.py
  2. Verify backend/data/dataset/dataset_config/metadata.json exists

Output:
  - backend/models/aquascan_model/weights/best.pt  (best checkpoint)
  - backend/models/model_registry.json             (provenance + metrics)
"""
import os
import json
import hashlib
import yaml
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR   = Path(__file__).resolve().parent
BACKEND_DIR  = SCRIPT_DIR.parent
DATASET_DIR  = BACKEND_DIR / "data" / "dataset"
MODELS_DIR   = BACKEND_DIR / "models"
REGISTRY_PATH = MODELS_DIR / "model_registry.json"
METADATA_PATH = DATASET_DIR / "dataset_config/metadata.json"
MANIFEST_PATH = DATASET_DIR / "split_manifest.json"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    # 1. Verify real dataset exists and is not synthetic
    if not METADATA_PATH.exists():
        print("ERROR: dataset_config/metadata.json not found.")
        print("Run: python3 backend/scripts/ingest_dataset.py first.")
        raise SystemExit(1)

    with open(METADATA_PATH) as f:
        dataset_meta = json.load(f)

    if dataset_meta.get("synthetic_data", True):
        print("ERROR: dataset_config/metadata.json indicates synthetic data.")
        print("Re-run: python3 backend/scripts/ingest_dataset.py with the real AquaScan-1K zip.")
        raise SystemExit(1)

    print(f"Dataset: {dataset_meta['dataset_name']}")
    print(f"Source: Zenodo record {dataset_meta['zenodo_record_id']}")
    print(f"Total valid images: {dataset_meta['total_valid_images']}")

    # 2. Create dataset.yaml
    yaml_path = DATASET_DIR / "dataset.yaml"
    data_config = {
        "path": str(DATASET_DIR),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": 4,
        "names": ["human", "metal_debris", "ghost_net", "unknown_man_made_object"],
    }
    with open(yaml_path, "w") as f:
        yaml.dump(data_config, f, sort_keys=False)
    print(f"Dataset config: {yaml_path}")

    # 3. Train
    from ultralytics import YOLO

    EPOCHS = 50
    IMGSZ  = 640
    BATCH  = 16
    BASE_MODEL = str(BACKEND_DIR / "models" / "yolov8n.pt")

    print(f"\nTraining YOLOv8n for {EPOCHS} epochs …")
    model = YOLO(BASE_MODEL)
    results = model.train(
        data=str(yaml_path),
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=BATCH,
        patience=10,         # Early stopping
        project=str(MODELS_DIR),
        name="aquascan_model",
        exist_ok=True,
        seed=42,
        deterministic=True,
    )

    # 4. Extract real validation metrics from training result
    best_pt = MODELS_DIR / "aquascan_model" / "weights" / "best.pt"
    if not best_pt.exists():
        print(f"ERROR: best.pt not found at {best_pt}")
        raise SystemExit(1)

    best_sha256 = sha256_file(best_pt)

    # Ultralytics returns metrics after training
    try:
        val_metrics = results.results_dict if hasattr(results, "results_dict") else {}
        map50     = float(val_metrics.get("metrics/mAP50(B)", 0.0))
        map50_95  = float(val_metrics.get("metrics/mAP50-95(B)", 0.0))
        precision = float(val_metrics.get("metrics/precision(B)", 0.0))
        recall    = float(val_metrics.get("metrics/recall(B)", 0.0))
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        metrics_note = "Computed on real AquaScan-1K validation split."
    except Exception as e:
        map50 = map50_95 = precision = recall = f1 = None
        metrics_note = f"Metrics extraction failed: {e}. Run validation manually."

    print(f"\nReal validation metrics:")
    print(f"  mAP50      : {map50}")
    print(f"  mAP50-95   : {map50_95}")
    print(f"  Precision  : {precision}")
    print(f"  Recall     : {recall}")
    print(f"  F1         : {f1:.4f}" if f1 is not None else "  F1         : None")

    # 5. Write model registry
    registry = {
        "model_name": "YOLOv8n-AquaScan1K",
        "architecture": "YOLOv8n",
        "base_model": "yolov8n.pt",
        "checkpoint_path": str(best_pt),
        "checkpoint_sha256": best_sha256,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_config": {
            "epochs": EPOCHS,
            "imgsz": IMGSZ,
            "batch": BATCH,
            "seed": 42,
            "early_stopping_patience": 10,
        },
        "dataset": {
            "name": dataset_meta["dataset_name"],
            "zenodo_record_id": dataset_meta["zenodo_record_id"],
            "zenodo_url": dataset_meta.get("zenodo_url", "https://zenodo.org/records/18771165"),
            "license": dataset_meta.get("license", "CC-BY-4.0"),
            "attribution": dataset_meta.get("attribution"),
            "total_images": dataset_meta["total_valid_images"],
            "splits": dataset_meta["splits"],
            "split_manifest_path": str(MANIFEST_PATH),
            "download_timestamp": dataset_meta.get("download_timestamp"),
            "archive_sha256": dataset_meta.get("archive", {}).get("archive_sha256"),
        },
        "classes": {
            "0": "human",
            "1": "metal_debris",
            "2": "ghost_net",
            "3": "unknown_man_made_object",
        },
        "metrics": {
            "mAP50": map50,
            "mAP50_95": map50_95,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        },
        "metrics_note": metrics_note,
        "synthetic_data": False,
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)

    print(f"\nModel registry saved → {REGISTRY_PATH}")
    print(f"Checkpoint SHA256 : {best_sha256}")
    print("\nTraining complete. Run backend to use the new model.")


if __name__ == "__main__":
    main()
