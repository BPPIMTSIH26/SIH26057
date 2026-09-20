import json
import random

water_centers = {
  'Lake Huron': {'lat': 45.0500, 'lng': -83.0000},
  'Thunder Bay': {'lat': 45.0500, 'lng': -83.0000},
  'Mumbai': {'lat': 18.9300, 'lng': 72.6500},
  'Chennai': {'lat': 13.0800, 'lng': 80.4500},
  'Kochi': {'lat': 9.9500, 'lng': 76.0500},
  'Visakhapatnam': {'lat': 17.5500, 'lng': 83.4500},
  'Jawaharlal Nehru': {'lat': 18.8000, 'lng': 72.8000},
  'Kolkata': {'lat': 21.3000, 'lng': 88.0000},
  'Parade': {'lat': 20.1000, 'lng': 86.8500}
}

def generate_anomalies_for_port(port_name, base_lat, base_lon, count):
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
        # Increased jitter to spread them out nicely in the ocean
        lat_jitter = random.uniform(-0.015, 0.015)
        lon_jitter = random.uniform(-0.015, 0.015)
        
        atype, aclass, asev = random.choice(anomaly_types)
        
        anom = {
            "anomaly_id": f"{port_prefix}-A{i+1:02d}",
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
    
    if port in water_centers:
        base_lat = water_centers[port]["lat"]
        base_lon = water_centers[port]["lng"]
        
        # We replace any existing anomalies with 15 brand new, ocean-only ones
        new_anomalies = generate_anomalies_for_port(port, base_lat, base_lon, 15)
        survey["anomalies"] = new_anomalies
        print(f"Replaced anomalies for {port} with 15 ocean-centered anomalies.")

with open("synthetic_data.json", "w") as f:
    json.dump(data, f, indent=2)
