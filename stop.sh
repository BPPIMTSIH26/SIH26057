#!/usr/bin/env bash

echo "🛑 Stopping NetraSonar / SAGAR services..."

# Find and kill processes listening on ports 8000 and 5173
PIDS=$(lsof -ti :8000 -ti :5173 2>/dev/null || true)

if [ -n "$PIDS" ]; then
  echo "Terminating processes on ports 8000 & 5173 (PIDs: $PIDS)..."
  kill -9 $PIDS 2>/dev/null || true
  echo "✅ Ports 8000 and 5173 have been freed."
else
  echo "ℹ️ No running services detected on ports 8000 or 5173."
fi

# Clean up any remaining uvicorn or vite processes related to NetraSonar
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✨ All NetraSonar services stopped successfully."
