import os
import sys
import json
import random

# Ensure backend package root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.database import SessionLocal
from app.database.models import Mission, Detection, Anomaly
from auditing.seed_data import get_port_id_from_name
from utils.water_coordinates import get_random_water_coordinate, DEMO_SEEDS

def repair_coordinates(dry_run=False):
    db = SessionLocal()
    report = {
        'total_anomalies_inspected': 0,
        'total_anomalies_repaired': 0,
        'ports_affected': set(),
        'dry_run': dry_run
    }
    
    try:
        anomalies = db.query(Anomaly).all()
        for anomaly in anomalies:
            report['total_anomalies_inspected'] += 1
            mission = db.query(Mission).filter_by(id=anomaly.mission_id).first()
            if mission:
                port_id = get_port_id_from_name(mission.mission_id)
                # Ensure deterministic repair using the seed
                seed = DEMO_SEEDS.get(port_id, 17000) + report['total_anomalies_repaired']
                random.seed(seed)
                
                try:
                    lat, lng = get_random_water_coordinate(port_id, random)
                    
                    if anomaly.latitude != lat or anomaly.longitude != lng:
                        anomaly.latitude = lat
                        anomaly.longitude = lng
                        
                        # Repair parent detection as well
                        if anomaly.detection_id:
                            detection = db.query(Detection).filter_by(id=anomaly.detection_id).first()
                            if detection:
                                detection.latitude = lat
                                detection.longitude = lng
                                
                        report['total_anomalies_repaired'] += 1
                        report['ports_affected'].add(port_id)
                except ValueError as e:
                    print(f"Skipping repair for {mission.mission_id}: {e}")
                    
        if not dry_run:
            db.commit()
        else:
            db.rollback()
            print("[DRY RUN] Changes were rolled back.")
        
        # Write report
        report['ports_affected'] = list(report['ports_affected'])
        report_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'WATER_COORDINATE_REPAIR_REPORT.json')
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"Repair complete. Inspected: {report['total_anomalies_inspected']}, Repaired: {report['total_anomalies_repaired']}")
        print(f"Report saved to {report_path}")
        
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Do not commit changes to the database")
    args = parser.parse_args()
    repair_coordinates(dry_run=args.dry_run)
