from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.logging import setup_logging
import logging

from app.api import routes_health, routes_missions, routes_sonar, routes_detection, routes_anomalies, routes_pipeline, routes_reports, routes_upload, routes_auth, routes_image_processing, routes_dashboard
from app.database.database import engine, Base, SessionLocal
from app.database.seed import seed_users
from fastapi.staticfiles import StaticFiles
import os

setup_logging()
logger = logging.getLogger("sonar-x")

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting SONAR-X Backend (Env: {settings.APP_ENV})")
    logger.info(f"Using Model Provider: {settings.MODEL_PROVIDER}")

    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="SagarNetra API",
    description="SagarNetra Autonomous Undersea Anomaly & Mine Detection System",
    version="1.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_health.router, prefix="/api", tags=["Health"])
app.include_router(
    routes_missions.router,
    prefix="/api/missions",
    tags=["Missions"])
app.include_router(routes_sonar.router, prefix="/api/sonar", tags=["Sonar"])
app.include_router(
    routes_detection.router,
    prefix="/api/detection",
    tags=["Detection"])
app.include_router(
    routes_anomalies.router,
    prefix="/api/anomalies",
    tags=["Anomalies"])
app.include_router(
    routes_pipeline.router,
    prefix="/api/pipeline",
    tags=["Pipeline"])
app.include_router(
    routes_reports.router,
    prefix="/api/reports",
    tags=["Reports"])
app.include_router(routes_upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(routes_dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(routes_image_processing.router, prefix="/api/v1/image-processing", tags=["Image Processing"])


@app.get("/", tags=["Root"])
def root():
    return {
        "status": "online",
        "service": "SONAR-X / SagarNetra API",
        "docs_url": "http://localhost:8000/docs",
        "frontend_url": "http://localhost:5173"
    }

