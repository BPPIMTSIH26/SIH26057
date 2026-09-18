from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ReportResponse(BaseModel):
    id: str
    mission_id: str
    report_type: str
    file_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
