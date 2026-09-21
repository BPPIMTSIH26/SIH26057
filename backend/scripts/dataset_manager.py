import os
import json
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import argparse

# Path resolution for imports
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database.models import Detection, SonarImage, Mission
from app.core.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def export_dataset(output_dir: str, name: str, min_confidence: float = 0.5):
    """
    Exports a verifiable dataset of sonar images and detections.
    Tracks provenance via SQLite/PostgreSQL relationships.
    """
    os.makedirs(output_dir, exist_ok=True)
    db = SessionLocal()
    
    export_id = f"DS-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    manifest = {
        "dataset_name": name,
        "export_id": export_id,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "min_confidence": min_confidence,
        "images": [],
        "taxonomy": ["ghost_net", "fishing_gear", "metal_debris", "unknown_man_made_object"]
    }
    
    # Get all high-confidence detections
    detections = db.query(Detection).filter(Detection.confidence >= min_confidence).all()
    
    images_map = {}
    for det in detections:
        img = db.query(SonarImage).filter(SonarImage.id == det.sonar_image_id).first()
        if not img:
            continue
            
        if img.id not in images_map:
            images_map[img.id] = {
                "id": img.id,
                "mission_id": img.mission_id,
                "processed_path": img.processed_path,
                "original_path": img.original_path,
                "detections": []
            }
            
        images_map[img.id]["detections"].append({
            "class_name": det.class_name,
            "confidence": det.confidence,
            "bbox": [det.bbox_x1, det.bbox_y1, det.bbox_x2, det.bbox_y2],
            "area": det.area
        })
        
    for img_id, data in images_map.items():
        manifest["images"].append(data)
        
    manifest_path = os.path.join(output_dir, f"{export_id}_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"Exported dataset {export_id} with {len(manifest['images'])} images and {len(detections)} detections.")
    print(f"Manifest saved to: {manifest_path}")

def main():
    parser = argparse.ArgumentParser(description="S.A.G.A.R Dataset Manager")
    parser.add_argument("--export", action="store_true", help="Export dataset")
    parser.add_argument("--output", type=str, default="./exports", help="Output directory")
    parser.add_argument("--name", type=str, default="export", help="Dataset name")
    parser.add_argument("--min_conf", type=float, default=0.5, help="Minimum confidence threshold")
    
    args = parser.parse_args()
    
    if args.export:
        export_dataset(args.output, args.name, args.min_conf)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
