import os
import json
import glob

def verify_dataset(dataset_dir):
    """
    Verify YOLO formatted S.A.G.A.R dataset.
    Generates DATASET_VERIFICATION.json
    """
    classes = {
        0: "crab_pot",
        1: "submarine_pipeline",
        2: "shipwreck",
        3: "ghost_net",
        4: "mine_cylinder"
    }

    stats = {
        "total_images": 0,
        "total_labels": 0,
        "class_counts": {v: 0 for v in classes.values()},
        "errors": []
    }

    splits = ["train", "valid", "test"]
    
    for split in splits:
        split_dir = os.path.join(dataset_dir, split)
        if not os.path.exists(split_dir):
            continue
            
        images_dir = os.path.join(split_dir, "images")
        labels_dir = os.path.join(split_dir, "labels")
        
        if os.path.exists(images_dir):
            images = glob.glob(os.path.join(images_dir, "*.jpg")) + glob.glob(os.path.join(images_dir, "*.png"))
            stats["total_images"] += len(images)
            
        if os.path.exists(labels_dir):
            labels = glob.glob(os.path.join(labels_dir, "*.txt"))
            stats["total_labels"] += len(labels)
            
            for label_file in labels:
                with open(label_file, "r") as f:
                    for line_idx, line in enumerate(f):
                        parts = line.strip().split()
                        if len(parts) != 5:
                            stats["errors"].append(f"{label_file}:{line_idx} - Invalid number of elements")
                            continue
                            
                        try:
                            class_id = int(parts[0])
                            x, y, w, h = map(float, parts[1:])
                            
                            if class_id not in classes:
                                stats["errors"].append(f"{label_file}:{line_idx} - Unknown class {class_id}")
                                continue
                                
                            if not (0 <= x <= 1 and 0 <= y <= 1 and 0 <= w <= 1 and 0 <= h <= 1):
                                stats["errors"].append(f"{label_file}:{line_idx} - Coordinates out of bounds")
                                continue
                                
                            stats["class_counts"][classes[class_id]] += 1
                        except ValueError:
                            stats["errors"].append(f"{label_file}:{line_idx} - Non-numeric data")

    # Save verification report
    report_path = os.path.join(dataset_dir, "..", "DATASET_VERIFICATION.json")
    with open(report_path, "w") as f:
        json.dump(stats, f, indent=4)
        
    print(f"Dataset verification complete. Found {stats['total_images']} images and {stats['total_labels']} label files.")
    if stats['errors']:
        print(f"Found {len(stats['errors'])} errors. See {report_path}")
    else:
        print("No errors found. All labels are valid.")

if __name__ == "__main__":
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "dataset", "hf")
    verify_dataset(base_dir)
