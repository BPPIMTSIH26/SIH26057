# auditing/

This folder contains all audit, database seeding, data migration, and API specification documents for the S.A.G.A.R. / NetraSonar platform.

| File | Purpose |
|------|---------|
| `API_CONTRACT.md` | Full REST API contract — all endpoints, request/response schemas, and HTTP codes |
| `report.md` | Technical report — stack, ML models, detected hazard data |
| `seed_all.py` | Master seed script — seeds full initial dataset (missions, anomalies, reports) |
| `seed_data.py` | Seeds core mission and image data |
| `seed_anomalies.py` | Seeds anomaly detection results for demo and test scenarios |
| `fix_seed_coords.py` | One-time migration to fix coordinate precision in seeded anomaly records |
| `migrate_users.py` | One-time user schema migration script |

> **Note**: Run seed scripts from the project root using the backend venv:
> ```bash
> backend/venv/bin/python auditing/seed_all.py
> ```
