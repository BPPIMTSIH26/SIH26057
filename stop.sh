#!/usr/bin/env bash
# S.A.G.A.R. NetraSonar — Single Command Shutdown
echo "🛑 Stopping all NetraSonar backend & frontend services..."
PIDS=$(lsof -ti :8000 -ti :5173 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill -9 $PIDS 2>/dev/null || true
  echo "✅ Successfully stopped processes running on ports 8000 & 5173."
else
  echo "ℹ️ No running services detected on ports 8000 or 5173."
fi
