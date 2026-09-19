# backend/auditing/

This folder houses all auditing, database migration, deployment configurations, maintenance scripts, and testing specifications for the S.A.G.A.R. / NetraSonar platform.

| Directory / File | Purpose |
|------------------|---------|
| `API_CONTRACT.md` | Full REST API contract — all endpoints, request/response schemas, and HTTP codes |
| `report.md` | Comprehensive security, architecture, and quality audit report |
| `config/` | Linter, type-checker, and developer environment configurations |
| `deployment/` | Multi-container Docker Compose and cloud hosting deployment manifests |
| `scripts/` | Unified service orchestration launchers (`start.sh`, `stop.sh`, `run.py`) |
| `seed_all.py` | Master database seed script — populates harbors, anomalies, and missions |
| `seed_data.py` | Seeds core mission, vessel, and bathymetric sonar records |
| `seed_anomalies.py` | Seeds calibrated anomaly detection test sets across maritime regions |
| `fix_seed_coords.py` | Geolocation coordinate calibration script |
| `migrate_users.py` | Database schema user table migration utility |

> **Execution Note**: Run seed and migration scripts from the project root using the backend environment:
> ```bash
> backend/venv/bin/python backend/auditing/seed_all.py
> ```
