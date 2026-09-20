"""
Safe migration and normalization script to ensure stable port_id foreign keys 
are established across all missions and anomalies in the database.
"""
from sqlalchemy import text
from app.database.database import SessionLocal, engine
from app.database.models import Mission, Anomaly

PORT_NAME_TO_ID = {
    "mumbai harbor q3": "mumbai",
    "mumbai": "mumbai",
    "chennai port": "chennai",
    "chennai": "chennai",
    "kochi harbor": "kochi",
    "kochi": "kochi",
    "visakhapatnam port": "visakhapatnam",
    "visakhapatnam": "visakhapatnam",
    "jawaharlal nehru port": "jawaharlal-nehru",
    "jawaharlal nehru": "jawaharlal-nehru",
    "kolkata port": "kolkata",
    "kolkata": "kolkata",
    "paradip port": "paradip",
    "parade port": "paradip",
    "parade": "paradip",
    "paradip": "paradip",
    "thunder bay, lake huron": "thunder-bay",
    "thunder bay": "thunder-bay",
    "lake huron": "lake-huron",
}

ANOMALY_PREFIX_TO_PORT = {
    "MUM": "mumbai",
    "CHE": "chennai",
    "KOC": "kochi",
    "VIZ": "visakhapatnam",
    "JAW": "jawaharlal-nehru",
    "KOL": "kolkata",
    "PAR": "paradip",
    "THU": "thunder-bay",
    "LAK": "lake-huron",
}

def normalize():
    # 1. Ensure columns exist
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE missions ADD COLUMN IF NOT EXISTS port_id VARCHAR;"))
        conn.execute(text("ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS port_id VARCHAR;"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_missions_port_id ON missions (port_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_anomalies_port_id ON anomalies (port_id);"))
        conn.commit()
        print("Schema verified: port_id columns and indices ensured.")

    db = SessionLocal()
    try:
        # 2. Update missions
        missions = db.query(Mission).all()
        mission_port_map = {}
        for m in missions:
            m_key = (m.mission_id or "").lower().strip()
            p_id = PORT_NAME_TO_ID.get(m_key)
            if not p_id and m.name:
                for k, v in PORT_NAME_TO_ID.items():
                    if k in m.name.lower():
                        p_id = v
                        break
            if not p_id and m.mission_id and "-" in m.mission_id:
                prefix = m.mission_id.split("-")[0].upper()
                p_id = ANOMALY_PREFIX_TO_PORT.get(prefix)

            if p_id:
                m.port_id = p_id
                mission_port_map[m.id] = p_id
            else:
                print(f"Warning: Could not determine port_id for mission {m.id} ({m.mission_id}, {m.name})")

        db.commit()
        print(f"Normalized {len(mission_port_map)} missions with port_id.")

        # 3. Update anomalies
        anomalies = db.query(Anomaly).all()
        updated_anomalies = 0
        for a in anomalies:
            p_id = mission_port_map.get(a.mission_id)
            if not p_id and a.anomaly_id and "-" in a.anomaly_id:
                prefix = a.anomaly_id.split("-")[0].upper()
                p_id = ANOMALY_PREFIX_TO_PORT.get(prefix)
            
            if p_id:
                a.port_id = p_id
                updated_anomalies += 1
            else:
                print(f"Warning: Could not determine port_id for anomaly {a.id} ({a.anomaly_id})")

        db.commit()
        print(f"Successfully normalized {updated_anomalies}/{len(anomalies)} anomalies with port_id.")
    finally:
        db.close()

if __name__ == "__main__":
    normalize()
