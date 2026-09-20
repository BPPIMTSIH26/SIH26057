import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app
from app.database.database import Base, get_db
from app.database.models import Mission, Anomaly, User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    test_anomaly_ids = ["VIZ-A01", "VIZ-A02", "CHE-A01", "CHE-A02", "KOL-A01"]
    test_mission_ids = ["Visakhapatnam Port", "Chennai Port", "Kolkata Port"]
    db.query(Anomaly).filter(Anomaly.anomaly_id.in_(test_anomaly_ids)).delete(synchronize_session=False)
    db.query(Mission).filter(Mission.mission_id.in_(test_mission_ids)).delete(synchronize_session=False)
    db.commit()

    # Create 3 realistic missions with distinct port_ids
    m_viz = Mission(
        id=str(uuid.uuid4()),
        mission_id="Visakhapatnam Port",
        port_id="visakhapatnam",
        name="Visakhapatnam Port Baseline Survey",
        status="COMPLETED"
    )
    m_che = Mission(
        id=str(uuid.uuid4()),
        mission_id="Chennai Port",
        port_id="chennai",
        name="Chennai Port Baseline Survey",
        status="COMPLETED"
    )
    m_kol = Mission(
        id=str(uuid.uuid4()),
        mission_id="Kolkata Port",
        port_id="kolkata",
        name="Kolkata Port Baseline Survey",
        status="COMPLETED"
    )
    db.add_all([m_viz, m_che, m_kol])
    db.commit()

    # Create distinct anomalies per port
    a_viz1 = Anomaly(
        id=str(uuid.uuid4()),
        anomaly_id="VIZ-A01",
        mission_id=m_viz.id,
        port_id="visakhapatnam",
        type="Metal debris",
        confidence=0.92,
        risk_score=92.0,
        risk_level="HIGH",
        status="NEW",
        latitude=17.689,
        longitude=83.2218,
        depth=18.5,
        explanation="Visakhapatnam metal debris detected."
    )
    a_viz2 = Anomaly(
        id=str(uuid.uuid4()),
        anomaly_id="VIZ-A02",
        mission_id=m_viz.id,
        port_id="visakhapatnam",
        type="Ghost net",
        confidence=0.88,
        risk_score=88.0,
        risk_level="MEDIUM",
        status="NEW",
        latitude=17.695,
        longitude=83.2300,
        depth=22.0,
        explanation="Visakhapatnam ghost net detected."
    )

    a_che1 = Anomaly(
        id=str(uuid.uuid4()),
        anomaly_id="CHE-A01",
        mission_id=m_che.id,
        port_id="chennai",
        type="Unexploded Ordnance",
        confidence=0.95,
        risk_score=95.0,
        risk_level="CRITICAL",
        status="NEW",
        latitude=13.085,
        longitude=80.2750,
        depth=14.2,
        explanation="Chennai UXO detected."
    )
    a_che2 = Anomaly(
        id=str(uuid.uuid4()),
        anomaly_id="CHE-A02",
        mission_id=m_che.id,
        port_id="chennai",
        type="Submerged pipeline leak",
        confidence=0.81,
        risk_score=81.0,
        risk_level="HIGH",
        status="VERIFIED",
        latitude=13.089,
        longitude=80.2810,
        depth=16.8,
        explanation="Chennai pipeline anomaly."
    )

    a_kol1 = Anomaly(
        id=str(uuid.uuid4()),
        anomaly_id="KOL-A01",
        mission_id=m_kol.id,
        port_id="kolkata",
        type="Siltation / shoal",
        confidence=0.79,
        risk_score=79.0,
        risk_level="LOW",
        status="NEW",
        latitude=22.531,
        longitude=88.3220,
        depth=9.5,
        explanation="Kolkata shoaling detected."
    )
    db.add_all([a_viz1, a_viz2, a_che1, a_che2, a_kol1])
    db.commit()
    db.close()
    yield


def test_get_anomalies_scoped_to_visakhapatnam():
    response = client.get("/api/anomalies?port_id=visakhapatnam")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    for item in data:
        assert item["port_id"] == "visakhapatnam"
        assert item["anomaly_id"].startswith("VIZ-")


def test_get_anomalies_scoped_to_chennai():
    response = client.get("/api/anomalies?port_id=chennai")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    for item in data:
        assert item["port_id"] == "chennai"
        assert item["anomaly_id"].startswith("CHE-")


def test_cross_port_isolation():
    # Chennai must NEVER leak into Visakhapatnam
    response_viz = client.get("/api/anomalies?port_id=visakhapatnam")
    data_viz = response_viz.json()
    ids_viz = {a["anomaly_id"] for a in data_viz}
    assert "CHE-A01" not in ids_viz
    assert "CHE-A02" not in ids_viz
    assert "KOL-A01" not in ids_viz

    # Visakhapatnam must NEVER leak into Chennai
    response_che = client.get("/api/anomalies?port_id=chennai")
    data_che = response_che.json()
    ids_che = {a["anomaly_id"] for a in data_che}
    assert "VIZ-A01" not in ids_che
    assert "VIZ-A02" not in ids_che
    assert "KOL-A01" not in ids_che


def test_invalid_port_returns_empty_not_global():
    response = client.get("/api/anomalies?port_id=nonexistent_port_123")
    assert response.status_code == 200
    data = response.json()
    assert data == []


def test_inspector_validation_rejects_mismatched_port():
    # VIZ-A01 belongs to visakhapatnam. Querying it with port_id=chennai must be rejected.
    response = client.get("/api/anomalies/VIZ-A01?port_id=chennai")
    assert response.status_code == 400
    assert "belongs to port 'visakhapatnam'" in response.json()["detail"]


def test_inspector_validation_accepts_matching_port():
    response = client.get("/api/anomalies/VIZ-A01?port_id=visakhapatnam")
    assert response.status_code == 200
    assert response.json()["anomaly_id"] == "VIZ-A01"
    assert response.json()["port_id"] == "visakhapatnam"


def test_dashboard_metrics_scoped_to_port():
    response_viz = client.get("/api/dashboard/metrics?port_id=visakhapatnam")
    assert response_viz.status_code == 200
    data_viz = response_viz.json()
    assert data_viz["totalAnomalies"] == 2
    assert data_viz["knownAnomalies"] == 2  # "metal debris" and "ghost net"
    assert data_viz["newChanges"] == 2

    response_kol = client.get("/api/dashboard/metrics?port_id=kolkata")
    assert response_kol.status_code == 200
    data_kol = response_kol.json()
    assert data_kol["totalAnomalies"] == 1

    # Empty port returns 0 counts, never global totals
    response_empty = client.get("/api/dashboard/metrics?port_id=empty_port")
    assert response_empty.status_code == 200
    data_empty = response_empty.json()
    assert data_empty["totalAnomalies"] == 0
    assert data_empty["knownAnomalies"] == 0
    assert data_empty["unknownAnomalies"] == 0


def test_dashboard_trends_scoped_to_port():
    response_viz = client.get("/api/dashboard/trends?port_id=visakhapatnam")
    assert response_viz.status_code == 200
    data_viz = response_viz.json()
    for point in data_viz["dataPoints"]:
        assert point["mission"] == "Visakhapatnam Port"
