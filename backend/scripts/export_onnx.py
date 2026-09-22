import os
from ultralytics import YOLO

def export_model_to_onnx():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    model_path = os.path.join(base_dir, "models", "unified_run", "weights", "best.pt")
    out_dir = os.path.join(base_dir, "models")
    
    if not os.path.exists(model_path):
        print(f"Error: Model file {model_path} does not exist. Ensure training has completed.")
        return
        
    print(f"Loading YOLO model from {model_path}...")
    model = YOLO(model_path)
    
    print("Exporting model to ONNX format...")
    # Export to ONNX. Setting imgsz=640 as standard.
    exported_path = model.export(format="onnx", imgsz=640, dynamic=False)
    
    # By default, YOLOv8 saves the exported model in the same directory as the weights.
    # We want to move it to the main models directory if it's there.
    if exported_path and os.path.exists(exported_path):
        final_dest = os.path.join(out_dir, "sonar_detector.onnx")
        # Replace if it exists
        if os.path.exists(final_dest):
            os.remove(final_dest)
        os.rename(exported_path, final_dest)
        print(f"ONNX model successfully exported and saved to {final_dest}")
    else:
        print("ONNX export failed or path could not be resolved.")

if __name__ == "__main__":
    export_model_to_onnx()
