from typing import Optional, List, Union
from pydantic import BaseModel


class PredictResponse(BaseModel):
    currentStressLevel: str
    activitySuggested: Optional[str] = None
    alert: Optional[dict] = None

    unreadCount: Optional[int] = 0

    activityDescription: Optional[str] = None
    activityGoal: Optional[str] = None
    activityDurationMin: Optional[int] = None
    supportMessage: Optional[str] = None
    category: Optional[str] = None


class ActivityTop3Item(BaseModel):
    activitySuggested: str
    prob: float
    category: Optional[str] = None


class ActivityRecommendResponse(BaseModel):
    activitySuggested: str
    confidence: float
    activityDescription: Optional[str] = None
    activityGoal: Optional[str] = None
    activityDurationMin: Optional[int] = None
    supportMessage: Optional[str] = None
    category: Optional[str] = None
    top3: List[ActivityTop3Item] = []


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


class AlertItem(BaseModel):
    id: Union[str, int]
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
    status: str


class SmsTestResponse(BaseModel):
    status: str
    phone: Optional[str] = None
    phones: Optional[List[str]] = None
    details: Optional[str] = None
    metaResponse: Optional[dict] = None


class ActivityCatalogItem(BaseModel):
    id: str
    title: str
    description: str
    durationMin: int
    category: str
    createdAt: Optional[str] = None


class ActivitiesListResponse(BaseModel):
    activities: List[ActivityCatalogItem]


class ForgotPinResponse(BaseModel):
    status: str
    detail: str


class ResolveLoginIdResponse(BaseModel):
    status: str
    email: str


class EmailChangeOtpResponse(BaseModel):
    status: str
    detail: str
