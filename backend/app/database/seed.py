"""
Database seeding module.

SCOPE: This module seeds ONLY user accounts required for the system to operate.
It does NOT seed any missions, sonar images, detections, or anomalies.

All operational data (missions, detections, anomalies) must originate from:
  - Real uploaded sonar images processed by the actual deployed model
  - Real dataset images from AquaScan-1K ingested via scripts/ingest_dataset.py

Do NOT add fabricated, hardcoded, or placeholder detection/anomaly records here.
"""
import logging
import bcrypt
from sqlalchemy.orm import Session
from app.database.models import User

logger = logging.getLogger(__name__)


def seed_users(db: Session):
    """
    Seed required user accounts. Idempotent — safe to call on every startup.
    """
    def get_password_hash(password: str) -> str:
        pwd_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

    # Supreme Admin
    supreme = db.query(User).filter(User.email == "narayan.nkj@gmail.com").first()
    if not supreme:
        supreme = User(
            email="narayan.nkj@gmail.com",
            full_name="Narayan",
            hashed_password=get_password_hash("supreme123"),
            role="Supreme Admin",
            is_verified=1,
            is_approved=1,
        )
        db.add(supreme)
        db.commit()
        logger.info("Supreme Admin (narayan.nkj@gmail.com) created.")
    else:
        if supreme.role != "Supreme Admin":
            supreme.role = "Supreme Admin"
        supreme.is_verified = 1
        supreme.is_approved = 1
        db.commit()
        logger.info("Supreme Admin (narayan.nkj@gmail.com) verified.")

    # Baseline operator account
    op = db.query(User).filter(User.email == "operator04@sagar.gov.in").first()
    if not op:
        op = User(
            email="operator04@sagar.gov.in",
            full_name="Operator 04",
            hashed_password=get_password_hash("sagar123"),
            role="Operator",
            is_verified=1,
            is_approved=1,
        )
        db.add(op)
        db.commit()
        logger.info("Baseline operator (operator04@sagar.gov.in) created.")


if __name__ == "__main__":
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()
