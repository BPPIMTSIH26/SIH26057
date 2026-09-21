import os
from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "sonar_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600, # 1 hour max
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", 2)), # Bound concurrency
)

# Optional: Auto-discover tasks in specific modules
celery_app.autodiscover_tasks(["app.services"])

@celery_app.task(bind=True, max_retries=3)
def process_image_pipeline_task(self, job_id: str, file_path: str):
    """
    Durable Celery task to process an image pipeline asynchronously.
    """
    from app.services.image_processing_service import ImageProcessingService
    from app.database.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Call the actual service logic
        ImageProcessingService.process_job_sync(db, job_id, file_path)
    except Exception as exc:
        self.retry(exc=exc, countdown=60) # retry after 1 minute
    finally:
        db.close()
