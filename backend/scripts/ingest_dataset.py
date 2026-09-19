"""
AquaScan-1K Dataset Ingestion Pipeline
=======================================
Source  : Zenodo record 18771165 (https://zenodo.org/records/18771165)
Dataset : AquaScan-1K Side Scan Sonar Dataset
License : CC-BY-4.0
Classes : human (0), metal_debris (1), ghost_net (2), unknown_man_made_object (3)

Usage
-----
1. Download the dataset zip manually from Zenodo:
       https://zenodo.org/records/18771165
2. Place the zip at:
       backend/data/aquascan_raw/AquaScan-1K.zip
3. Run:
       python3 backend/scripts/ingest_dataset.py

DO NOT place fabricated or synthetic images in the dataset directory.
Every image must originate from the official AquaScan-1K Zenodo record.
"""

import os
import sys
import json
import hashlib
import zipfile
import shutil
import random
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR   = Path(__file__).resolve().parent
BACKEND_DIR  = SCRIPT_DIR.parent
RAW_DIR      = BACKEND_DIR / "data" / "aquascan_raw"
DATASET_DIR  = BACKEND_DIR / "data" / "dataset"
METADATA_FILE = DATASET_DIR / "dataset_metadata.json"
MANIFEST_FILE = DATASET_DIR / "split_manifest.json"

ZENODO_RECORD_ID = "18771165"
ZENODO_URL       = f"https://zenodo.org/records/{ZENODO_RECORD_ID}"
VALID_CLASS_IDS  = {0, 1, 2, 3}
CLASS_NAMES      = ["human", "metal_debris", "ghost_net", "unknown_man_made_object"]
RANDOM_SEED      = 42

