import json
from app.database.database import SessionLocal
from app.database.models import Mission, Anomaly
import uuid

def map_port_name(port_name):
    mapping = {
        "Kolkata": "Kolkata Port",
        "Mumbai": "Mumbai Harbor Q3",
        "Kochi": "Kochi Harbor",
        "Visakhapatnam": "Visakhapatnam Port",
        "Jawaharlal Nehru": "Jawaharlal Nehru Port",
        "Parade": "Paradip Port",
        "Chennai": "Chennai Port",
        "Thunder Bay": "Thunder Bay, Lake Huron",
        "Lake Huron": "Lake Huron"
    }
    return mapping.get(port_name, port_name)

def seed():
    db = SessionLocal()
    
    # Wipe existing anomalies first to replace them with the new ocean-centered ones
    print("Deleting all existing anomalies...")
    db.query(Anomaly).delete()
    db.commit()
    print("Deleted.")
    
    with open('synthetic_data.json', 'r') as f:
        data = json.load(f)
        
    for survey in data.get('surveys', []):
        port_name = survey.get('port_name')
        mapped_name = map_port_name(port_name)
        
        # Create or find mission
        mission = db.query(Mission).filter(Mission.mission_id == mapped_name).first()
        if not mission:
            mission = Mission(
                mission_id=mapped_name,
                name=survey.get('survey_name'),
                status="COMPLETED",
                source=survey.get('vessel_platform'),
            )
            db.add(mission)
            db.commit()
            db.refresh(mission)
            
        # Add anomalies
        for anom in survey.get('anomalies', []):
            # Check if exists
            existing = db.query(Anomaly).filter(Anomaly.anomaly_id == anom['anomaly_id']).first()
            if existing:
                continue
            
            # Format explanation nicely
            explanation = f"**Evidence:** {anom.get('evidence', '')}\n"
            explanation += f"**Hazard:** {anom.get('possible_hazard', '')}\n"
            explanation += f"**Recommended Action:** {anom.get('recommended_action', '')}\n\n"
            explanation += f"**Depth:** {anom.get('depth_m', '')}m (Expected: {anom.get('expected_depth_m', '')}m)\n"
            explanation += f"**Backscatter:** {anom.get('backscatter_db', '')}dB (Expected: {anom.get('expected_backscatter_db', '')}dB)\n"
            
            dims = anom.get('dimensions_m', {})
            explanation += f"**Dimensions:** {dims.get('length', '?')}m x {dims.get('width', '?')}m x {dims.get('height_or relief', '?')}m"
            
            # Create anomaly
            anomaly_db = Anomaly(
                anomaly_id=anom['anomaly_id'],
                mission_id=mission.id,
                type=anom.get('anomaly_type'),
                confidence=anom.get('confidence_percent', 0) / 100.0,
                risk_score=float(anom.get('confidence_percent', 0)),
                risk_level=anom.get('severity', 'LOW'),
                latitude=anom.get('latitude'),
                longitude=anom.get('longitude'),
                depth=anom.get('depth_m'),
                status="NEW",
                explanation=explanation,
                location_source=survey.get('baseline_reference')
            )
            db.add(anomaly_db)
            
    db.commit()
    db.close()
    print("Seed complete.")

if __name__ == '__main__':
    seed()
