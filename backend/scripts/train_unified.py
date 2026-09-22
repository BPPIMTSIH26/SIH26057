import os
import torch
from ultralytics import YOLO
from pathlib import Path

def train_unified(epochs=100):
    print("Initializing YOLO training for Unified dataset (all classes + reefs)...")
    
    # Define paths
    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    dataset_dir = backend_dir / "data" / "unified_dataset"
    models_dir = backend_dir / "models"
    yaml_path = dataset_dir / "unified.yaml"
    
    if not yaml_path.exists():
        print(f"Error: Unified YAML config {yaml_path} does not exist.")
        print("Please run 'python3 backend/scripts/merge_datasets.py' first.")
        return

    # Device selection
    device = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Initialize YOLOv8 model
    model = YOLO("yolov8n.pt") 
    
    print(f"Starting unified training for {epochs} epochs...")
    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        imgsz=640,
        batch=16,
        device=device,
        project=str(models_dir),
        name="unified_run",
        exist_ok=True,
        save=True,
        save_period=5,
        patience=20
    )
    
    best_model_path = models_dir / "unified_run" / "weights" / "best.pt"
    if best_model_path.exists():
        print(f"\nTraining completed successfully. Unified model saved at: {best_model_path}")
    else:
        print("\nTraining completed but best.pt not found. Check logs.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train unified YOLO model on all datasets")
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs to train")
    args = parser.parse_args()
    train_unified(epochs=args.epochs)