# ---------------------------------------------------------------------------
# Checksum helpers
# ---------------------------------------------------------------------------
def md5_file(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

# ---------------------------------------------------------------------------
# Locate the real zip
# ---------------------------------------------------------------------------
def find_zip() -> Path:
    """
    Look for the AquaScan-1K zip in the raw directory.
    Returns the Path if found, raises SystemExit with instructions if not.
    """
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    candidates = list(RAW_DIR.glob("*.zip"))
    if not candidates:
        print("\n" + "="*70)
        print("ERROR: AquaScan-1K zip not found.")
        print()
        print("The dataset must be downloaded manually from Zenodo:")
        print(f"  {ZENODO_URL}")
        print()
        print("Place the downloaded zip file at:")
        print(f"  {RAW_DIR / 'AquaScan-1K.zip'}")
        print()
        print("This script will NOT generate synthetic or placeholder data.")
        print("="*70 + "\n")
        sys.exit(1)
    if len(candidates) > 1:
        print(f"WARNING: Multiple zips found in {RAW_DIR}. Using: {candidates[0].name}")
    return candidates[0]

# ---------------------------------------------------------------------------
# Extract
# ---------------------------------------------------------------------------
def extract_zip(zip_path: Path, dest_dir: Path) -> dict:
    """Extract and return checksum of the archive."""
    print(f"Verifying archive checksum …")
    archive_sha256 = sha256_file(zip_path)
    archive_md5    = md5_file(zip_path)
    print(f"  SHA256 : {archive_sha256}")
    print(f"  MD5    : {archive_md5}")

    images_out = dest_dir / "images"
    labels_out = dest_dir / "labels"
    images_out.mkdir(parents=True, exist_ok=True)
    labels_out.mkdir(parents=True, exist_ok=True)

    print(f"Extracting {zip_path.name} …")
    with zipfile.ZipFile(zip_path, "r") as zf:
        members = zf.namelist()
        image_count = 0
        label_count = 0
        for member in members:
            lower = member.lower()
            if lower.endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff")):
                fname = Path(member).name
                target = images_out / fname
                with zf.open(member) as src, open(target, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                image_count += 1
            elif lower.endswith(".txt") and "label" in lower:
                fname = Path(member).name
                target = labels_out / fname
                with zf.open(member) as src, open(target, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                label_count += 1
            elif lower == "classes.txt":
                target = dest_dir / "classes.txt"
                with zf.open(member) as src, open(target, "wb") as dst:
                    shutil.copyfileobj(src, dst)

    print(f"  Extracted {image_count} images, {label_count} label files.")
    return {
        "archive_sha256": archive_sha256,
        "archive_md5": archive_md5,
        "archive_name": zip_path.name,
        "extracted_images": image_count,
        "extracted_labels": label_count,
    }

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def validate_images(images_dir: Path) -> tuple[list, list]:
    """
    Validate every image:
    - Readable and non-corrupt (cv2 can load it)
    - Non-zero file size
    - Not a duplicate (by MD5)
    Returns (valid_list, rejected_list).
    """
    try:
        import cv2
    except ImportError:
        print("WARNING: cv2 not available — skipping pixel-level image validation.")
        cv2 = None

    valid = []
    rejected = []
    seen_hashes = {}
    img_files = sorted(
        [p for p in images_dir.iterdir()
         if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".tif", ".tiff"}]
    )

    print(f"Validating {len(img_files)} images …")
    for img_path in img_files:
        if img_path.stat().st_size == 0:
            rejected.append({"file": img_path.name, "reason": "zero-byte file"})
            continue

        file_hash = md5_file(img_path)
        if file_hash in seen_hashes:
            rejected.append({
                "file": img_path.name,
                "reason": f"duplicate of {seen_hashes[file_hash]}"
            })
            continue
        seen_hashes[file_hash] = img_path.name

        if cv2 is not None:
            img = cv2.imread(str(img_path))
            if img is None:
                rejected.append({"file": img_path.name, "reason": "cv2 could not decode"})
                continue

        valid.append({"name": img_path.name, "md5": file_hash})

    print(f"  Valid: {len(valid)}, Rejected: {len(rejected)}")
    for r in rejected:
        print(f"  REJECTED: {r['file']} — {r['reason']}")
    return valid, rejected


def validate_labels(labels_dir: Path, valid_images: list) -> tuple[list, list]:
    """
    Validate YOLO labels:
    - Class ID in VALID_CLASS_IDS (0–3)
    - bbox values normalized and within [0.0, 1.0]
    - Each image has a matching label
    Returns (valid_pairs, rejected).
    """
    valid_names = {item["name"] for item in valid_images}
    valid_pairs = []
    rejected = []
    missing_labels = []

    print(f"Validating labels …")
    for item in valid_images:
        img_name = item["name"]
        stem = Path(img_name).stem
        lbl_path = labels_dir / f"{stem}.txt"

        if not lbl_path.exists():
            missing_labels.append(img_name)
            # Images without labels are valid (background / no-object images)
            valid_pairs.append({"image": img_name, "label": None, "annotations": 0})
            continue

        annotations = []
        malformed = []
        with open(lbl_path) as f:
            for lineno, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) != 5:
                    malformed.append(f"line {lineno}: expected 5 fields, got {len(parts)}")
                    continue
                try:
                    cls_id = int(parts[0])
                    cx, cy, w, h = float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                except ValueError:
                    malformed.append(f"line {lineno}: non-numeric values")
                    continue
                if cls_id not in VALID_CLASS_IDS:
                    malformed.append(f"line {lineno}: invalid class_id={cls_id}")
                    continue
                for val, name in [(cx, "cx"), (cy, "cy"), (w, "w"), (h, "h")]:
                    if not (0.0 <= val <= 1.0):
                        malformed.append(f"line {lineno}: {name}={val} out of [0,1]")
                if not malformed:
                    annotations.append({"class_id": cls_id, "cx": cx, "cy": cy, "w": w, "h": h})

        if malformed:
            rejected.append({"image": img_name, "label": lbl_path.name, "errors": malformed})
        else:
            valid_pairs.append({"image": img_name, "label": lbl_path.name, "annotations": len(annotations)})

    if missing_labels:
        print(f"  {len(missing_labels)} images have no label file (treated as background).")
    print(f"  Valid pairs: {len(valid_pairs)}, Label errors: {len(rejected)}")
    return valid_pairs, rejected


# ---------------------------------------------------------------------------
# Split
# ---------------------------------------------------------------------------
def create_splits(valid_pairs: list, dataset_dir: Path) -> dict:
    """
    Create reproducible 70/20/10 train/val/test split.
    Copy (not move) files so originals remain in images/ and labels/.
    Returns split counts.
    """
    rng = random.Random(RANDOM_SEED)
    pairs = list(valid_pairs)
    rng.shuffle(pairs)

    n = len(pairs)
    n_train = int(n * 0.70)
    n_val   = int(n * 0.20)

    splits = {
        "train": pairs[:n_train],
        "val":   pairs[n_train : n_train + n_val],
        "test":  pairs[n_train + n_val:],
    }

    images_src = dataset_dir / "images"
    labels_src = dataset_dir / "labels"

    for split, items in splits.items():
        img_dst = dataset_dir / split / "images"
        lbl_dst = dataset_dir / split / "labels"
        img_dst.mkdir(parents=True, exist_ok=True)
        lbl_dst.mkdir(parents=True, exist_ok=True)
        for item in items:
            shutil.copy2(images_src / item["image"], img_dst / item["image"])
            if item.get("label"):
                shutil.copy2(labels_src / item["label"], lbl_dst / item["label"])

    counts = {k: len(v) for k, v in splits.items()}
    print(f"Split: train={counts['train']}, val={counts['val']}, test={counts['test']}")
    return splits, counts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("="*70)
    print("AquaScan-1K Dataset Ingestion Pipeline")
    print(f"Zenodo record: {ZENODO_RECORD_ID}")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("="*70 + "\n")

    # 1. Locate real zip
    zip_path = find_zip()
    print(f"Found archive: {zip_path}\n")

    # 2. Extract
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    archive_info = extract_zip(zip_path, DATASET_DIR)

    # 3. Validate images
    valid_images, rejected_images = validate_images(DATASET_DIR / "images")
    if not valid_images:
        print("\nERROR: No valid images found after extraction. Aborting.")
        sys.exit(1)

    # 4. Validate labels
    valid_pairs, rejected_labels = validate_labels(DATASET_DIR / "labels", valid_images)
    if not valid_pairs:
        print("\nERROR: No valid image-label pairs. Aborting.")
        sys.exit(1)

    # 5. Create splits
    splits, counts = create_splits(valid_pairs, DATASET_DIR)

    # 6. Save split manifest (exact per-file record for reproducibility)
    manifest = {
        "random_seed": RANDOM_SEED,
        "split_ratios": {"train": 0.70, "val": 0.20, "test": 0.10},
        "splits": {
            "train": [p["image"] for p in splits["train"]],
            "val":   [p["image"] for p in splits["val"]],
            "test":  [p["image"] for p in splits["test"]],
        }
    }
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Split manifest saved → {MANIFEST_FILE}")

    # 7. Save dataset metadata with provenance
    per_file_checksums = {item["name"]: item["md5"] for item in valid_images}
    metadata = {
        "dataset_name": "AquaScan-1K Side Scan Sonar Dataset",
        "zenodo_record_id": ZENODO_RECORD_ID,
        "zenodo_url": ZENODO_URL,
        "license": "CC-BY-4.0",
        "attribution": "AquaScan-1K Side Scan Sonar Dataset, Zenodo record 18771165",
        "download_timestamp": datetime.now(timezone.utc).isoformat(),
        "archive": archive_info,
        "total_valid_images": len(valid_images),
        "rejected_images": rejected_images,
        "rejected_labels": rejected_labels,
        "splits": counts,
        "classes": {str(i): name for i, name in enumerate(CLASS_NAMES)},
        "split_manifest_path": str(MANIFEST_FILE),
        "per_file_checksums": per_file_checksums,
        "synthetic_data": False,
        "note": "All images sourced from the official AquaScan-1K Zenodo record. No synthetic or generated data."
    }
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Dataset metadata saved → {METADATA_FILE}")

    print("\n" + "="*70)
    print(f"Ingestion complete.")
    print(f"  Total valid images : {len(valid_images)}")
    print(f"  Train / Val / Test : {counts['train']} / {counts['val']} / {counts['test']}")
    print(f"  Rejected images    : {len(rejected_images)}")
    print(f"  Rejected labels    : {len(rejected_labels)}")
    print(f"\nNext step: python3 backend/scripts/train_model.py")
    print("="*70)


if __name__ == "__main__":
    main()
