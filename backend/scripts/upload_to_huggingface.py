import os
from huggingface_hub import HfApi

def upload_model():
    print("============================================================")
    print("HUGGING FACE INTEGRATION")
    print("============================================================")
    
    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        print("❌ Error: HF_TOKEN environment variable not set.")
        return
        
    repo_id = "Narayan-nkj/sagar-sonar-detector"
    model_path = "src/models/sonar_detector.onnx"
    
    try:
        api = HfApi(token=hf_token)
        print(f"Creating/verifying repository: {repo_id}")
        api.create_repo(repo_id=repo_id, exist_ok=True, private=False)
        
        print("Uploading ONNX model...")
        api.upload_file(
            path_or_fileobj=model_path,
            path_in_repo="sonar_detector.onnx",
            repo_id=repo_id
        )
        print("✅ SUCCESSFULLY DEPLOYED TO HUGGING FACE!")
        print(f"🔗 Repository URL: https://huggingface.co/{repo_id}")
        
    except Exception as e:
        print(f"❌ Failed to upload to Hugging Face: {e}")

if __name__ == "__main__":
    upload_model()
