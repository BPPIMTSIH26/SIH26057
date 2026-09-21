import os
from huggingface_hub import snapshot_download

DATASET_REPO = "rehan9599/drishti-sss"
REVISION = "627849579f6dcee0897a112c6796736eb7900032"
LOCAL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "HG_DATA")

def download_dataset():
    print(f"Downloading {DATASET_REPO} @ {REVISION} to {LOCAL_DIR}...")
    
    # Using huggingface_hub to download the specific revision
    # Ensure it supports resuming
    snapshot_download(
        repo_id=DATASET_REPO,
        revision=REVISION,
        repo_type="dataset",
        local_dir=LOCAL_DIR,
        resume_download=True,
    )
    
    print(f"Dataset downloaded successfully to {LOCAL_DIR}")

if __name__ == "__main__":
    download_dataset()
