from fastapi import FastAPI, HTTPException
from google.api_core.exceptions import PermissionDenied, ResourceExhausted
from fastapi.middleware.cors import CORSMiddleware

import json
from datetime import datetime
from textwrap import shorten
import numpy as np
import pandas as pd
import xgboost as xgb

from wellness_api.schemas.request import (
    PredictRequest,
    ActivityRecommendRequest,
    WeeklyReportRequest,
    AlertsListRequest,
    AlertsMarkReadRequest,
    SmsTestRequest,
    ForgotPinRequest,
    ResolveLoginIdRequest,
    EmailChangeRequestOtp,
    EmailChangeVerifyOtp,
    SignupSendOtpRequest,
    SignupVerifyOtpRequest,
)

from wellness_api.schemas.response import (
    PredictResponse,
    ActivityRecommendResponse,
    WeeklyReportResponse,
    DayPoint,
    AlertsListResponse,
    AlertItem,
    AlertsMarkReadResponse,
    SmsTestResponse,
    ActivitiesListResponse,
    ActivityCatalogItem,
    ForgotPinResponse,
    ResolveLoginIdResponse,
    EmailChangeOtpResponse,
)

from wellness_api.core.config import (
    ACTIVITY_XGB_MODEL_PATH,
    ACTIVITY_XGB_FEATURES_PATH,
    ACTIVITY_XGB_LABEL_MAP_PATH,
    ACTIVITY_XGB_CATALOG_PATH,
)

from wellness_api.services.inference import predict_stress_ensemble
from firestore_storage import (
    upsert_daily_metric_fs,
    insert_vital_stream_fs,
    get_last_n_days_fs,
    get_activity_history_fs,
    get_previous_stress_level_fs,
    get_previous_stress_snapshot_fs,
    insert_alert_fs,
    insert_activity_fs,
    get_alerts_fs,
    get_unread_count_fs,
    mark_alerts_read_fs,
    get_user_profile_fs,
    get_user_profile_by_email_fs,
    get_user_profile_by_username_fs,
    save_email_otp_fs,
    verify_email_otp_fs,
    save_signup_otp_fs,
    verify_signup_otp_fs,
    generate_otp,
)
from wellness_api.services.notify_sms import send_notify_sms, normalize_sms_phone
from wellness_api.services.email_service import send_otp_email
from firebase_admin_client import get_firebase_admin_auth, get_firestore_db

