import os
import boto3
from botocore.client import Config
from app.core.config import get_settings

settings = get_settings()

class S3Service:
    @staticmethod
    def get_client():
        if not settings.AWS_ENDPOINT_URL_S3:
            return None
            
        return boto3.client(
            's3',
            endpoint_url=settings.AWS_ENDPOINT_URL_S3,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(
                signature_version='s3v4',
                connect_timeout=1,
                read_timeout=2,
                retries={'max_attempts': 1}
            )
        )
        
    @staticmethod
    def upload_file(local_path: str, s3_key: str, content_type: str = "image/png") -> str:
        """
        Uploads a file to S3 and returns the public URL.
        If S3 is not configured, returns None.
        """
        client = S3Service.get_client()
        if not client or not settings.AWS_BUCKET_NAME:
            return None
            
        try:
            client.upload_file(
                local_path, 
                settings.AWS_BUCKET_NAME, 
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            # Neon uses path-style URLs
            return f"{settings.AWS_ENDPOINT_URL_S3}/{settings.AWS_BUCKET_NAME}/{s3_key}"
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            return None
