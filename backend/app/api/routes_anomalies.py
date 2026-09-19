"""
Anomaly CRUD and review endpoints.
All data reads from and persists to the real database.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.database import get_db
from app.database.repositories import AnomalyRepository
from app.schemas.anomaly import AnomalyResponse, AnomalyUpdate

router = APIRouter()


@router.get("", response_model=List[AnomalyResponse])
def get_anomalies(
    mission_id: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Return anomalies from real database records.
    Supports filtering by mission_id, status, and risk_level.
    """
    repo = AnomalyRepository(db)
    return repo.get_all(mission_id=mission_id, status=status, risk_level=risk_level)


@router.get("/{anomaly_id}", response_model=AnomalyResponse)
def get_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    repo = AnomalyRepository(db)
    anomaly = repo.get(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return anomaly


@router.patch("/{anomaly_id}", response_model=AnomalyResponse)
def update_anomaly_review(anomaly_id: str, data: AnomalyUpdate, db: Session = Depends(get_db)):
    """
    Persist a human review decision to the database.
    Updates status, notes, custom class name, and review timestamp.
    This is the authoritative record — not a local-only UI update.
    """
    repo = AnomalyRepository(db)
    anomaly = repo.get(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    # Persist review decision
    anomaly.status = data.status
    if data.notes is not None:
        anomaly.notes = data.notes
    if hasattr(data, "custom_class_name") and data.custom_class_name:
        anomaly.final_classification = data.custom_class_name

    # Record review timestamp
    anomaly.updated_at = datetime.now(timezone.utc)

    return repo.update(anomaly)