app = FastAPI(title="IVF Stress + Activity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_stress_label(label):
    if label is None:
        return "Medium"

    if isinstance(label, (int, float)):
        if int(label) == 0:
            return "Low"
        if int(label) == 1:
            return "High"
        if int(label) == 2:
            return "Medium"

    s = str(label).strip().lower()

    if s in ["low", "0"]:
        return "Low"
    if s in ["high", "1"]:
        return "High"
    if s in ["medium", "moderate", "2"]:
        return "Medium"

    if s == "unknown":
        return "Unknown"

    return "Medium"


def stress_label_to_code(label: str):
    label = normalize_stress_label(label)
    if label == "Low":
        return 0
    if label == "High":
        return 1
    return 2


def stress_label_to_percent(label: str) -> int:
    label = normalize_stress_label(label)
    if label == "Low":
        return 20
    if label == "Medium":
        return 55
    if label == "High":
        return 85
    return 0


def normalize_stress_percent(value) -> int:
    try:
        percent = int(round(float(value)))
    except Exception:
        return 0
    return max(0, min(100, percent))


def stress_percent_to_label(value) -> str:
    percent = normalize_stress_percent(value)
    if percent < 35:
        return "Low"
    if percent < 70:
        return "Medium"
    return "High"


def fallback_stress_from_metrics(req: PredictRequest):
    hr = float(req.HR_sensor or 0)
    hrv = float(req.Heart_Rate_Variability or 0)
    sleep = float(req.Sleep_Hours or 0)
    steps = float(req.steps_sensor or 0)

    score = 0

    if hr > 95:
        score += 2
    elif hr > 85:
        score += 1

    if hrv < 20:
        score += 2
    elif hrv < 35:
        score += 1

    if sleep < 5:
        score += 2
    elif sleep < 6:
        score += 1

    if steps < 2500:
        score += 1

    if score >= 4:
        return "High"
    if score <= 1:
        return "Low"
    return "Medium"


def has_valid_predict_inputs(req: PredictRequest):
    return req.HR_sensor > 0 and req.Heart_Rate_Variability > 0


def infer_category_from_activity(activity_name: str) -> str:
    s = (activity_name or "").strip().lower()

    if any(x in s for x in ["breathing", "meditation", "music"]):
        return "Mindfulness"
    if any(x in s for x in ["walking", "walk", "stretch"]):
        return "Movement"
    if any(x in s for x in ["rest", "sleep"]):
        return "Sleep"
    if any(x in s for x in ["hydration", "water"]):
        return "Wellness"

    return "Wellness"


def detect_stress_change_message(prev_level: str | None, current_level: str) -> str | None:
    current_level = normalize_stress_label(current_level)
    prev_norm = normalize_stress_label(prev_level) if prev_level else None

    if prev_norm is None or prev_norm == "Unknown":
        return None

    if prev_norm == current_level:
        return None

    if prev_norm == "Low" and current_level == "Medium":
        return "Your stress has increased slightly today."
    if prev_norm == "Low" and current_level == "High":
        return "Your stress has increased significantly today."
    if prev_norm == "Medium" and current_level == "High":
        return "Your stress has moved into a high range today."
    if prev_norm == "High" and current_level == "Medium":
        return "Good sign — your stress looks a little lower today."
    if prev_norm == "High" and current_level == "Low":
        return "Great progress — your stress has reduced a lot today."
    if prev_norm == "Medium" and current_level == "Low":
        return "Good sign — your stress looks a little lower today."

    return None


def build_sms_alert_message(
    full_name: str | None,
    stress_percent: int,
    user_profile: dict | None = None,
) -> str:
    profile = user_profile or {}
    first_name = str(profile.get("firstName") or "").strip()
    last_name = str(profile.get("lastName") or "").strip()
    derived_name = " ".join(part for part in [first_name, last_name] if part).strip()
    patient_name = (full_name or derived_name or "The patient").strip() or "The patient"
    return (
        f"Momera Alert: {patient_name} is showing high stress "
        f"({normalize_stress_percent(stress_percent)}%). Please check on her and offer support."
    )


def get_guardian_sms_phones(user_profile: dict) -> list[str]:
    phones = []
    phone = str(user_profile.get("secondaryPhone") or "").strip()
    if phone:
        phones.append(phone)
    return phones


def normalize_email_value(value: str | None) -> str:
    return str(value or "").strip().lower()


def normalize_digits(value: str | None) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def is_strong_password(value: str) -> bool:
    password = str(value or "").strip()
    return (
        len(password) >= 8
        and any(ch.isupper() for ch in password)
        and any(ch.islower() for ch in password)
        and any(ch.isdigit() for ch in password)
        and any(not ch.isalnum() for ch in password)
    )


def build_firebase_password(email: str, pin: str) -> str:
    normalized_email = normalize_email_value(email)
    email_prefix = normalized_email.split("@")[0] or "momera"
    safe_pin = str(pin or "").strip()
    if is_strong_password(safe_pin):
        return safe_pin
    return f"Momera_{safe_pin}_{email_prefix}"


@app.post("/auth/resolve-login-id", response_model=ResolveLoginIdResponse)
@app.post("/wellness/auth/resolve-login-id", response_model=ResolveLoginIdResponse)
def auth_resolve_login_id(req: ResolveLoginIdRequest):
    login_id = str(req.loginId or "").strip()
    if not login_id:
        raise HTTPException(status_code=400, detail="Login ID is required")

    if "@" in login_id:
        normalized_email = normalize_email_value(login_id)
        return ResolveLoginIdResponse(status="ok", email=normalized_email)

    profile = get_user_profile_by_username_fs(login_id)
    email = normalize_email_value(profile.get("email"))
    if not email:
        raise HTTPException(status_code=404, detail="Username not found")

    return ResolveLoginIdResponse(status="ok", email=email)


def local_date_from_iso(value: str | None) -> str:
    if not value:
        return datetime.now().date().isoformat()

    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.date().isoformat()
    except Exception:
        try:
            return str(value).split("T")[0]
        except Exception:
            return datetime.now().date().isoformat()


class ActivityRecommender:
    def __init__(self):
        if not ACTIVITY_XGB_MODEL_PATH:
            raise RuntimeError("ACTIVITY_XGB_MODEL_PATH not set")

        self.model = xgb.Booster()
        self.model.load_model(str(ACTIVITY_XGB_MODEL_PATH))

        with open(ACTIVITY_XGB_FEATURES_PATH, "r", encoding="utf-8") as f:
            self.feature_columns = json.load(f)["feature_columns"]

        with open(ACTIVITY_XGB_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
            self.classes = json.load(f)["classes"]

        with open(ACTIVITY_XGB_CATALOG_PATH, "r", encoding="utf-8") as f:
            self.catalog = json.load(f)

    def _vectorize(self, metrics: dict):
        base = {
            "isWeekend": 0,
            "caffeineMg": 0,
            "hydrationLevel_0_10": 5,
            "moodScore_1_10": 5,
            "HR_sensor": float(metrics.get("HR_sensor", 0) or 0),
            "Heart_Rate_Variability": float(metrics.get("Heart_Rate_Variability", 0) or 0),
            "Sleep_Hours": float(metrics.get("Sleep_Hours", 0) or 0),
            "steps_sensor": float(metrics.get("steps_sensor", 0) or 0),
            "CurrentStressLevel": float(metrics.get("CurrentStressLevel", 0) or 0),
            "hour": 12,
            "month": 1,
            "day": 1,
            "SleepQualityLabel_Fair": 0,
            "SleepQualityLabel_Good": 1,
            "SleepQualityLabel_Poor": 0,
            "ActivityLevelLabel_Light": 1,
            "ActivityLevelLabel_Sedentary": 0,
            "ActivityLevelLabel_Very Active": 0,
            "pregnancyStage_Follow-up": 0,
            "pregnancyStage_Post-transfer": 0,
            "pregnancyStage_Stimulation": 0,
            "pregnancyStage_TTC/IVF Prep": 1,
            "timeOfDay_Evening": 0,
            "timeOfDay_Morning": 1,
            "timeOfDay_Night": 0,
        }

        row = []
        for c in self.feature_columns:
          v = metrics.get(c, base.get(c, 0))
          if isinstance(v, str):
              try:
                  v = float(v)
              except Exception:
                  v = 0
          row.append(v)

        X = pd.DataFrame([row], columns=self.feature_columns)
        X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
        return X

    def recommend(self, metrics: dict, topk: int = 3):
        X = self._vectorize(metrics)
        dmatrix = xgb.DMatrix(X)
        proba = self.model.predict(dmatrix)[0]
        idx = int(np.argmax(proba))

        activity = self.classes[idx]
        confidence = float(proba[idx])

        meta = self.catalog.get(activity, {}) or {}
        category = infer_category_from_activity(activity)

        top_idx = np.argsort(proba)[::-1][: max(1, topk)]
        top_items = []
        for i in top_idx:
            act = self.classes[i]
            top_items.append(
                {
                    "activitySuggested": act,
                    "prob": float(proba[i]),
                    "category": infer_category_from_activity(act),
                }
            )

        return {
            "activitySuggested": activity,
            "confidence": confidence,
            "activityDescription": meta.get("description"),
            "activityGoal": meta.get("goal"),
            "activityDurationMin": meta.get("duration_min"),
            "supportMessage": meta.get("support_message"),
            "category": category,
            "top3": top_items,
        }


try:
    activity_recommender = ActivityRecommender()
except Exception as e:
    activity_recommender = None
    print("[WARN] ActivityRecommender init failed:", str(e))


@app.post("/predict", response_model=PredictResponse)
@app.post("/wellness/predict", response_model=PredictResponse)
def predict_stress(req: PredictRequest):
    try:
        date_iso = local_date_from_iso(req.dateTimeISO)
        watch_stress_percent = normalize_stress_percent(req.stressPercent)
        print(
            "[predict] incoming",
            {
                "userId": req.userId,
                "dateISO": date_iso,
                "hr": req.HR_sensor,
                "hrv": req.Heart_Rate_Variability,
                "sleep": req.Sleep_Hours,
                "steps": req.steps_sensor,
                "watchStressPercent": watch_stress_percent,
            },
        )

        if not has_valid_predict_inputs(req):
            result_stress = fallback_stress_from_metrics(req)
        else:
            try:
                stress_out = predict_stress_ensemble(req)
                raw_label = stress_out.get("finalStressLabel")
                result_stress = normalize_stress_label(raw_label)
            except Exception:
                result_stress = fallback_stress_from_metrics(req)

        prev_level = None
        prev_watch_stress_percent = 0
        try:
            prev_snapshot = get_previous_stress_snapshot_fs(req.userId, date_iso)
            prev_level = prev_snapshot.get("stressLevel")
            prev_watch_stress_percent = normalize_stress_percent(prev_snapshot.get("stressPercent"))
        except Exception:
            prev_level = None
            prev_watch_stress_percent = 0

        alert_payload = None
        alert_msg = detect_stress_change_message(prev_level, result_stress)
        print(
            "[predict] classified",
            {
                "prevLevel": prev_level,
                "currentLevel": result_stress,
                "prevWatchStressPercent": prev_watch_stress_percent,
                "alertMsg": alert_msg,
            },
        )

        rec = {
            "activitySuggested": None,
            "confidence": 0.0,
            "activityDescription": None,
            "activityGoal": None,
            "activityDurationMin": None,
            "supportMessage": None,
            "category": None,
            "top3": [],
        }

        if alert_msg:
            metrics = {
                "HR_sensor": req.HR_sensor,
                "Heart_Rate_Variability": req.Heart_Rate_Variability,
                "Sleep_Hours": req.Sleep_Hours,
                "steps_sensor": req.steps_sensor,
                "CurrentStressLevel": stress_label_to_code(result_stress),
            }

            if activity_recommender is not None:
                try:
                    rec = activity_recommender.recommend(metrics, topk=3)
                except Exception:
                    rec = {
                        "activitySuggested": "Breathing Exercise",
                        "confidence": 0.0,
                        "activityDescription": "Take a few slow breaths and relax",
                        "activityGoal": "Reduce stress",
                        "activityDurationMin": 10,
                        "supportMessage": "Take it easy today",
                        "category": "Mindfulness",
                        "top3": [],
                    }
            else:
                rec = {
                    "activitySuggested": "Breathing Exercise",
                    "confidence": 0.0,
                    "activityDescription": "Take a few slow breaths and relax",
                    "activityGoal": "Reduce stress",
                    "activityDurationMin": 10,
                    "supportMessage": "Take it easy today",
                    "category": "Mindfulness",
                    "top3": [],
                }

        try:
            upsert_daily_metric_fs(
                user_id=req.userId,
                date_iso=date_iso,
                hr=float(req.HR_sensor or 0),
                hrv=float(req.Heart_Rate_Variability or 0),
                sleep_hours=float(req.Sleep_Hours or 0),
                steps=float(req.steps_sensor or 0),
                stress_level=result_stress,
                stress_percent=watch_stress_percent or stress_label_to_percent(result_stress),
                activity_suggested=rec.get("activitySuggested"),
                category=rec.get("category"),
                support_message=rec.get("supportMessage"),
            )
            print("[predict] daily metric saved")
        except Exception as e:
            print("daily save failed:", e)

        try:
            insert_vital_stream_fs(
                user_id=req.userId,
                date_iso=date_iso,
                hr=float(req.HR_sensor or 0),
                hrv=float(req.Heart_Rate_Variability or 0),
                sleep_hours=float(req.Sleep_Hours or 0),
                steps=float(req.steps_sensor or 0),
                stress_level=result_stress,
                stress_percent=watch_stress_percent or stress_label_to_percent(result_stress),
                activity_suggested=rec.get("activitySuggested"),
                category=rec.get("category"),
                support_message=rec.get("supportMessage"),
            )
            print("[predict] vital stream saved")
        except Exception as e:
            print("stream save failed:", e)

        try:
            if alert_msg:
                insert_alert_fs(
                    user_id=req.userId,
                    date_iso=date_iso,
                    from_level=prev_level,
                    to_level=result_stress,
                    message=alert_msg,
                )
                alert_payload = {
                    "from": normalize_stress_label(prev_level) if prev_level else None,
                    "to": result_stress,
                    "message": alert_msg,
                }
                if rec.get("activitySuggested"):
                    insert_activity_fs(
                        user_id=req.userId,
                        date_iso=date_iso,
                        title=rec.get("activitySuggested"),
                        description=rec.get("activityDescription") or rec.get("supportMessage"),
                        duration_min=rec.get("activityDurationMin"),
                        category=rec.get("category"),
                    )
                    print(
                        "[predict] alert + activity created",
                        {
                            "activity": rec.get("activitySuggested"),
                            "category": rec.get("category"),
                        },
                    )
                else:
                    print("[predict] alert created but no activity suggested")
            else:
                print("[predict] no alert/activity created because stress did not change")
        except Exception as e:
            print("alert generation failed:", e)

        try:
            user_profile = get_user_profile_fs(req.userId)
            sms_enabled = bool(user_profile.get("whatsappAlertsEnabled", True))
            sms_phones = get_guardian_sms_phones(user_profile)

            if sms_enabled and sms_phones and watch_stress_percent > 70:
                sms_message = build_sms_alert_message(
                    full_name=user_profile.get("fullName"),
                    stress_percent=watch_stress_percent,
                    user_profile=user_profile,
                )
                for phone in sms_phones:
                    sms_result = send_notify_sms(
                        phone=phone,
                        message=sms_message,
                    )
                    if not sms_result.get("sent"):
                        print("notify sms send skipped/failed:", sms_result)
                print("[predict] notify sms auto-send attempted", {"phones": sms_phones})
            else:
                print(
                    "[predict] notify sms skipped",
                    {
                        "enabled": sms_enabled,
                        "phones": sms_phones,
                        "watchStressPercent": watch_stress_percent,
                    },
                )
        except Exception as e:
            print("notify sms alert send failed:", e)

        unread_count = 0
        try:
            unread_count = get_unread_count_fs(req.userId)
        except Exception:
            unread_count = 0

        return {
            "currentStressLevel": result_stress,
            "activitySuggested": rec.get("activitySuggested"),
            "activityDescription": rec.get("activityDescription"),
            "activityGoal": rec.get("activityGoal"),
            "activityDurationMin": rec.get("activityDurationMin"),
            "supportMessage": rec.get("supportMessage"),
            "category": rec.get("category"),
            "unreadCount": unread_count,
            "alert": alert_payload,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/activity/recommend", response_model=ActivityRecommendResponse)
@app.post("/wellness/activity/recommend", response_model=ActivityRecommendResponse)
def recommend_activity(req: ActivityRecommendRequest):
    if activity_recommender is None:
        raise HTTPException(status_code=500, detail="Activity recommender not initialized")

    if not req.metrics:
        return {
            "activitySuggested": "Breathing Exercise",
            "confidence": 0.0,
            "activityDescription": "Try 5-10 minutes of slow breathing to settle your nervous system.",
            "activityGoal": "Reduce stress",
            "activityDurationMin": 10,
            "supportMessage": "Take it slowly. You are doing fine.",
            "category": "Mindfulness",
            "top3": [],
        }

    return activity_recommender.recommend(req.metrics, topk=3)


@app.post("/weekly-report", response_model=WeeklyReportResponse)
@app.post("/wellness/weekly-report", response_model=WeeklyReportResponse)
def weekly_report(req: WeeklyReportRequest):
    try:
        rows = get_last_n_days_fs(req.userId, days=req.days)
    except (PermissionDenied, ResourceExhausted) as e:
        print("weekly_report firestore unavailable:", e)
        rows = []

    points = []
    for r in rows:
        points.append(
            DayPoint(
                dateISO=r.get("dateISO"),
                HR=r.get("HR"),
                HRV=r.get("HRV"),
                SleepHours=r.get("SleepHours"),
                Steps=r.get("Steps"),
                StressLevel=r.get("StressLevel", "Unknown"),
            )
        )

    return {"userId": req.userId, "days": req.days, "points": points}


@app.post("/activities/list", response_model=ActivitiesListResponse)
@app.post("/wellness/activities/list", response_model=ActivitiesListResponse)
def activities_list(req: AlertsListRequest):
    try:
        rows = get_activity_history_fs(req.userId, limit_n=req.limit or 50)
    except (PermissionDenied, ResourceExhausted) as e:
        print("activities_list firestore unavailable:", e)
        rows = []

    items = []
    for r in rows:
        items.append(
            ActivityCatalogItem(
                id=r.get("id", ""),
                title=r.get("title", "Wellness Activity"),
                description=r.get("description") or "No description available.",
                durationMin=int(r.get("durationMin") or 10),
                category=r.get("category") or "Wellness",
                createdAt=r.get("createdAt"),
            )
        )

    return {"activities": items}


@app.post("/alerts/list", response_model=AlertsListResponse)
@app.post("/wellness/alerts/list", response_model=AlertsListResponse)
def alerts_list(req: AlertsListRequest):
    try:
        rows = get_alerts_fs(req.userId, limit_n=req.limit or 50)
        unread = get_unread_count_fs(req.userId)
    except (PermissionDenied, ResourceExhausted) as e:
        print("alerts_list firestore unavailable:", e)
        rows = []
        unread = 0

    items = []
    for r in rows:
        items.append(
            AlertItem(
                id=r["id"],
                dateISO=r["dateISO"],
                fromLevel=normalize_stress_label(r.get("fromLevel")) if r.get("fromLevel") else None,
                toLevel=normalize_stress_label(r.get("toLevel")) if r.get("toLevel") else None,
                message=r["message"],
                isRead=bool(r["isRead"]),
                createdAt=r["createdAt"],
            )
        )

    return {"userId": req.userId, "unreadCount": unread, "alerts": items}


@app.post("/alerts/mark-read", response_model=AlertsMarkReadResponse)
@app.post("/wellness/alerts/mark-read", response_model=AlertsMarkReadResponse)
def alerts_mark_read(req: AlertsMarkReadRequest):
    try:
        mark_alerts_read_fs(req.userId)
    except (PermissionDenied, ResourceExhausted) as e:
        print("alerts_mark_read firestore unavailable:", e)
    return {"status": "ok"}


@app.post("/alerts/test-sms", response_model=SmsTestResponse)
@app.post("/wellness/alerts/test-sms", response_model=SmsTestResponse)
@app.post("/alerts/test-whatsapp", response_model=SmsTestResponse)
@app.post("/wellness/alerts/test-whatsapp", response_model=SmsTestResponse)
def alerts_test_sms(req: SmsTestRequest):
    sms_phones = []
    user_profile = {}
    try:
        user_profile = get_user_profile_fs(req.userId)
    except (PermissionDenied, ResourceExhausted) as e:
        if not req.phones:
            raise HTTPException(status_code=503, detail=f"Firestore unavailable: {e}")
        user_profile = {}

    if req.phones:
        sms_phones = list(dict.fromkeys([str(phone).strip() for phone in req.phones if str(phone).strip()]))
    else:
        try:
            if not user_profile:
                user_profile = get_user_profile_fs(req.userId)
        except (PermissionDenied, ResourceExhausted) as e:
            raise HTTPException(status_code=503, detail=f"Firestore unavailable: {e}")

        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        sms_enabled = bool(user_profile.get("whatsappAlertsEnabled", True))
        if not sms_enabled:
            raise HTTPException(status_code=400, detail="SMS alerts are disabled for this user")

        sms_phones = get_guardian_sms_phones(user_profile)

    if not sms_phones:
        raise HTTPException(status_code=400, detail="No guardian phone numbers found for this user")

    result_items = []
    for phone in sms_phones:
        result = send_notify_sms(
            phone=phone,
            message=req.message
            or build_sms_alert_message(
                full_name=user_profile.get("fullName"),
                stress_percent=82,
                user_profile=user_profile,
            ),
        )
        result_items.append(result)

    failed = [item for item in result_items if not item.get("sent")]
    if failed:
        first_failed = failed[0]
        raise HTTPException(
            status_code=502,
            detail=f"SMS send failed: {first_failed.get('reason')} {first_failed.get('details', '')}".strip(),
        )

    return {
        "status": "sent",
        "phone": sms_phones[0],
        "phones": sms_phones,
        "details": f"SMS test message sent successfully to {len(sms_phones)} guardian number(s)",
        "metaResponse": {
            "results": [item.get("response") or {} for item in result_items],
        },
    }


@app.post("/auth/forgot-pin", response_model=ForgotPinResponse)
@app.post("/wellness/auth/forgot-pin", response_model=ForgotPinResponse)
def forgot_pin(req: ForgotPinRequest):
    login_id = str(req.loginId or "").strip()
    primary_phone = normalize_digits(req.primaryPhone)
    new_secret = str(req.newPassword or req.newPin or "").strip()

    if not login_id or not primary_phone or not new_secret:
        raise HTTPException(status_code=400, detail="Email or username, primary phone, and new password are required")

    if not is_strong_password(new_secret):
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters and include uppercase, lowercase, number, and symbol",
        )

    try:
        if "@" in login_id:
            profile = get_user_profile_by_email_fs(login_id)
        else:
            profile = get_user_profile_by_username_fs(login_id)
    except (PermissionDenied, ResourceExhausted) as e:
        raise HTTPException(status_code=503, detail=f"Firestore unavailable: {e}")

    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found for this email or username")

    saved_primary_phone = normalize_digits(profile.get("primaryPhone"))
    if saved_primary_phone != primary_phone:
        raise HTTPException(status_code=400, detail="Primary phone number does not match our records")

    uid = str(profile.get("uid") or "").strip()
    if not uid:
        raise HTTPException(status_code=500, detail="User UID missing in profile")

    email = normalize_email_value(profile.get("email"))
    if not email:
        raise HTTPException(status_code=500, detail="User email missing in profile")

    try:
        admin_auth = get_firebase_admin_auth()
        admin_auth.update_user(uid, password=build_firebase_password(email, new_secret))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset password: {e}")

    return {
        "status": "ok",
        "detail": "Password reset successfully. Please log in with your new password.",
    }


@app.post("/email-change/request", response_model=EmailChangeOtpResponse)
@app.post("/wellness/email-change/request", response_model=EmailChangeOtpResponse)
def email_change_request(req: EmailChangeRequestOtp):
    user_id = str(req.userId or "").strip()
    new_email = normalize_email_value(req.newEmail)

    if not user_id or not new_email:
        raise HTTPException(status_code=400, detail="userId and newEmail are required")

    try:
        admin_auth = get_firebase_admin_auth()
        admin_auth.get_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"User not found: {e}")

    otp = generate_otp(4)
    save_email_otp_fs(user_id, new_email, otp)

    sent = send_otp_email(new_email, otp)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Check SMTP configuration.")

    return {"status": "ok", "detail": f"OTP sent to {new_email}"}


@app.post("/email-change/verify", response_model=EmailChangeOtpResponse)
@app.post("/wellness/email-change/verify", response_model=EmailChangeOtpResponse)
def email_change_verify(req: EmailChangeVerifyOtp):
    user_id = str(req.userId or "").strip()
    new_email = normalize_email_value(req.newEmail)
    otp = str(req.otp or "").strip()

    if not user_id or not new_email or not otp:
        raise HTTPException(status_code=400, detail="userId, newEmail and otp are required")

    if not verify_email_otp_fs(user_id, new_email, otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    try:
        admin_auth = get_firebase_admin_auth()
        admin_auth.update_user(user_id, email=new_email, email_verified=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update email: {e}")

    try:
        db = get_firestore_db()
        db.collection("users").document(user_id).update({
            "email": new_email,
            "pendingEmail": "",
        })
    except Exception as e:
        print(f"[email-change] Firestore profile update failed: {e}")

    return {"status": "ok", "detail": "Email updated successfully"}


@app.post("/signup/send-otp")
@app.post("/wellness/signup/send-otp")
def signup_send_otp(req: SignupSendOtpRequest):
    phone = normalize_sms_phone(req.phone)
    if not phone:
        raise HTTPException(status_code=400, detail="Valid phone number required")

    otp = generate_otp(4)
    save_signup_otp_fs(phone, otp)

    result = send_notify_sms(phone, f"Your Momera signup code is: {otp}. Valid for 5 minutes.")
    if not result.get("sent"):
        raise HTTPException(status_code=500, detail=f"Failed to send OTP SMS: {result.get('reason', 'unknown')}")

    return {"status": "ok", "detail": f"OTP sent to {phone}"}


@app.post("/signup/verify-otp")
@app.post("/wellness/signup/verify-otp")
def signup_verify_otp(req: SignupVerifyOtpRequest):
    phone = normalize_sms_phone(req.phone)
    otp = str(req.otp or "").strip()

    if not phone or not otp:
        raise HTTPException(status_code=400, detail="phone and otp are required")

    if not verify_signup_otp_fs(phone, otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"status": "ok", "detail": "Phone verified"}

