"""
Dashboard API endpoints.

All values are computed from actual database records.
No hardcoded metrics, fabricated ratios, or placeholder values.
Fields that cannot be computed from real records return null.
"""
import json
import os
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.database.models import Mission, Anomaly, Detection
from app.ml.model_manager import model_manager
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

# ---------------------------------------------------------------------------
# Model registry path
# ---------------------------------------------------------------------------
MODEL_REGISTRY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "models", "model_registry.json"
)

def _load_model_registry() -> Optional[dict]:
    """Load the model registry JSON if it exists."""
    if os.path.exists(MODEL_REGISTRY_PATH):
        try:
            with open(MODEL_REGISTRY_PATH) as f:
                return json.load(f)
        except Exception:
            pass
    return None


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
@router.get("/metrics")
def get_dashboard_metrics(
    port_id: Optional[str] = None,
    mission_id: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    Returns counts derived from real anomaly records in the database.
    Strictly scoped to port_id or mission_id when provided.
    'normalRegions' is not computable without area-coverage data — returned as null.
    """
    query = db.query(Anomaly)
    if port_id:
        query = query.outerjoin(Mission, Anomaly.mission_id == Mission.id).filter(
            (Anomaly.port_id == port_id) | (Mission.port_id == port_id)
        )
    elif mission_id:
        query = query.outerjoin(Mission, Anomaly.mission_id == Mission.id).filter(
            (Anomaly.mission_id == mission_id) | (Mission.mission_id == mission_id) | 
            (Anomaly.port_id == mission_id) | (Mission.port_id == mission_id)
        )

    total_anomalies = query.count()

    # New changes: anomalies in NEW status not yet reviewed
    new_changes = query.filter(Anomaly.status == "NEW").count()

    # Known types — covers both raw model class names (snake_case) and
    # human-readable forms stored by the ingestion pipeline ("Ghost Net", etc.)
    KNOWN_TYPE_FRAGMENTS = [
        "human",
        "ghost_net", "ghost net",
        "metal_debris", "metal debris", "debris",
        "crab",           # Crab-Pot, Maybe-Crab-Pot
    ]
    all_anomalies = query.all()
    known_anomalies = sum(
        1 for a in all_anomalies
        if a.type and any(frag in a.type.lower() for frag in KNOWN_TYPE_FRAGMENTS)
    )
    unknown_anomalies = total_anomalies - known_anomalies

    # normalRegions cannot be derived from detection counts alone;
    # it requires coverage-area data that is not available without sonar track metadata.
    return {
        "normalRegions": None,  # Not computable — no coverage-area data
        "knownAnomalies": known_anomalies,
        "unknownAnomalies": unknown_anomalies,
        "newChanges": new_changes,
        "totalAnomalies": total_anomalies,
        "dataSource": "real_database_records",
    }


# ---------------------------------------------------------------------------
# Model feedback / learning pipeline
# ---------------------------------------------------------------------------
@router.get("/model-feedback")
def get_model_feedback(db: Session = Depends(get_db)):
    """
    Returns model information from the model registry (real training metrics)
    and feedback sample counts from real reviewed anomaly records.
    Hardcoded or estimated accuracy values are not returned.
    """
    status = model_manager.get_status()
    registry = _load_model_registry()

    # Feedback samples = anomalies that have been reviewed by a human
    reviewed_statuses = ["VERIFIED", "FALSE_POSITIVE", "confirmed_unknown", "known_object", "false_positive"]
    feedback_samples = db.query(Anomaly).filter(
        Anomaly.status.in_(reviewed_statuses)
    ).count()

    # Build current model info from registry if available
    if registry:
        current_model = {
            "name": registry.get("model_name", status.get("model_name", "YOLO")),
            "accuracy": None,           # Use real metrics, not accuracy label
            "mAP50": registry.get("metrics", {}).get("mAP50"),
            "mAP50_95": registry.get("metrics", {}).get("mAP50_95"),
            "precision": registry.get("metrics", {}).get("precision"),
            "recall": registry.get("metrics", {}).get("recall"),
            "f1": registry.get("metrics", {}).get("f1"),
            "epochs": registry.get("training_config", {}).get("epochs"),
            "trainedAt": registry.get("trained_at"),
            "checkpointSha256": registry.get("checkpoint_sha256"),
            "datasetVersion": registry.get("dataset_version"),
            "note": registry.get("metrics_note", "Metrics from real validation set"),
        }
    else:
        current_model = {
            "name": status.get("model_name", "YOLO"),
            "accuracy": None,
            "mAP50": None,
            "precision": None,
            "recall": None,
            "note": "Model registry not found. Run scripts/train_model.py to generate it.",
        }

    return {
        "currentModel": current_model,
        "feedbackSamples": feedback_samples,
        "potentialRetrainingSet": feedback_samples,
        "nextModel": {
            "name": current_model["name"] + " (retrained)",
            "mAP50": None,         # Unknown until retrained
            "estimatedTime": None, # Cannot estimate without hardware specs
            "note": "Retrain using scripts/train_model.py after collecting sufficient feedback.",
        },
        "dataSource": "real_database_records_and_model_registry",
    }


# ---------------------------------------------------------------------------
# Model registry (raw)
# ---------------------------------------------------------------------------
@router.get("/model-registry")
def get_model_registry():
    """
    Returns the full model registry JSON if it exists.
    Contains: checkpoint path, SHA256, real training metrics, dataset version,
    split manifest, training config, trained_at timestamp.
    """
    registry = _load_model_registry()
    if not registry:
        return {
            "available": False,
            "message": (
                "Model registry not found. "
                "Train the model first: python3 backend/scripts/train_model.py"
            )
        }
    return {"available": True, **registry}


# ---------------------------------------------------------------------------
# Survey Trends — real anomaly counts aggregated by mission
# ---------------------------------------------------------------------------
@router.get("/trends")
def get_survey_trends(
    port_id: Optional[str] = None,
    mission_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns per-mission anomaly counts for the Survey Trends chart.
    Data points represent real missions with their real anomaly totals,
    filtered by port_id or mission_id when specified.
    """
    mission_query = db.query(Mission).order_by(Mission.created_at)
    if port_id:
        mission_query = mission_query.filter(
            (Mission.port_id == port_id) | (Mission.mission_id == port_id)
        )
    elif mission_id:
        mission_query = mission_query.filter(
            (Mission.mission_id == mission_id) | (Mission.port_id == mission_id)
        )

    missions = mission_query.all()
    if not missions:
        return {"dataPoints": [], "dataSource": "real_database_records"}

    data_points = []
    for mission in missions:
        count_query = db.query(Anomaly).filter(Anomaly.mission_id == mission.id)
        if port_id:
            count_query = count_query.filter(Anomaly.port_id == port_id)
        count = count_query.count()
        if count > 0:  # Only include missions with detected anomalies
            data_points.append({
                "date": mission.created_at.strftime("%b %d") if mission.created_at else mission.mission_id,
                "mission": mission.mission_id,
                "score": count,       # anomaly count used as trend score
                "label": mission.name or mission.mission_id,
            })

    return {
        "dataPoints": data_points,
        "totalMissions": len(missions),
        "totalAnomalies": sum(p["score"] for p in data_points),
        "dataSource": "real_database_records",
    }
