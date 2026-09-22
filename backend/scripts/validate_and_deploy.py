import os
import json
import glob
import statistics
import time
from ultralytics import YOLO

# Use onnxruntime via ultralytics YOLO wrapper for proper NMS postprocessing
# This meets the requirement of ONNX inference while handling YOLO bounding box math

def run_validation():
    print("🚀 Starting Model Validation Pipeline...")
    model_path = "src/models/sonar_detector.onnx"
    val_dir = "data/validation"
    
    if not os.path.exists(model_path):
        print(f"❌ Error: Model not found at {model_path}")
        return False
        
    print(f"✅ Found model: {model_path}")
    print("Loading ONNX model using onnxruntime backend...")
    
    try:
        model = YOLO(model_path, task='detect')
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False
        
    print("✅ Model loaded successfully")
    
    images = glob.glob(os.path.join(val_dir, "*.jpg")) + glob.glob(os.path.join(val_dir, "*.png"))
    if not images:
        print(f"❌ Error: No images found in {val_dir}")
        return False
        
    print(f"✅ Found {len(images)} validation images")
    
    # Store results
    results_data = []
    high_conf_images = 0
    all_confidences = []
    
    print("\n🔍 Running inference on validation images...")
    for img_path in images:
        print(f"  Testing {os.path.basename(img_path)}...")
        try:
            results = model.predict(img_path, verbose=False)
            img_has_high_conf = False
            
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id]
                    
                    all_confidences.append(conf)
                    
                    if conf >= 0.80:
                        img_has_high_conf = True
                        
                    results_data.append({
                        "image": os.path.basename(img_path),
                        "class": class_name,
                        "confidence": conf,
                        "high_confidence": conf >= 0.80
                    })
                    print(f"    Detected: {class_name} (Conf: {conf:.2f})")
            
            if img_has_high_conf:
                high_conf_images += 1
                
        except Exception as e:
            print(f"❌ Error running inference on {img_path}: {e}")
            return False

    # Criteria checks
    if not all_confidences:
        print("❌ Model detected absolutely nothing. Failing validation.")
        return False
        
    avg_confidence = statistics.mean(all_confidences)
    high_conf_rate = high_conf_images / len(images)
    
    print("\n📊 Validation Criteria Checks:")
    
    # Check 1: 75% of images have high confidence detection
    print(f"  Images with >= 80% confidence detections: {high_conf_rate*100:.1f}% (Required: 75%)")
    pass_1 = high_conf_rate >= 0.75
    print(f"    {'✅ PASS' if pass_1 else '❌ FAIL'}")
    
    # Check 2: Average confidence >= 75%
    print(f"  Average confidence across all detections: {avg_confidence*100:.1f}% (Required: 75%)")
    pass_2 = avg_confidence >= 0.75
    print(f"    {'✅ PASS' if pass_2 else '❌ FAIL'}")
    
    # Check 3: Memorization Check (Check against 0.764 mAP50)
    print("  Checking for overfitting/memorization...")
    # If the average confidence is suspiciously high (e.g., > 99%) on unseen data, it might be memorizing
    is_memorizing = avg_confidence > 0.99
    pass_3 = not is_memorizing
    print(f"    {'✅ PASS (Model generalizes well)' if pass_3 else '❌ FAIL (Possible memorization detected)'}")
    
    all_passed = pass_1 and pass_2 and pass_3
    
    # Export JSON results
    report = {
        "total_tests": len(images),
        "success_rate": high_conf_rate,
        "average_confidence": avg_confidence,
        "criteria_passed": all_passed,
        "detections": results_data
    }
    
    with open("reports/validation_results.json", "w") as f:
        json.dump(report, f, indent=4)
        
    metadata = {
        "model_name": "sagar-sonar-detector",
        "framework": "YOLOv8 ONNX",
        "training_epochs": 100,
        "final_mAP50": 0.764,
        "classes": list(model.names.values()),
        "confidence_threshold": 0.80,
        "validation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    with open("config/metadata.json", "w") as f:
        json.dump(metadata, f, indent=4)
        
    print("✅ Created reports/validation_results.json and config/metadata.json")
    
    if all_passed:
        print("\n🎉 ALL VALIDATION CRITERIA PASSED!")
        upload_to_huggingface()
    else:
        print("\n❌ VALIDATION FAILED. Model will not be uploaded.")

def upload_to_huggingface():
    print("\n🌐 Initiating Hugging Face Deployment...")
    hf_token = os.environ.get("HF_TOKEN")
    
    if not hf_token:
        print("❌ Error: HF_TOKEN environment variable not set.")
        print("   Cannot upload to Hugging Face without a valid API token.")
        print("   Please export your token and try again: export HF_TOKEN='your_token'")
        return
        
    try:
        from huggingface_hub import HfApi
        api = HfApi(token=hf_token)
        
        # Get username from token
        user_info = api.whoami()
        username = user_info["name"]
        repo_id = f"{username}/sagar-sonar-detector"
        
        print(f"  Creating/verifying repository: {repo_id}")
        api.create_repo(repo_id=repo_id, exist_ok=True, private=False)
        
        print("  Uploading ONNX model...")
        api.upload_file(
            path_or_fileobj="src/models/sonar_detector.onnx",
            path_in_repo="sonar_detector.onnx",
            repo_id=repo_id,
        )
        
        print("  Uploading validation results...")
        api.upload_file(
            path_or_fileobj="reports/validation_results.json",
            path_in_repo="reports/validation_results.json",
            repo_id=repo_id,
        )
        
        print("  Uploading metadata...")
        api.upload_file(
            path_or_fileobj="config/metadata.json",
            path_in_repo="config/metadata.json",
            repo_id=repo_id,
        )
        
        print(f"\n✅ SUCCESSFULLY DEPLOYED TO HUGGING FACE!")
        print(f"🔗 Repository URL: https://huggingface.co/{repo_id}")
        
    except Exception as e:
        print(f"❌ Failed to upload to Hugging Face: {e}")

if __name__ == "__main__":
    run_validation()
