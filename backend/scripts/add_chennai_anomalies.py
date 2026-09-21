import json

with open("synthetic_data.json", "r") as f:
    data = json.load(f)

surveys = data.get("surveys", [])
for item in surveys:
    if item.get("port_name") == "Chennai":
        # we have 2, let's add 3 more
        base_lat = 13.086
        base_lon = 80.2736
        item["anomalies"].extend([
            {
              "anomaly_id": "CHE-A03",
              "location": "Chennai",
              "latitude": 13.088,
              "longitude": 80.275,
              "timestamp_utc": "2026-09-20T16:45:00Z",
              "anomaly_type": "Submerged debris",
              "classification": "UNKNOWN",
              "confidence_percent": 82,
              "severity": "LOW",
              "depth_m": 25.1,
              "expected_depth_m": 25.0,
              "depth_delta_m": 0.1,
              "backscatter_db": -22.5,
              "expected_backscatter_db": -31.9,
              "backscatter_delta_db": 9.4,
              "dimensions_m": {
                "length": 5,
                "width": 2,
                "height_or relief": 1.1
              },
              "evidence": "Irregular shaped object causing strong return.",
              "possible_hazard": "Navigational hazard for small drafts.",
              "recommended_action": "Monitor on next survey.",
              "status": "REQUIRES_REVIEW"
            },
            {
              "anomaly_id": "CHE-A04",
              "location": "Chennai",
              "latitude": 13.082,
              "longitude": 80.271,
              "timestamp_utc": "2026-09-20T17:15:00Z",
              "anomaly_type": "Sediment plume",
              "classification": "KNOWN",
              "confidence_percent": 95,
              "severity": "MEDIUM",
              "depth_m": 23.5,
              "expected_depth_m": 24.5,
              "depth_delta_m": -1.0,
              "backscatter_db": -28.0,
              "expected_backscatter_db": -31.0,
              "backscatter_delta_db": 3.0,
              "dimensions_m": {
                "length": 150,
                "width": 80,
                "height_or relief": 0
              },
              "evidence": "Suspended sediment affecting acoustic return.",
              "possible_hazard": "Visibility and dredging indicator.",
              "recommended_action": "Inform dredging team.",
              "status": "REQUIRES_REVIEW"
            },
            {
              "anomaly_id": "CHE-A05",
              "location": "Chennai",
              "latitude": 13.092,
              "longitude": 80.279,
              "timestamp_utc": "2026-09-20T17:40:00Z",
              "anomaly_type": "Vessel wreck",
              "classification": "UNKNOWN",
              "confidence_percent": 98,
              "severity": "HIGH",
              "depth_m": 28.0,
              "expected_depth_m": 35.0,
              "depth_delta_m": -7.0,
              "backscatter_db": -12.0,
              "expected_backscatter_db": -35.0,
              "backscatter_delta_db": 23.0,
              "dimensions_m": {
                "length": 22,
                "width": 6,
                "height_or relief": 4.5
              },
              "evidence": "Distinct hull shape and strong shadow.",
              "possible_hazard": "Major navigational hazard.",
              "recommended_action": "Immediate verified survey required.",
              "status": "REQUIRES_REVIEW"
            }
        ])

with open("synthetic_data.json", "w") as f:
    json.dump(data, f, indent=2)
