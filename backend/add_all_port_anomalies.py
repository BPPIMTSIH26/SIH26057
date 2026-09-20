import json
import random

def generate_anomalies_for_port(port_name, base_lat, base_lon, count, start_id_index=3):
    anomalies = []
    anomaly_types = [
        ("Submerged debris", "UNKNOWN", "LOW"),
        ("Sediment plume", "KNOWN", "MEDIUM"),
        ("Vessel wreck", "UNKNOWN", "HIGH"),
        ("Scour depression", "KNOWN", "MEDIUM"),
        ("Pipeline or cable exposure", "UNKNOWN", "HIGH"),
        ("Siltation / seabed shoaling", "UNKNOWN", "MEDIUM"),
        ("Rock or hard-bottom return", "KNOWN", "LOW")
    ]
    
    port_prefix = port_name[:3].upper()
    
    for i in range(count):
        lat_jitter = random.uniform(-0.005, 0.005)
        lon_jitter = random.uniform(-0.005, 0.005)
        
        atype, aclass, asev = random.choice(anomaly_types)
        
        anom = {
            "anomaly_id": f"{port_prefix}-A{start_id_index + i:02d}",
            "location": port_name,
            "latitude": round(base_lat + lat_jitter, 6),
            "longitude": round(base_lon + lon_jitter, 6),
            "timestamp_utc": f"2026-09-20T{random.randint(10, 18):02d}:{random.randint(10, 59):02d}:00Z",
            "anomaly_type": atype,
            "classification": aclass,
            "confidence_percent": random.randint(75, 99),
            "severity": asev,
            "depth_m": round(random.uniform(15.0, 45.0), 1),
            "expected_depth_m": round(random.uniform(15.0, 45.0), 1),
            "depth_delta_m": round(random.uniform(-5.0, 5.0), 1),
            "backscatter_db": round(random.uniform(-30.0, -10.0), 1),
            "expected_backscatter_db": round(random.uniform(-40.0, -25.0), 1),
            "backscatter_delta_db": round(random.uniform(-10.0, 15.0), 1),
            "dimensions_m": {
                "length": round(random.uniform(2, 50), 1),
                "width": round(random.uniform(1, 20), 1),
                "height_or relief": round(random.uniform(0.5, 5.0), 1)
            },
            "evidence": f"AI identified anomalous signature typical of {atype.lower()}.",
            "possible_hazard": "Potential risk to navigation or infrastructure depending on draft.",
            "recommended_action": "Verify via secondary scan or visual inspection.",
            "status": "REQUIRES_REVIEW"
        }
        anomalies.append(anom)
    return anomalies

with open("synthetic_data.json", "r") as f:
    data = json.load(f)

for survey in data.get("surveys", []):
    port = survey.get("port_name")
    anomalies = survey.get("anomalies", [])
    
    if len(anomalies) < 5:
        # Determine base lat/lon from the first record or first anomaly
        base_lat = None
        base_lon = None
        if "records" in survey and len(survey["records"]) > 0:
            base_lat = survey["records"][0].get("latitude")
            base_lon = survey["records"][0].get("longitude")
        elif len(anomalies) > 0:
            base_lat = anomalies[0].get("latitude")
            base_lon = anomalies[0].get("longitude")
        
        if base_lat is not None and base_lon is not None:
            needed = 5 - len(anomalies)
            new_anomalies = generate_anomalies_for_port(port, base_lat, base_lon, needed, len(anomalies) + 1)
            anomalies.extend(new_anomalies)
            print(f"Added {needed} anomalies to {port}")

with open("synthetic_data.json", "w") as f:
    json.dump(data, f, indent=2)
