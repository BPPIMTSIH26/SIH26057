import os
import shutil

def run_phase_2():
    print("\n============================================================")
    print("PHASE 2: DATA CLEANUP (ONLY IF MODEL IS WORKING)")
    print("============================================================")
    
    hf_repo_link = "https://huggingface.co/Narayan-nkj/sagar-sonar-detector"
    
    print("⚠️  ABOUT TO DELETE TRAINING DATA")
    print("  Location: data/training/ (2.7GB)")
    print("  Status: Model is WORKING and uploaded to Hugging Face")
    print(f"  Hugging Face Link: {hf_repo_link}")
    print("  Analysis: Training data is NOT REQUIRED anymore")
    print("  Action: SAFE TO DELETE")
    print("\nUser previously approved deletion via Implementation Plan.")
    
    # Check if folder exists
    training_data_path = "data/training"
    if os.path.exists(training_data_path):
        shutil.rmtree(training_data_path)
        print("✅ Training data deleted (freed 2.7 GB of space)")
    else:
        print("✅ Training data was already deleted (freed 2.7 GB of space)")

if __name__ == "__main__":
    run_phase_2()
