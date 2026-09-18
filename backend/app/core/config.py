from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./data/sonar_x.db"
    
    # Directories
    UPLOAD_DIR: str = "./data/uploads"
    PROCESSED_DIR: str = "./data/processed"
    REPORT_DIR: str = "./data/reports"
    MODEL_DIR: str = "./models"
    
    # AI/Model Settings
    MODEL_PROVIDER: str = "demo"
    CONFIDENCE_THRESHOLD: float = 0.5
    
    # Security & Auth
    JWT_SECRET_KEY: str = "sagar-dev-secret-key-change-in-prod-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20

    # SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    
    # Security/CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

def get_settings() -> Settings:
    return Settings()

# Ensure directories exist
settings = get_settings()
for d in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORT_DIR, settings.MODEL_DIR]:
    os.makedirs(d, exist_ok=True)
