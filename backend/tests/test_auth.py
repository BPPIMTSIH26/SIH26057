import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal, get_db
from app.database.models import User
from app.database.seed import seed_users

client = TestClient(app)

def get_test_db():
    if get_db in app.dependency_overrides:
        gen = app.dependency_overrides[get_db]()
        return next(gen)
    return SessionLocal()

@pytest.fixture(autouse=True)
def setup_db():
    db = get_test_db()
    seed_users(db)
    db.close()

def test_supreme_admin_exists_and_users_list():
    response = client.get("/api/auth/users")
    assert response.status_code == 200
    users = response.json()
    assert any(u["email"] == "narayan.nkj@gmail.com" and u["role"] == "System Administrator" for u in users)

def test_cannot_revoke_or_demote_supreme_admin():
    db = get_test_db()
    supreme = db.query(User).filter(User.email == "narayan.nkj@gmail.com").first()
    db.close()
    assert supreme is not None

    # Try revoke
    revoke_res = client.post(f"/api/auth/users/{supreme.id}/revoke")
    assert revoke_res.status_code == 400
    assert "Cannot revoke System Administrator" in revoke_res.json()["detail"]

    # Try demote
    role_res = client.post(f"/api/auth/users/{supreme.id}/role", json={"role": "Operator"})
    assert role_res.status_code == 400
    assert "Cannot demote System Administrator" in role_res.json()["detail"]

def test_user_registration_verification_and_approval_flow():
    test_email = "test.cadet@sagar.gov.in"
    
    # Clean up test user if already present
    db = get_test_db()
    db.query(User).filter(User.email == test_email).delete()
    db.commit()
    db.close()

    # 1. Signup
    signup_res = client.post("/api/auth/signup", json={
        "fullName": "Test Cadet",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert signup_res.status_code == 201

    # 2. Check that user cannot login before verification
    login_fail_1 = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_fail_1.status_code == 403
    assert "not verified" in login_fail_1.json()["detail"]

    # 3. Verify OTP
    db = get_test_db()
    cadet = db.query(User).filter(User.email == test_email).first()
    token = cadet.verification_token
    db.close()

    verify_res = client.post("/api/auth/verify", json={
        "email": test_email,
        "token": token
    })
    assert verify_res.status_code == 200

    # 4. Check that user cannot login before System Administrator approval
    login_fail_2 = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_fail_2.status_code == 403
    assert "pending" in login_fail_2.json()["detail"].lower()

    # 5. System Administrator approves and assigns role 'Senior Analyst'
    role_res = client.post(f"/api/auth/users/{cadet.id}/role", json={"role": "Senior Analyst"})
    assert role_res.status_code == 200

    approve_res = client.post(f"/api/auth/users/{cadet.id}/approve")
    assert approve_res.status_code == 200

    # 6. User can now login successfully
    login_success = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_success.status_code == 200
    data = login_success.json()
    assert data["user"]["role"] == "Senior Analyst"
    assert "access_token" in data

    # Clean up
    delete_res = client.delete(f"/api/auth/users/{cadet.id}")
    assert delete_res.status_code == 200

def test_auto_record_gmail_attempt_and_authorize_email():
    new_email = "applicant.test@gmail.com"

    # Clean up if exists
    db = get_test_db()
    db.query(User).filter(User.email == new_email).delete()
    db.commit()
    db.close()

    # Attempt login with un-registered Gmail -> auto-records!
    attempt_res = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "TempPassword123!"
    })
    assert attempt_res.status_code == 403
    assert "pending" in attempt_res.json()["detail"].lower()

    # Verify user was recorded in DB
    db = get_test_db()
    recorded = db.query(User).filter(User.email == new_email).first()
    db.close()
    assert recorded is not None
    assert recorded.is_approved == 0

    # System Administrator pre-authorizes or grants access
    auth_res = client.post("/api/auth/users/authorize-email", json={
        "email": new_email,
        "role": "Analyst"
    })
    assert auth_res.status_code == 200

    # User can now login with the password they provided!
    login_res = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "TempPassword123!"
    })
    assert login_res.status_code == 200

    # Clean up
    db = get_test_db()
    db.query(User).filter(User.email == new_email).delete()
    db.commit()
    db.close()

def test_lookup_operator():
    # System Administrator lookup
    res = client.get("/api/auth/lookup-operator?email=narayan.nkj@gmail.com")
    assert res.status_code == 200
    data = res.json()
    assert data["exists"] is True
    assert data["fullName"] == "Narayan"
    assert data["role"] == "System Administrator"

    # Non-existent lookup
    res2 = client.get("/api/auth/lookup-operator?email=unknown.operator.999@gmail.com")
    assert res2.status_code == 200
    assert res2.json()["exists"] is False

def test_security_headers_present():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

def test_lookup_operator_does_not_leak_otp_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")

    # Create unverified user
    db = get_test_db()
    unverified_email = "leak.test@sagar.gov.in"
    db.query(User).filter(User.email == unverified_email).delete()
    u = User(
        email=unverified_email,
        full_name="Leak Test",
        hashed_password="hashed_pw_test",
        is_verified=0,
        verification_token="999888"
    )
    db.add(u)
    db.commit()
    db.close()

    res = client.get(f"/api/auth/lookup-operator?email={unverified_email}")
    assert res.status_code == 200
    data = res.json()
    assert data["exists"] is True
    assert data["verificationToken"] is None

    # Clean up
    db = get_test_db()
    db.query(User).filter(User.email == unverified_email).delete()
    db.commit()
    db.close()

