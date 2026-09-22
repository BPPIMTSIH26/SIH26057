import os
from sqlalchemy import create_engine
engine = create_engine("postgresql://neondb_owner:npg_jIB1unJWAfs9@ep-dawn-supply-a4k8t63u-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require")
with engine.connect() as conn:
    res = conn.execute("SELECT anomaly_id, type, explanation FROM anomalies ORDER BY created_at DESC LIMIT 5")
    for r in res:
        print(r)
