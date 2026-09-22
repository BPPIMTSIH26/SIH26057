"""
Merge Datasets Script
=====================
This script merges AquaScan-1K, S.A.G.A.R, Drishti-SSS, and HG_DATA (reefs)
into a single unified YOLO dataset for training.

It handles remapping of class IDs from the source datasets into a single
unified class space.

Usage:
  python3 backend/scripts/merge_datasets.py
"""

import os
import shutil
import yaml
from pathlib import Path

# Unified Class Mapping
UNIFIED_CLASSES = [
    "human",                    # 0
    "metal_debris",             # 1
    "ghost_net",                # 2
    "unknown_man_made_object",  # 3
    "crab_pot",                 # 4
    "submarine_pipeline",       # 5
    "shipwreck",                # 6
    "mine_cylinder",            # 7
    "reef"                      # 8
]

# Source mappings to unify class IDs
SOURCE_MAPPINGS = {
    "aquascan": {
        0: 0, # human -> human
        1: 1, # metal_debris -> metal_debris
        2: 2, # ghost_net -> ghost_net
        3: 3  # unknown_man_made_object -> unknown_man_made_object
    },
    "sagar": {
        0: 4, # crab_pot -> crab_pot
        1: 5, # submarine_pipeline -> submarine_pipeline
        2: 6, # shipwreck -> shipwreck
        3: 2, # ghost_net -> ghost_net (Unified ID 2)
        4: 7  # mine_cylinder -> mine_cylinder
    },
    # Define mapping for other datasets if you know their original IDs
    "reef_custom": {
        0: 8  # Custom reef labels assuming class 0 -> reef (Unified ID 8)
    }
}

BACKEND_DIR = Path(__file__).resolve().parent.parent
UNIFIED_DIR = BACKEND_DIR / "data" / "unified_dataset"

def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)

def process_dataset(source_dir, split, mapping_name):
    """Copies images and remaps labels into the unified directory."""
    images_src = source_dir / split / "images"
    labels_src = source_dir / split / "labels"
    
    if not images_src.exists():
        print(f"Skipping {source_dir} {split}: Not found.")
        return

    img_dst = UNIFIED_DIR / split / "images"
    lbl_dst = UNIFIED_DIR / split / "labels"
    ensure_dir(img_dst)
    ensure_dir(lbl_dst)
    
    mapping = SOURCE_MAPPINGS.get(mapping_name, {})
    
    image_files = list(images_src.glob("*.*"))
    for img_path in image_files:
        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".tif"]:
            continue
            
        # Copy image
        shutil.copy2(img_path, img_dst / img_path.name)
        
        # Process label if exists
        lbl_path = labels_src / f"{img_path.stem}.txt"
        dest_lbl_path = lbl_dst / f"{img_path.stem}.txt"
        
        if lbl_path.exists():
            with open(lbl_path, "r") as f:
                lines = f.readlines()
            
            with open(dest_lbl_path, "w") as f:
                for line in lines:
                    parts = line.strip().split()
                    if not parts:
                        continue
                    cls_id = int(parts[0])
                    # Remap class ID, if missing in mapping, just skip (or handle)
                    if cls_id in mapping:
                        new_cls = mapping[cls_id]
                        new_line = f"{new_cls} " + " ".join(parts[1:]) + "\n"
                        f.write(new_line)
                    else:
                        print(f"Warning: class {cls_id} not mapped in {mapping_name}. Skipping line in {img_path.name}")
        else:
            # Empty label file for background image
            dest_lbl_path.touch()

def main():
    print(f"Creating unified dataset at {UNIFIED_DIR}...")
    
    # Clean previous unified dataset
    if UNIFIED_DIR.exists():
        shutil.rmtree(UNIFIED_DIR)
        
    for split in ["train", "val", "test"]:
        print(f"Processing split: {split}")
        # 1. Process AquaScan-1K
        aquascan_dir = BACKEND_DIR / "data" / "dataset"
        process_dataset(aquascan_dir, split, "aquascan")
        
        # 2. Process S.A.G.A.R.
        # Assuming S.A.G.A.R. is in HG_DATA/sagar (you might need to adjust paths depending on where it downloads)
        sagar_dir = BACKEND_DIR / "HG_DATA"
        process_dataset(sagar_dir, split, "sagar")
        
        # 3. Process Reefs from custom HG_DATA directly if available
        reef_dir = BACKEND_DIR.parent / "HG_DATA" 
        process_dataset(reef_dir, split, "reef_custom")

    # Write unified.yaml
    yaml_path = UNIFIED_DIR / "unified.yaml"
    data_config = {
        "path": str(UNIFIED_DIR),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(UNIFIED_CLASSES),
        "names": UNIFIED_CLASSES
    }
    with open(yaml_path, "w") as f:
        yaml.dump(data_config, f, sort_keys=False)
        
    print(f"Unified dataset created successfully with {len(UNIFIED_CLASSES)} classes.")
    print(f"YAML config saved to {yaml_path}")

if __name__ == "__main__":
    main()
