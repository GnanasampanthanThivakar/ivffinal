from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class PredictRequest(BaseModel):
    userId: str
    dateTimeISO: str
    HR_sensor: float
    Heart_Rate_Variability: float
    Sleep_Hours: float
    steps_sensor: float
    stressPercent: Optional[float] = None


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


class SmsTestRequest(BaseModel):
    userId: str
    message: Optional[str] = None
    phones: Optional[List[str]] = None


class ForgotPinRequest(BaseModel):
    loginId: str
    primaryPhone: str
    newPin: Optional[str] = None
    newPassword: Optional[str] = None


class ResolveLoginIdRequest(BaseModel):
    loginId: str


class SignupSendOtpRequest(BaseModel):
    phone: str


class SignupVerifyOtpRequest(BaseModel):
    phone: str
    otp: str


class EmailChangeRequestOtp(BaseModel):
    userId: str
    newEmail: str


class EmailChangeVerifyOtp(BaseModel):
    userId: str
    newEmail: str
    otp: str
