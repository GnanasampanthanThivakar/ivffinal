from pydantic import BaseModel
from typing import Optional, Dict, Any


class PredictRequest(BaseModel):
    userId: str
    dateTimeISO: str
    HR_sensor: float
    Heart_Rate_Variability: float
    Sleep_Hours: float
    steps_sensor: float


class ActivityRecommendRequest(BaseModel):
    metrics: Optional[Dict[str, Any]] = None


class WeeklyReportRequest(BaseModel):
    userId: str
    days: int = 7


class AlertsListRequest(BaseModel):
    userId: str
    limit: int = 50


class AlertsMarkReadRequest(BaseModel):
    userId: str
