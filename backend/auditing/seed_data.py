import os
import sys
import random
import math
from datetime import datetime, timedelta
import uuid

# Ensure backend package root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.database import engine, Base, SessionLocal
from app.database.models import Mission, SonarImage, Detection, Anomaly

# Map of all active sectors/harbours to seed data for
HARBOURS = {
    'Thunder Bay, Lake Huron': {'lat': 45.1000, 'lng': -83.2000, 'vessel': 'AUV Iver3 (AI4Shipwrecks)'},
    'Mumbai Harbor Q3': {'lat': 18.9387, 'lng': 72.8353, 'vessel': 'R/V Samudra'},
    'Chennai Port': {'lat': 13.0827, 'lng': 80.2707, 'vessel': 'R/V Sagar Kanya'},
    'Kochi Harbor': {'lat': 9.9312, 'lng': 76.2673, 'vessel': 'R/V Sindhu Sadhana'},
    'Visakhapatnam Port': {'lat:': 17.6868, 'lng': 83.2185, 'vessel': 'R/V Gaveshani'},
    'Jawaharlal Nehru Port': {'lat': 18.9500, 'lng': 72.9500, 'vessel': 'R/V Sagar Nidhi'},
    'Kolkata Port': {'lat': 22.5314, 'lng': 88.3225, 'vessel': 'R/V Sagar Manjusha'}, 
    'Paradip Port': {'lat': 20.2662, 'lng': 86.6775, 'vessel': 'R/V Anveshani'},
}

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.water_coordinates import get_random_water_coordinate, DEMO_SEEDS

def get_port_id_from_name(port_name):
    port_mapping = {
        'Mumbai Harbor Q3': 'mumbai',
        'Chennai Port': 'chennai',
        'Kochi Harbor': 'kochi',
        'Visakhapatnam Port': 'visakhapatnam',
        'Jawaharlal Nehru Port': 'jawaharlal-nehru',
        'Kolkata Port': 'kolkata',
        'Paradip Port': 'paradip',
        'Thunder Bay, Lake Huron': 'thunder-bay'
    }
    return port_mapping.get(port_name, 'mumbai')


def seed_database():
    print("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        targets = [
            {"type": "Crab-Pot", "risk_level": "LOW", "base_score": 10},
            {"type": "Ghost Net", "risk_level": "CRITICAL", "base_score": 85},
            {"type": "Maybe-Crab-Pot", "risk_level": "MEDIUM", "base_score": 40},
            {"type": "Debris (Metal)", "risk_level": "HIGH", "base_score": 70},
            {"type": "Ghost Net", "risk_level": "CRITICAL", "base_score": 95},
            {"type": "Crab-Pot", "risk_level": "LOW", "base_score": 15},
            {"type": "Debris (Plastic)", "risk_level": "MEDIUM", "base_score": 50},
        ]

        for harbour_name, data in HARBOURS.items():
            if 'lat' not in data: # Skip Visakhapatnam typo fallback
                data['lat'] = 17.6868

            mission = db.query(Mission).filter_by(mission_id=harbour_name).first()
            if not mission:
                mission = Mission(
                    mission_id=harbour_name,
                    name=f"{harbour_name} Survey",
                    status="COMPLETED",
                    source=data['vessel'],
                    latitude=data['lat'],
                    longitude=data['lng'],
                    depth=random.uniform(15.0, 50.0),
                    heading=random.uniform(0.0, 360.0),
                    vessel_speed=random.uniform(2.5, 6.0),
                    sonar_range=50.0,
                    started_at=datetime.utcnow() - timedelta(hours=2),
                    completed_at=datetime.utcnow()
                )
                db.add(mission)
                db.commit()
                db.refresh(mission)
                print(f"Created Mission: {harbour_name}")

            image = db.query(SonarImage).filter_by(mission_id=mission.id).first()
            if not image:
                image = SonarImage(
                    mission_id=mission.id,
                    filename=f"sonar_{harbour_name.replace(' ', '_').lower()}.jpg",
                    original_path=f"data/demo/sonar_{harbour_name.replace(' ', '_').lower()}.jpg",
                    width=1024,
                    height=1024
                )
                db.add(image)
                db.commit()
                db.refresh(image)
            
            # Check if anomalies already exist for this mission
            existing = db.query(Anomaly).filter_by(mission_id=mission.id).count()
            if existing < 3:
                num_to_seed = random.randint(4, 7)
                sampled_targets = random.sample(targets, num_to_seed)
                
                print(f"Seeding {num_to_seed} anomalies for {harbour_name}...")
                for i, target in enumerate(sampled_targets):
                    port_id = get_port_id_from_name(harbour_name)
                    lat, lng = get_random_water_coordinate(port_id, random)
                    confidence = random.uniform(0.75, 0.98)
                    
                    det = Detection(
                        mission_id=mission.id,
                        sonar_image_id=image.id,
                        class_name=target["type"],
                        confidence=confidence,
                        bbox_x1=random.uniform(10, 500),
                        bbox_y1=random.uniform(10, 500),
                        bbox_x2=random.uniform(510, 1000),
                        bbox_y2=random.uniform(510, 1000),
                        area=random.uniform(100, 5000),
                        risk_score=target["base_score"] / 100.0,
                        risk_level=target["risk_level"],
                        latitude=lat,
                        longitude=lng,
                        depth=random.uniform(10, 30),
                        status="NEW"
                    )
                    db.add(det)
                    db.commit()
                    db.refresh(det)

                    anomaly = Anomaly(
                        mission_id=mission.id,
                        detection_id=det.id,
                        anomaly_id=f"ANO-{harbour_name[:3].upper()}-{100+i}-{random.randint(10,99)}",
                        type=target["type"],
                        confidence=confidence,
                        risk_score=target["base_score"] / 100.0,
                        risk_level=target["risk_level"],
                        latitude=lat,
                        longitude=lng,
                        depth=det.depth,
                        status="NEW",
                        explanation=f"GhostVision AI detected {target['type']} near {harbour_name} with {confidence*100:.1f}% confidence.",
                        notes="Requires manual clearance."
                    )
                    db.add(anomaly)
                db.commit()

        print("Successfully seeded database for all Harbours!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
