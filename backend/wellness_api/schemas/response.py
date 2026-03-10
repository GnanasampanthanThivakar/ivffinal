from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any


# -----------------------------------
# Predict
# -----------------------------------
class PredictResponse(BaseModel):
    currentStressLevel: str
    activitySuggested: str
    alert: Optional[Dict[str, Any]] = None

    # extra fields for UI
    unreadCount: int = 0
    activityDescription: Optional[str] = None
    activityGoal: Optional[str] = None
    activityDurationMin: Optional[int] = None
    supportMessage: Optional[str] = None
    category: Optional[str] = None


# -----------------------------------
# Activity recommendation
# -----------------------------------
class TopKActivity(BaseModel):
    activitySuggested: str
    prob: float


class ActivityRecommendResponse(BaseModel):
    activitySuggested: str
    confidence: float
    activityDescription: Optional[str] = None
    activityGoal: Optional[str] = None
    activityDurationMin: Optional[int] = None
    supportMessage: Optional[str] = None
    top3: List[TopKActivity] = []


# -----------------------------------
# Weekly report
# -----------------------------------
class DayPoint(BaseModel):
    dateISO: str
    HR: float
    HRV: float
    SleepHours: float
    Steps: float
    StressLevel: str


class WeeklyReportResponse(BaseModel):
    userId: str
    days: int
    points: List[DayPoint]


# -----------------------------------
# Alerts
# -----------------------------------
class AlertItem(BaseModel):
    id: int
    dateISO: str
    fromLevel: Optional[str] = None
    toLevel: Optional[str] = None
    message: str
    isRead: bool
    createdAt: str


class AlertsListResponse(BaseModel):
    userId: str
    unreadCount: int
    alerts: List[AlertItem]


class AlertsMarkReadResponse(BaseModel):
    status: Literal["ok"]


# -----------------------------------
# Activities list
# -----------------------------------
class ActivityCatalogItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    durationMin: int


class ActivitiesListResponse(BaseModel):
    activities: List[ActivityCatalogItem]
