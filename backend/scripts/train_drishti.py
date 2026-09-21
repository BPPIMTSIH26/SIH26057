import os
import yaml
from ultralytics import YOLO
import torch

def setup_drishti_yaml(dataset_dir):
    """
    Creates the data.yaml for YOLO training pointing to the absolute paths of the dataset.
    """
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    
    data = {
        "train": os.path.abspath(os.path.join(dataset_dir, "train", "images")),
        "val": os.path.abspath(os.path.join(dataset_dir, "val", "images")),
        "test": os.path.abspath(os.path.join(dataset_dir, "test", "images")),
        "nc": 5,
        "names": [
            "crab_pot",
            "submarine_pipeline",
            "shipwreck",
            "ghost_net",
            "mine_cylinder"
        ]
    }
    
    with open(yaml_path, "w") as f:
        yaml.dump(data, f, default_flow_style=False)
        
    return yaml_path

def train_yolo(epochs=5):
    print("Initializing YOLO training for DRISHTI dataset...")
    
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(__file__))
    dataset_dir = os.path.join(base_dir, "HG_DATA")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(dataset_dir):
        print(f"Error: Dataset directory {dataset_dir} does not exist.")
        return

    # Create dynamic yaml with absolute paths
    yaml_path = setup_drishti_yaml(dataset_dir)
    print(f"Created YOLO config at {yaml_path}")
    
    # Device selection (MPS for Mac, fallback to CPU)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Using device: {device}")
    
    # Initialize YOLOv8 model (nano for fast training/inference)
    model = YOLO("yolov8n.pt") 
    
    print(f"Starting training for {epochs} epochs...")
    results = model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=640,
        batch=16,
        device=device,
        project=models_dir,
        name="drishti_run",
        exist_ok=True,
        save=True,
        save_period=1,
        patience=10
    )
    
    # Save the final best model specifically
    best_model_path = os.path.join(models_dir, "drishti_run", "weights", "best.pt")
    if os.path.exists(best_model_path):
        print(f"Training completed successfully. Best model saved at: {best_model_path}")
    else:
        print("Training completed but best.pt not found. Check logs.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train YOLO on DRISHTI dataset")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs to train")
    args = parser.parse_args()
    train_yolo(epochs=args.epochs)
