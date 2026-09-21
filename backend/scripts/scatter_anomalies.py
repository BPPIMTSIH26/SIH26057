import sys
import os
import random
import json
from shapely.geometry import Point, Polygon

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.database import SessionLocal
from app.database.models import Anomaly, Mission
from sqlalchemy import text
from app.services.water_boundary_service import PORT_WATER_POLYGONS, _SHAPELY_POLYGONS

PORT_NAME_TO_ID = {
    "mumbai": "mumbai",
    "Mumbai": "mumbai",
    "Mumbai Harbor": "mumbai",
    "chennai": "chennai",
    "Chennai": "chennai",
    "Chennai Port": "chennai",
    "kochi": "kochi",
    "Kochi": "kochi",
    "Kochi Harbor": "kochi",
    "visakhapatnam": "visakhapatnam",
    "Visakhapatnam": "visakhapatnam",
    "Visakhapatnam Port": "visakhapatnam",
    "kolkata": "kolkata",
    "Kolkata": "kolkata",
    "Kolkata Port": "kolkata",
    "jawaharlal-nehru": "jawaharlal-nehru",
    "Jawaharlal Nehru": "jawaharlal-nehru",
    "Jawaharlal Nehru Port": "jawaharlal-nehru",
    "paradip": "paradip",
    "Paradip": "paradip",
    "Paradip Port": "paradip",
    "Parade": "paradip",
    "thunder-bay": "thunder-bay",
    "Thunder Bay": "thunder-bay",
    "lake-huron": "lake-huron",
    "Lake Huron": "lake-huron",
}

def get_random_point_in_polygon(poly: Polygon) -> Point:
    min_x, min_y, max_x, max_y = poly.bounds
    while True:
        # Shapely is (lon, lat)
        p = Point(random.uniform(min_x, max_x), random.uniform(min_y, max_y))
        if poly.contains(p):
            return p

def scatter_db():
    db = SessionLocal()
    try:
        anomalies = db.query(Anomaly).all()
        missions = {m.id: m for m in db.query(Mission).all()}
        
        updated = 0
        
        for a in anomalies:
            raw_port = a.port_id
            if not raw_port:
                mission = missions.get(a.mission_id)
                if mission:
                    raw_port = mission.port_id or mission.location

            port_id = PORT_NAME_TO_ID.get(raw_port) if raw_port else None
            
            if not port_id or port_id not in _SHAPELY_POLYGONS:
                if a.anomaly_id:
                    prefix = a.anomaly_id[:3].upper()
                    prefix_map = {
                        "MUM": "mumbai", "CHE": "chennai", "KOC": "kochi",
                        "VIS": "visakhapatnam", "KOL": "kolkata",
                        "JAW": "jawaharlal-nehru", "JNP": "jawaharlal-nehru",
                        "PAR": "paradip", "THU": "thunder-bay", "LAK": "lake-huron",
                    }
                    port_id = prefix_map.get(prefix)

            if port_id and port_id in _SHAPELY_POLYGONS:
                poly = _SHAPELY_POLYGONS[port_id]
                random_point = get_random_point_in_polygon(poly)
                a.longitude = round(random_point.x, 6)
                a.latitude = round(random_point.y, 6)
                a.coordinate_status = "VALIDATED_WATER"
                a.is_water_validated = True
                updated += 1
                
        db.commit()
        print(f"Scattered {updated} anomalies in DB.")
    finally:
        db.close()

def scatter_json():
    filepath = "/Users/narayanjha/Documents/NetraSonar/backend/synthetic_data.json"
    with open(filepath, "r") as f:
        data = json.load(f)
        
    updated = 0
    for survey in data.get("surveys", []):
        port_name = survey.get("port_name")
        port_id = PORT_NAME_TO_ID.get(port_name)
        if port_id and port_id in _SHAPELY_POLYGONS:
            poly = _SHAPELY_POLYGONS[port_id]
            for anomaly in survey.get("anomalies", []):
                p = get_random_point_in_polygon(poly)
                anomaly["longitude"] = round(p.x, 6)
                anomaly["latitude"] = round(p.y, 6)
                updated += 1

    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Scattered {updated} anomalies in JSON.")

if __name__ == "__main__":
    print("Scattering anomalies within water boundaries...")
    scatter_db()
    scatter_json()
    print("Done.")
