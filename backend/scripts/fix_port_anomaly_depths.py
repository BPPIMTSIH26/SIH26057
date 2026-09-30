"""
Fix Port Anomaly Depths across all ports in database and synthetic datasets.
Assigns realistic, distinct, varied anomaly depths scaled to each port's water depth envelope.
"""
import sys
import os
import json
import hashlib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal
from app.database.models import Anomaly, Mission

PORT_MAX_DEPTHS = {
    'mumbai': 14.0,
    'chennai': 18.0,
    'kochi': 13.0,
    'visakhapatnam': 18.1,
    'kolkata': 8.5,
    'jawaharlal-nehru': 15.0,
    'paradip': 17.0,
    'thunder-bay': 40.0,
    'lake-huron': 45.0
}

PREFIX_TO_PORT = {
    "MUM": "mumbai",
    "CHE": "chennai",
    "KOC": "kochi",
    "VIS": "visakhapatnam",
    "VIZ": "visakhapatnam",
    "KOL": "kolkata",
    "JAW": "jawaharlal-nehru",
    "JNP": "jawaharlal-nehru",
    "PAR": "paradip",
    "THU": "thunder-bay",
    "LAK": "lake-huron",
}

def compute_realistic_depth(port_id: str, anomaly_key: str) -> float:
    max_d = PORT_MAX_DEPTHS.get(port_id, 15.0)
    min_d = max(3.5, round(max_d * 0.45, 1))
    
    # Deterministic hash ratio between 0.05 and 0.95
    h = int(hashlib.md5(anomaly_key.encode('utf-8')).hexdigest(), 16)
    ratio = 0.08 + (h % 84) / 100.0  # ratio in [0.08, 0.91]
    
    depth = round(min_d + ratio * (max_d - min_d), 1)
    return min(depth, max_d)

def run():
    print("=" * 60)
    print("FIXING ANOMALY DEPTHS FOR ALL PORTS")
    print("=" * 60)

    db = SessionLocal()
    try:
        anomalies = db.query(Anomaly).all()
        missions = {m.id: m for m in db.query(Mission).all()}
        
        updated_count = 0
        for a in anomalies:
            port_id = a.port_id
            if not port_id and a.mission_id:
                m = missions.get(a.mission_id)
                if m:
                    port_id = m.port_id
            if not port_id and a.anomaly_id:
                prefix = a.anomaly_id[:3].upper()
                port_id = PREFIX_TO_PORT.get(prefix)
            
            if not port_id:
                port_id = 'mumbai'
            
            key = a.anomaly_id or a.id
            new_depth = compute_realistic_depth(port_id, key)
            a.depth = new_depth
            updated_count += 1

        db.commit()
        print(f"✅ Successfully updated {updated_count} anomaly depth records in database.")

        # Also update synthetic_data.json if present
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(backend_dir, "synthetic_data.json")
        if os.path.exists(json_path):
            with open(json_path, "r") as f:
                data = json.load(f)
            
            synth_count = 0
            for survey in data.get("surveys", []):
                port_name = survey.get("port_name", "").lower()
                matched_port = None
                for k in PORT_MAX_DEPTHS:
                    if k in port_name:
                        matched_port = k
                        break
                
                for anom in survey.get("anomalies", []):
                    anom_id = anom.get("anomaly_id") or str(synth_count)
                    p_id = matched_port or "mumbai"
                    d = compute_realistic_depth(p_id, anom_id)
                    anom["depth_m"] = d
                    anom["expected_depth_m"] = PORT_MAX_DEPTHS.get(p_id, 15.0)
                    anom["depth_delta_m"] = round(d - PORT_MAX_DEPTHS.get(p_id, 15.0), 1)
                    synth_count += 1

            with open(json_path, "w") as f:
                json.dump(data, f, indent=2)
            print(f"✅ Successfully updated {synth_count} anomalies in synthetic_data.json.")

    finally:
        db.close()

if __name__ == "__main__":
    run()
