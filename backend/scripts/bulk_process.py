import os
import sys
import time
import json
import requests

API_BASE = "http://localhost:8000"
HG_DATA_DIR = "/Users/narayanjha/Documents/NetraSonar/HG_DATA"

def main():
    print("=" * 60)
    print("BULK ANOMALY PROCESSING — HG_DATA Images")
    print("=" * 60)
    
    # Login as Supreme Admin
    print("\n[1/3] Logging in...")
    res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "narayan.nkj@gmail.com",
        "password": "supreme123"
    })
    
    if res.status_code != 200:
        print(f"Login failed ({res.status_code}): {res.text}")
        sys.exit(1)
        
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")
    
    # Get image files
    files_to_process = sorted([
        f for f in os.listdir(HG_DATA_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.tiff', '.tif'))
    ])
    print(f"\n[2/3] Found {len(files_to_process)} images to process.\n")
    
    total_anomalies = 0
    
    for idx, filename in enumerate(files_to_process, 1):
        filepath = os.path.join(HG_DATA_DIR, filename)
        print(f"  [{idx}/{len(files_to_process)}] {filename}")
        print(f"    Uploading...", end=" ", flush=True)
        
        with open(filepath, "rb") as f:
            upload_res = requests.post(
                f"{API_BASE}/api/v1/image-processing/jobs",
                headers=headers,
                files={"file": (filename, f, "image/jpeg")}
            )
            
        if upload_res.status_code != 200:
            print(f"FAILED: {upload_res.text}")
            continue
            
        job_data = upload_res.json()
        job_id = job_data["jobId"]
        print(f"Job {job_id[:8]}... created.")
        
        # Poll for completion
        print(f"    Processing...", end=" ", flush=True)
        start = time.time()
        while True:
            status_res = requests.get(
                f"{API_BASE}/api/v1/image-processing/jobs/{job_id}",
                headers=headers
            )
            job = status_res.json()
            st = job.get("status", "unknown")
            if st in ["completed", "failed", "assessed"]:
                break
            time.sleep(0.5)
            
        elapsed = time.time() - start
        
        if st == "failed":
            print(f"FAILED after {elapsed:.1f}s")
            continue
            
        print(f"Done in {elapsed:.1f}s.")
        
        # Check detections
        regions = job.get("regionAnalysis", [])
        if not regions:
            print(f"    → No anomalies detected.")
            continue
            
        anomaly_count = len(regions)
        total_anomalies += anomaly_count
        labels = [r.get("label", "unknown") for r in regions]
        confs = [r.get("objectConfidence", 0) or 0 for r in regions]
        print(f"    → {anomaly_count} anomaly(ies) detected: {', '.join(labels)}")
        print(f"      Confidence: {', '.join(f'{c*100:.1f}%' for c in confs)}")
        
        # Publish to Human Review
        print(f"    Publishing to Human Review...", end=" ", flush=True)
        pub_res = requests.post(
            f"{API_BASE}/api/v1/image-processing/jobs/{job_id}/publish",
            headers=headers,
            json={
                "latitude": 18.9800 + (idx * 0.001),
                "longitude": 72.8800 + (idx * 0.001),
                "depth_meters": 12.0 + idx
            }
        )
        
        if pub_res.status_code == 200:
            pub_data = pub_res.json()
            print(f"Published! Mission: {pub_data.get('missionId', 'N/A')}, Count: {pub_data.get('publishedCount', 0)}")
        else:
            print(f"FAILED: {pub_res.text}")

    print(f"\n{'=' * 60}")
    print(f"[3/3] COMPLETE — {total_anomalies} total anomalies from {len(files_to_process)} images")
    print(f"       All published anomalies are now in the Human Review queue.")
    print(f"       Navigate to /review in the UI to see them.")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
