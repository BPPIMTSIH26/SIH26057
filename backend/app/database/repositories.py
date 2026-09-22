from sqlalchemy.orm import Session, joinedload
from app.database.models import Mission, SonarImage, Detection, Anomaly, Report
from typing import List, Optional

class MissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: str) -> Optional[Mission]:
        return self.db.query(Mission).filter(Mission.id == id).first()

    def get_by_mission_id(self, mission_id: str) -> Optional[Mission]:
        return self.db.query(Mission).filter(Mission.mission_id == mission_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Mission]:
        return self.db.query(Mission).offset(skip).limit(limit).all()

    def create(self, mission: Mission) -> Mission:
        self.db.add(mission)
        self.db.commit()
        self.db.refresh(mission)
        return mission

    def update(self, mission: Mission) -> Mission:
        self.db.commit()
        self.db.refresh(mission)
        return mission

class SonarImageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, image: SonarImage) -> SonarImage:
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image
    
    def get(self, id: str) -> Optional[SonarImage]:
        return self.db.query(SonarImage).filter(SonarImage.id == id).first()

    def update(self, image: SonarImage) -> SonarImage:
        self.db.commit()
        self.db.refresh(image)
        return image

class DetectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_bulk(self, detections: List[Detection]) -> List[Detection]:
        self.db.add_all(detections)
        self.db.commit()
        for d in detections:
            self.db.refresh(d)
        return detections

    def get_by_mission(self, mission_id: str) -> List[Detection]:
        return self.db.query(Detection).filter(Detection.mission_id == mission_id).all()

class AnomalyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_bulk(self, anomalies: List[Anomaly]) -> List[Anomaly]:
        self.db.add_all(anomalies)
        self.db.commit()
        for a in anomalies:
            self.db.refresh(a)
        return anomalies

    def get(self, id: str) -> Optional[Anomaly]:
        anomaly = self.db.query(Anomaly).options(joinedload(Anomaly.mission)).filter(
            (Anomaly.id == id) | (Anomaly.anomaly_id == id)
        ).first()
        if anomaly:
            if not getattr(anomaly, 'port_name', None) and anomaly.mission:
                anomaly.port_name = anomaly.mission.name or anomaly.mission.mission_id
            if not getattr(anomaly, 'sonar_image_path', None) and anomaly.detection and anomaly.detection.image:
                anomaly.sonar_image_path = anomaly.detection.image.processed_path or anomaly.detection.image.original_path
        return anomaly

    def get_all(
        self,
        port_id: Optional[str] = None,
        mission_id: Optional[str] = None,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        coordinate_status: Optional[str] = None,
        only_water_validated: bool = False,
        skip: int = 0,
        limit: int = 50
    ) -> List[Anomaly]:
        query = self.db.query(Anomaly).options(joinedload(Anomaly.mission))
        if port_id:
            # Strictly filter by port_id
            query = query.outerjoin(Mission, Anomaly.mission_id == Mission.id).filter(
                (Anomaly.port_id == port_id) | (Mission.port_id == port_id)
            )
        elif mission_id:
            query = query.outerjoin(Mission, Anomaly.mission_id == Mission.id).filter(
                (Anomaly.mission_id == mission_id) | (Mission.mission_id == mission_id) | (Anomaly.port_id == mission_id) | (Mission.port_id == mission_id)
            )
        if status:
            query = query.filter(Anomaly.status == status)
        if risk_level:
            query = query.filter(Anomaly.risk_level == risk_level)
        if only_water_validated:
            query = query.filter(Anomaly.coordinate_status == "VALIDATED_WATER")
        elif coordinate_status:
            query = query.filter(Anomaly.coordinate_status == coordinate_status)

        anomalies = query.order_by(Anomaly.created_at.desc()).offset(skip).limit(limit).all()
        for a in anomalies:
            if a.mission and not getattr(a, 'port_name', None):
                a.port_name = a.mission.name or a.mission.mission_id
            if not getattr(a, 'sonar_image_path', None) and a.detection and a.detection.image:
                a.sonar_image_path = a.detection.image.processed_path or a.detection.image.original_path
        return anomalies

    def update(self, anomaly: Anomaly) -> Anomaly:
        self.db.commit()
        self.db.refresh(anomaly)
        return anomaly

class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: Report) -> Report:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report
