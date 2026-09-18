#!/usr/bin/env bash
set -e

# Determine project root directory (one level above scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================================"
echo "   S.A.G.A.R. / NetraSonar Autonomous Command Center   "
echo "========================================================"

# Function to clean up lingering processes on ports
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (PID: $pids)..."
    kill -9 $pids 2>/dev/null || true
  fi
}

# Free ports if previously occupied
free_port 8000
free_port 5173

# Trap Ctrl+C (SIGINT), termination (SIGTERM), and normal EXIT
cleanup() {
  trap - SIGINT SIGTERM EXIT
  echo ""
  echo "🛑 Stopping all S.A.G.A.R. services..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  # Extra safeguard: ensure processes on ports 8000 and 5173 are released
  free_port 8000
  free_port 5173
  echo "✨ All services stopped cleanly."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend
echo "🚀 Starting Backend (FastAPI on http://localhost:8000)..."
if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "Creating Python virtual environment in $BACKEND_DIR/venv..."
  python3 -m venv "$BACKEND_DIR/venv"
  "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app &
BACKEND_PID=$!

# 2. Start Frontend
echo "🚀 Starting Frontend (Vite on http://localhost:5173)..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "  ✅ Services are running:"
echo "     • Frontend:     http://localhost:5173"
echo "     • Backend API:  http://localhost:8000"
echo "     • Swagger Docs: http://localhost:8000/docs"
echo ""
echo "  👉 Press Ctrl+C at any time to stop both servers."
echo "========================================================"
echo ""

# Wait for background processes
wait
