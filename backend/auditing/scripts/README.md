# backend/auditing/scripts/

This folder contains service orchestration, startup, and shutdown scripts for the S.A.G.A.R. / NetraSonar platform.

| File | Purpose |
|------|---------|
| `start.sh` | Bash launcher — starts FastAPI backend (port 8000) and Vite frontend (port 5173) |
| `stop.sh` | Bash shutdown — gracefully terminates all services on ports 8000 and 5173 |
| `run.py` | Python launcher wrapper — calls `start.sh` with graceful signal handling |

## Usage

From the **project root**, run:

```bash
# Preferred: single command via npm
npm start

# Or directly via bash
bash backend/auditing/scripts/start.sh

# Or via Python
python backend/auditing/scripts/run.py
```
