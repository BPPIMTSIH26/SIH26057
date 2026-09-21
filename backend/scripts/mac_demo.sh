#!/bin/bash
set -e

echo "======================================"
echo " DRISHTI Backend: macOS Demo Launcher"
echo "======================================"

# Determine project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

echo "-> Setting up environment..."
source venv/bin/activate

echo "-> Checking Redis..."
if ! pgrep -x "redis-server" > /dev/null; then
    echo "   Redis is not running natively."
    if ! docker ps | grep -q "redis"; then
        echo "   Redis Docker container is not running either. Please start Redis."
        echo "   Example: docker run --name drishti-redis -p 6379:6379 -d redis"
        exit 1
    fi
    echo "   Redis container found."
else
    echo "   Native Redis server found."
fi

echo "-> Running Dataset & Pipeline Verification..."
if [ ! -f "data/dataset/DATASET_VERIFICATION.json" ]; then
    echo "   DATASET_VERIFICATION.json not found. Run scripts/verify_drishti_dataset.py"
fi

if [ ! -f "models/drishti_best.onnx" ]; then
    echo "   ONNX model not found. Ensure training and export are complete."
fi

echo "-> Running Database Migrations..."
alembic upgrade head

# Trap to kill background processes on exit
trap 'kill $(jobs -p)' EXIT

echo "-> Starting Celery Worker..."
celery -A app.worker.celery_app worker --loglevel=info &

echo "-> Starting Uvicorn API Server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo "-> Exiting gracefully..."
