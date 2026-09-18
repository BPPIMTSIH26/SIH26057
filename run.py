#!/usr/bin/env python3
"""
SagarNetra / NetraSonar Unified Launcher
Runs both the FastAPI backend and Vite frontend with graceful Ctrl+C shutdown.
"""
import os
import sys
import subprocess

def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    start_sh = os.path.join(project_root, "start.sh")
    stop_sh = os.path.join(project_root, "stop.sh")

    if not os.path.exists(start_sh):
        print("Error: start.sh not found.")
        sys.exit(1)

    try:
        proc = subprocess.Popen(["bash", start_sh], cwd=project_root)
        proc.wait()
    except KeyboardInterrupt:
        print("\n[run.py] Caught Ctrl+C, shutting down services...")
        if os.path.exists(stop_sh):
            subprocess.run(["bash", stop_sh], cwd=project_root)
        sys.exit(0)

if __name__ == "__main__":
    main()
