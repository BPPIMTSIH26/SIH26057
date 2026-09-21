"""
Mirror rehan9599/drishti-sss → Narayan-nkj/sagar-sss
1. Download the full dataset locally
2. Upload it to the new repo under the SAGAR name
3. Upload the dataset card
"""
import os
from huggingface_hub import login, snapshot_download, HfApi, upload_folder

TOKEN = os.environ.get("HF_TOKEN", "")
SRC_REPO  = "rehan9599/drishti-sss"
DST_REPO  = "Narayan-nkj/sagar-sss"
LOCAL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "HG_DATA")

login(TOKEN)
api = HfApi()

# ── 1. Download ──────────────────────────────────────────────────────────────
print(f"\n[1/3] Downloading {SRC_REPO} → {LOCAL_DIR}")
snapshot_download(
    repo_id=SRC_REPO,
    repo_type="dataset",
    local_dir=LOCAL_DIR,
    max_workers=8,
)
print("✅ Download complete")

# ── 2. Upload dataset card ───────────────────────────────────────────────────
card_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                         "docs", "HUGGINGFACE_DATASET_CARD.md")
print(f"\n[2/3] Uploading dataset card from {card_path}")
if os.path.exists(card_path):
    with open(card_path, "r") as f:
        card_content = f.read()
    api.upload_file(
        path_or_fileobj=card_content.encode(),
        path_in_repo="README.md",
        repo_id=DST_REPO,
        repo_type="dataset",
        token=TOKEN,
        commit_message="docs: add SAGAR dataset card",
    )
    print("✅ Dataset card uploaded")
else:
    print("⚠️  Dataset card not found, skipping")

# ── 3. Upload dataset files ──────────────────────────────────────────────────
print(f"\n[3/3] Uploading dataset files from {LOCAL_DIR} → {DST_REPO}")
upload_folder(
    folder_path=LOCAL_DIR,
    repo_id=DST_REPO,
    repo_type="dataset",
    token=TOKEN,
    commit_message="feat: initial SAGAR side-scan sonar dataset upload",
    ignore_patterns=["*.cache", ".locks", ".huggingface", "*.arrow", "*.parquet"],
)
print(f"\n🎉 All done! Dataset live at: https://huggingface.co/datasets/{DST_REPO}")
