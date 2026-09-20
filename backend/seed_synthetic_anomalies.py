import json
from app.database.database import SessionLocal
from app.database.models import Mission, Anomaly
import uuid

def map_port_name(port_name):
    mapping = {
        "Kolkata": ("kolkata", "Kolkata Port"),
        "Mumbai": ("mumbai", "Mumbai Harbor Q3"),
        "Kochi": ("kochi", "Kochi Harbor"),
        "Visakhapatnam": ("visakhapatnam", "Visakhapatnam Port"),
        "Jawaharlal Nehru": ("jawaharlal-nehru", "Jawaharlal Nehru Port"),
        "Parade": ("paradip", "Paradip Port"),
        "Chennai": ("chennai", "Chennai Port"),
        "Thunder Bay": ("thunder-bay", "Thunder Bay, Lake Huron"),
        "Lake Huron": ("lake-huron", "Lake Huron")
    }
    return mapping.get(port_name, (port_name.lower().replace(" ", "-"), port_name))

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
        port_id, mapped_name = map_port_name(port_name)
        
        # Create or find mission
        mission = db.query(Mission).filter((Mission.mission_id == mapped_name) | (Mission.port_id == port_id)).first()
        if not mission:
            mission = Mission(
                mission_id=mapped_name,
                port_id=port_id,
                name=survey.get('survey_name'),
                status="COMPLETED",
                source=survey.get('vessel_platform'),
            )
            db.add(mission)
            db.commit()
            db.refresh(mission)
        else:
            if not mission.port_id:
                mission.port_id = port_id
                db.commit()
            
        # Add anomalies
        for anom in survey.get('anomalies', []):
            # Check if exists
            existing = db.query(Anomaly).filter(Anomaly.anomaly_id == anom['anomaly_id']).first()
            if existing:
                if not existing.port_id:
                    existing.port_id = port_id
                    db.commit()
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
                port_id=port_id,
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
