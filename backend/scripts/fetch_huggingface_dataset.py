import os
from huggingface_hub import snapshot_download

HF_REPO_ID = "narayan-nkj/sagar-sss"  # Official S.A.G.A.R. dataset by Narayan Kumar Jha

def main():
    local_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "HG_DATA")

    # Check if we already have some files indicating the dataset is present
    if not os.path.exists(local_data_dir) or len(os.listdir(local_data_dir)) < 2:
        print(f"Downloading S.A.G.A.R. dataset from Hugging Face ({HF_REPO_ID})...")
        snapshot_download(
            repo_id=HF_REPO_ID,
            repo_type="dataset",
            local_dir=local_data_dir,
            max_workers=4
        )
        print("✅ Dataset download complete!")
    else:
        print("✅ S.A.G.A.R. dataset already exists locally. Skipping download.")

if __name__ == "__main__":
    main()
