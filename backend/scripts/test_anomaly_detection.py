import os
import argparse
from ultralytics import YOLO

def test_anomaly(image_path, model_path="src/models/sonar_detector.onnx", conf_threshold=0.80):
    print(f"Loading model from {model_path}...")
    model = YOLO(model_path, task='detect')
    
    print(f"Testing image: {image_path} with threshold >= {conf_threshold*100}%")
    results = model.predict(image_path, conf=conf_threshold, verbose=False)
    
    classes_dict = model.names
    
    found = False
    for r in results:
        if len(r.boxes) > 0:
            for box in r.boxes:
                c = float(box.conf.cpu().numpy()[0])
                cls_id = int(box.cls.cpu().numpy()[0])
                cls_name = classes_dict[cls_id]
                
                print(f"  [+] DETECTED: {cls_name} (Confidence: {c*100:.1f}%)")
                found = True
                
    if not found:
        print("  [-] No anomalies detected above the confidence threshold.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Sonar Anomaly Detection")
    parser.add_argument("--image", type=str, required=True, help="Path to sonar image")
    args = parser.parse_args()
    
    if os.path.exists(args.image):
        test_anomaly(args.image)
    else:
        print(f"File not found: {args.image}")
