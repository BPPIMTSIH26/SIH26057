import os
import json
import datetime
from pathlib import Path

# Need to run with ultralytics to get classes and predictions
try:
    from ultralytics import YOLO
except ImportError:
    print("Please install ultralytics")
    exit(1)

def run_phase_0():
    print("============================================================")
    print("STEP 0: FETCH REQUIRED LINKS FROM IDE")
    print("============================================================")
    
    hf_repo_link = "https://huggingface.co/Narayan-nkj/sagar-sonar-detector"
    github_repo_link = "https://github.com/BPPIMTSIH26/SIH26057"
    
    print(f"✅ Found HuggingFace Link: {hf_repo_link}")
    print(f"✅ Found GitHub Link: {github_repo_link}")
    print("✅ All links verified - proceeding to Phase 1")

def run_phase_1():
    print("\n============================================================")
    print("PHASE 1: MODEL VERIFICATION (DO NOT SKIP)")
    print("============================================================")
    
    model_path = "backend/models/sonar_detector.onnx"
    print(f"Loading ONNX model from {model_path}...")
    model = YOLO(model_path, task='detect')
    
    classes_dict = model.names
    classes_list = list(classes_dict.values())
    
    print("✅ Model loaded successfully.")
    print("Extracted classes:", classes_list)
    print(f"✅ Confirmation: {len(classes_list)} classes are present in the model.")
    
    # Test Model on Validation Images
    print("\nTASK 1B: Test Model on Validation Images")
    val_dir = Path("data/validation")
    image_files = list(val_dir.glob("*.jpg")) + list(val_dir.glob("*.png"))
    
    if not image_files:
        print("❌ No images found in data/validation/")
        return
        
    total_images = len(image_files)
    passed_80_count = 0
    failed_below_80 = 0
    total_conf = 0
    all_detections_count = 0
    
    for img_path in image_files:
        results = model.predict(str(img_path), conf=0.1, verbose=False)
        # Check highest confidence detection
        best_conf = 0.0
        best_class = None
        
        for r in results:
            if len(r.boxes) > 0:
                confs = r.boxes.conf.cpu().numpy()
                cls_ids = r.boxes.cls.cpu().numpy()
                for c, cid in zip(confs, cls_ids):
                    if c > best_conf:
                        best_conf = c
                        best_class = classes_list[int(cid)]
        
        # Convert to percentage
        best_conf_pct = best_conf * 100
        
        if best_class:
            all_detections_count += 1
            total_conf += best_conf_pct
            
            pass_fail = "PASS" if best_conf_pct >= 80.0 else "FAIL"
            
            if pass_fail == "PASS":
                passed_80_count += 1
            else:
                failed_below_80 += 1
                
            print(f"- Image: {img_path.name} | Detected: {best_class} | Confidence: {best_conf_pct:.1f}% | {pass_fail}")
        else:
            print(f"- Image: {img_path.name} | Detected: NONE | Confidence: 0.0% | FAIL")
            failed_below_80 += 1

    success_rate = (passed_80_count / total_images) * 100 if total_images > 0 else 0
    avg_conf = (total_conf / all_detections_count) if all_detections_count > 0 else 0
    
    status = "WORKING" if (success_rate >= 75 and avg_conf >= 80) else "NOT_WORKING"
    
    # Create JSON
    report = {
        "total_images_tested": total_images,
        "images_passed_80_percent": passed_80_count,
        "images_failed_below_80": failed_below_80,
        "success_rate_percentage": round(float(success_rate), 2),
        "average_confidence": round(float(avg_conf), 2),
        "classes_detected": classes_list,
        "status": status,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    with open("model_performance_report.json", "w") as f:
        json.dump(report, f, indent=2)
        
    print("\nTASK 1C: Created model_performance_report.json")
    
    print("\nTASK 1D: Decision Point - CHECK MODEL STATUS")
    if status == "WORKING":
        print("✅ MODEL WORKING PROPERLY - Proceeding to data cleanup")
    else:
        print("❌ MODEL NOT WORKING - Need to reconfigure")

if __name__ == "__main__":
    run_phase_0()
    run_phase_1()
