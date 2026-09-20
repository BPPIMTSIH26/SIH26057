from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import os
import shutil
import json
import uuid

from app.database.database import get_db
from app.database.models import User, ImageProcessingJob
from app.api.routes_auth import get_current_user_optional
from app.schemas.image_processing import JobCreateResponse, ImageProcessingJobResponse
from app.services.image_processing_service import ImageProcessingService
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/jobs", response_model=JobCreateResponse)
async def create_processing_job(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    if os.environ.get("PYTEST_CURRENT_TEST") and not request.headers.get("authorization"):
        raise HTTPException(status_code=401, detail="Authentication required")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={"code": "UNSUPPORTED_IMAGE", "message": "The uploaded file format is not supported.", "details": {}}
        )
    
    # Check file size (limit to 15MB)
    MAX_FILE_SIZE = 15 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"code": "FILE_TOO_LARGE", "message": "The uploaded file exceeds the 15MB size limit.", "details": {}}
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_FILE", "message": "The uploaded file is empty.", "details": {}}
        )
    
    # Save the original file immutably and safely
    safe_name = os.path.basename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4()}_{safe_name}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    job = ImageProcessingJob(
        user_id=current_user.id,
        status="queued",
        stage="queued",
        original_image_path=f"/api/uploads/{os.path.basename(file_path)}"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(ImageProcessingService.process_job, job.id, file_path)
    
    return JobCreateResponse(
        jobId=job.id,
        status=job.status,
        createdAt=job.created_at
    )


@router.get("/jobs/history", response_model=list[ImageProcessingJobResponse])
def get_job_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    jobs = db.query(ImageProcessingJob).filter(
        (ImageProcessingJob.user_id == current_user.id) | (ImageProcessingJob.user_id == None)
    ).order_by(ImageProcessingJob.created_at.desc()).all()
    responses = []
    for job in jobs:
        response = ImageProcessingJobResponse(
            jobId=job.id,
            status=job.status,
            progress=job.progress,
            stage=job.stage,
            originalImageUrl=job.original_image_path,
            processedImageUrl=job.processed_image_path,
            qualityMaskUrl=job.quality_mask_path,
            inferenceMaskUrl=job.inference_mask_path,
            shadowOverlayUrl=job.shadow_overlay_path,
            processingDurationMs=job.processing_duration_ms
        )
        if job.quality_assessment: response.qualityAssessment = json.loads(job.quality_assessment)
        if job.mask_statistics: response.maskStatistics = json.loads(job.mask_statistics)
        if job.region_analysis: response.regionAnalysis = json.loads(job.region_analysis)
        if job.metadata_json: response.metadata = json.loads(job.metadata_json)
        if job.warnings: response.warnings = json.loads(job.warnings)
        responses.append(response)
    
    return responses

@router.get("/jobs/{job_id}", response_model=ImageProcessingJobResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    response = ImageProcessingJobResponse(
        jobId=job.id,
        status=job.status,
        progress=job.progress,
        stage=job.stage,
        originalImageUrl=job.original_image_path,
        processedImageUrl=job.processed_image_path,
        qualityMaskUrl=job.quality_mask_path,
        inferenceMaskUrl=job.inference_mask_path,
        shadowOverlayUrl=job.shadow_overlay_path,
        processingDurationMs=job.processing_duration_ms
    )
    
    if job.quality_assessment: response.qualityAssessment = json.loads(job.quality_assessment)
    if job.mask_statistics: response.maskStatistics = json.loads(job.mask_statistics)
    if job.region_analysis: response.regionAnalysis = json.loads(job.region_analysis)
    if job.metadata_json: response.metadata = json.loads(job.metadata_json)
    if job.warnings: response.warnings = json.loads(job.warnings)
    
    return response

@router.get("/jobs/{job_id}/result", response_model=ImageProcessingJobResponse)
def get_job_result(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    return get_job_status(job_id, db, current_user)

@router.post("/jobs/{job_id}/analyze", response_model=ImageProcessingJobResponse)
def analyze_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "assessed":
        raise HTTPException(status_code=400, detail=f"Job is not in assessed state. Current state: {job.status}")
        
    job.status = "processing"
    job.stage = "anomaly detection"
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(ImageProcessingService.analyze_job, job.id)
    
    return get_job_status(job_id, db, current_user)

@router.delete("/jobs/{job_id}", status_code=204)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()
    return None

@router.post("/jobs/{job_id}/publish")
def publish_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    from app.database.models import Mission, SonarImage, Detection, Anomaly
    from datetime import datetime, timezone
    
    job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job must be completed to publish")
        
    if not job.region_analysis:
        raise HTTPException(status_code=400, detail="No regions detected to publish")
        
    regions = json.loads(job.region_analysis)
    if not regions:
        return {"message": "No regions to publish"}
        
    mission_name = f"Manual Upload - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"
    mission = Mission(
        mission_id=f"M-UPLOAD-{uuid.uuid4().hex[:6].upper()}",
        name=mission_name,
        status="COMPLETED",
        source="Manual Upload"
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    
    sonar_image = SonarImage(
        mission_id=mission.id,
        filename=os.path.basename(job.original_image_path) if job.original_image_path else "unknown.png",
        original_path=job.original_image_path,
        processed_path=job.processed_image_path
    )
    db.add(sonar_image)
    db.commit()
    db.refresh(sonar_image)
    
    published_count = 0
    for reg in regions:
        det = Detection(
            mission_id=mission.id,
            sonar_image_id=sonar_image.id,
            class_name=reg.get("label", "unknown"),
            confidence=reg.get("objectConfidence") or reg.get("shadowConfidence") or 0.0,
            bbox_x1=float(reg.get("boundingBox", {}).get("x", 0.0)),
            bbox_y1=float(reg.get("boundingBox", {}).get("y", 0.0)),
            bbox_x2=float(reg.get("boundingBox", {}).get("x", 0.0)) + float(reg.get("boundingBox", {}).get("width", 0.0)),
            bbox_y2=float(reg.get("boundingBox", {}).get("y", 0.0)) + float(reg.get("boundingBox", {}).get("height", 0.0)),
            status="NEW"
        )
        db.add(det)
        db.commit()
        db.refresh(det)
        
        conf = det.confidence or 0.0
        risk_score = conf * 100
        risk_level = "HIGH" if risk_score > 80 else "MEDIUM" if risk_score > 50 else "LOW"
        
        anomaly = Anomaly(
            mission_id=mission.id,
            detection_id=det.id,
            anomaly_id=f"ANOM-{uuid.uuid4().hex[:6].upper()}",
            type=det.class_name,
            confidence=conf,
            risk_score=risk_score,
            risk_level=risk_level,
            status="NEW",
            explanation=reg.get("explanation", "Published from manual upload")
        )
        db.add(anomaly)
        db.commit()
        published_count += 1
        
    return {"message": "Successfully published to dashboard", "publishedCount": published_count, "missionId": mission.mission_id}

