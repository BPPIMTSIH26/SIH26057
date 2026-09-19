from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AnomalyResponse(BaseModel):
    id: str
    anomaly_id: str
    mission_id: str
    detection_id: str
    type: str
    confidence: float
    risk_score: float
    risk_level: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth: Optional[float] = None
    status: str
    explanation: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    location_source: Optional[str] = None
    model_version: Optional[str] = None
    dataset_version: Optional[str] = None
    sonar_image_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AnomalyUpdate(BaseModel):
    status: str                           # VERIFIED, FALSE_POSITIVE, confirmed_unknown, known_object, false_positive
    notes: Optional[str] = None
    custom_class_name: Optional[str] = None

