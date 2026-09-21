import os
import time
import subprocess
from huggingface_hub import snapshot_download
from huggingface_hub.utils import HfHubHTTPError

DATASET_REPO = "rehan9599/drishti-sss"
REVISION = "627849579f6dcee0897a112c6796736eb7900032"
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOCAL_DIR = os.path.join(BASE_DIR, "data", "dataset", "hf")

def wait_for_process(process_name, poll_interval=10):
    print(f"Waiting for any process matching '{process_name}' to finish...")
    while True:
        try:
            # Check if process is running
            output = subprocess.check_output(["pgrep", "-f", process_name]).decode("utf-8")
            # If pgrep finds something, wait
            if output.strip():
                # Avoid counting ourselves if we match the name, but this script is queue_full_training.py
                print(f"Process '{process_name}' is still running. Waiting {poll_interval} seconds...")
                time.sleep(poll_interval)
            else:
                break
        except subprocess.CalledProcessError:
            # pgrep returns non-zero if no process found
            break
    print(f"No running processes matching '{process_name}' found. Proceeding.")

def download_dataset_with_backoff():
    print(f"Starting download of {DATASET_REPO} @ {REVISION} to {LOCAL_DIR}...")
    
    max_retries = 10
    base_delay = 5  # seconds
    
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("WARNING: HF_TOKEN environment variable not set. Download might hit rate limits.")
    
    for attempt in range(max_retries):
        try:
            snapshot_download(
                repo_id=DATASET_REPO,
                revision=REVISION,
                repo_type="dataset",
                local_dir=LOCAL_DIR,
                resume_download=True,
                token=token
            )
            print(f"Dataset fully downloaded successfully on attempt {attempt + 1}")
            return
        except Exception as e:
            delay = base_delay * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed with error: {str(e)}")
            if attempt < max_retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print("Max retries reached. Download failed.")
                raise e

def update_checklist():
    verify_script = os.path.join(BASE_DIR, "scripts", "final_verify.py")
    if os.path.exists(verify_script):
        print("Running final_verify.py to update checklist...")
        subprocess.run(["/Library/Frameworks/Python.framework/Versions/3.14/bin/python3", verify_script], check=True)
    else:
        print(f"Could not find verify script at {verify_script}")

def run_full_training():
    train_script = os.path.join(BASE_DIR, "scripts", "train_drishti.py")
    print(f"Queueing full training run with {train_script} (100 epochs)...")
    subprocess.Popen(["/Library/Frameworks/Python.framework/Versions/3.14/bin/python3", train_script, "--epochs", "100"])

def main():
    # 1. Wait for the current training run to finish
    wait_for_process("train_drishti.py")
    
    # 2. Download with exponential backoff
    download_dataset_with_backoff()
    
    # 3. Update the checklist
    update_checklist()
    
    # 4. Queue a full training run
    run_full_training()
    print("Full pipeline completed successfully.")

if __name__ == "__main__":
    main()
