from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from wellness_api.schemas.request import (
    PredictRequest,
    ActivityRecommendRequest,
    WeeklyReportRequest,
    AlertsListRequest,
    AlertsMarkReadRequest,
)

from wellness_api.schemas.response import (
    PredictResponse,
    ActivityRecommendResponse,
    WeeklyReportResponse,
    DayPoint,
    AlertsListResponse,
    AlertItem,
    AlertsMarkReadResponse,
    ActivitiesListResponse,
    ActivityCatalogItem,
)

import json
import numpy as np
import pandas as pd
import xgboost as xgb

from wellness_api.core.config import (
    ACTIVITY_XGB_MODEL_PATH,
    ACTIVITY_XGB_FEATURES_PATH,
    ACTIVITY_XGB_LABEL_MAP_PATH,
    ACTIVITY_XGB_CATALOG_PATH,
)

from wellness_api.services.inference import predict_stress_ensemble

from wellness_api.services.storage import (
    init_db,
    upsert_day,
    get_last_n_days,
    insert_alert,
    get_alerts,
    get_unread_count,
    mark_alerts_read,
)
from wellness_api.services.alerts import detect_stress_change

app = FastAPI(title="IVF Stress + Activity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:8083",
        "http://localhost:8084",
        "http://localhost:8085",
        "http://localhost:8086",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
        "http://127.0.0.1:8083",
        "http://127.0.0.1:8084",
        "http://127.0.0.1:8085",
        "http://127.0.0.1:8086",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


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

    def _vectorize(self, metrics: dict) -> pd.DataFrame:
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

    def recommend(self, metrics: dict, topk: int = 3) -> dict:
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

    def list_catalog(self):
        out = []
        for k, v in (self.catalog or {}).items():
            out.append(
                {
                    "id": k,
                    "title": k,
                    "description": v.get("description") or "",
                    "durationMin": int(v.get("duration_min") or 10),
                    "category": infer_category_from_activity(k),
                }
            )
        out.sort(key=lambda x: (x["category"], x["title"]))
        return out


try:
    activity_recommender = ActivityRecommender()
except Exception as e:
    activity_recommender = None
    print("[WARN] ActivityRecommender init failed:", str(e))


def is_watch_offline(req: PredictRequest) -> bool:
    return (
        req.HR_sensor <= 0
        and req.Heart_Rate_Variability <= 0
        and req.Sleep_Hours <= 0
        and req.steps_sensor <= 0
    )


def stress_label_to_code(label: str) -> int:
    s = (label or "").strip().lower()
    if s == "low":
        return 0
    if s == "high":
        return 1
    if s == "medium":
        return 2
    return 0


@app.post("/predict", response_model=PredictResponse)
def predict_stress(req: PredictRequest):
    if is_watch_offline(req):
        return {
            "currentStressLevel": "Unknown",
            "activitySuggested": "Breathing Exercise",
            "activityDescription": "Try slow breathing for 5–10 minutes.",
            "activityGoal": "Reduce stress",
            "activityDurationMin": 10,
            "supportMessage": "Take it slowly. You’re doing fine.",
            "category": "Mindfulness",
            "unreadCount": get_unread_count(req.userId),
            "alert": None,
        }

    try:
        stress_out = predict_stress_ensemble(req)
        result_stress = str(stress_out.get("finalStressLabel", "Unknown"))
    except Exception as e:
        print("[ERROR] Stress inference failed:", str(e))
        result_stress = "Unknown"

    metrics = {
        "HR_sensor": req.HR_sensor,
        "Heart_Rate_Variability": req.Heart_Rate_Variability,
        "Sleep_Hours": req.Sleep_Hours,
        "steps_sensor": req.steps_sensor,
        "CurrentStressLevel": stress_label_to_code(result_stress),
    }

    if activity_recommender is not None:
        rec = activity_recommender.recommend(metrics, topk=3)
    else:
        rec = {
            "activitySuggested": "Breathing Exercise",
            "confidence": 0.0,
            "activityDescription": "Try 5–10 minutes of slow breathing to settle your nervous system.",
            "activityGoal": "Reduce stress",
            "activityDurationMin": 10,
            "supportMessage": "Take it slowly. You’re doing fine.",
            "category": "Mindfulness",
            "top3": [],
        }

    date_only = (req.dateTimeISO or "")[:10] if req.dateTimeISO else ""

    if date_only and result_stress != "Unknown":
        upsert_day(
            {
                "user_id": req.userId,
                "date_iso": date_only,
                "hr": req.HR_sensor,
                "hrv": req.Heart_Rate_Variability,
                "sleep": req.Sleep_Hours,
                "steps": req.steps_sensor,
                "stress_level": result_stress,
                "activity_suggested": rec.get("activitySuggested"),
                "confidence": rec.get("confidence"),
            }
        )

    alert = None
    if result_stress != "Unknown":
        alert = detect_stress_change(req.userId, result_stress)
        if alert and date_only:
            insert_alert(
                user_id=req.userId,
                date_iso=date_only,
                from_level=alert.get("from"),
                to_level=alert.get("to"),
                message=alert.get("message"),
            )

    unread = get_unread_count(req.userId)

    return {
        "currentStressLevel": result_stress,
        "activitySuggested": rec.get("activitySuggested"),
        "activityDescription": rec.get("activityDescription"),
        "activityGoal": rec.get("activityGoal"),
        "activityDurationMin": rec.get("activityDurationMin"),
        "supportMessage": rec.get("supportMessage"),
        "category": rec.get("category"),
        "unreadCount": unread,
        "alert": alert,
    }


@app.post("/activity/recommend", response_model=ActivityRecommendResponse)
def recommend_activity(req: ActivityRecommendRequest):
    if activity_recommender is None:
        raise HTTPException(
            status_code=500,
            detail="Activity recommender not initialized (missing artifacts?)",
        )

    if not req.metrics:
        return {
            "activitySuggested": "Breathing Exercise",
            "confidence": 0.0,
            "activityDescription": "Try 5–10 minutes of slow breathing to settle your nervous system.",
            "activityGoal": "Reduce stress",
            "activityDurationMin": 10,
            "supportMessage": "Take it slowly. You’re doing fine.",
            "category": "Mindfulness",
            "top3": [],
        }

    return activity_recommender.recommend(req.metrics, topk=3)


@app.get("/activities/list", response_model=ActivitiesListResponse)
def activities_list():
    if activity_recommender is None:
        return {"activities": []}

    items = []
    for row in activity_recommender.list_catalog():
        items.append(ActivityCatalogItem(**row))

    return {"activities": items}


@app.post("/weekly-report", response_model=WeeklyReportResponse)
def weekly_report(req: WeeklyReportRequest):
    rows = get_last_n_days(req.userId, n=req.days)

    points = []
    for r in rows:
        points.append(
            DayPoint(
                dateISO=r.get("date_iso"),
                HR=r.get("hr"),
                HRV=r.get("hrv"),
                SleepHours=r.get("sleep"),
                Steps=r.get("steps"),
                StressLevel=r.get("stress_level"),
            )
        )

    return {"userId": req.userId, "days": req.days, "points": points}


@app.post("/alerts/list", response_model=AlertsListResponse)
def alerts_list(req: AlertsListRequest):
    rows = get_alerts(req.userId, limit=req.limit)
    unread = get_unread_count(req.userId)

    items = []
    for r in rows:
        items.append(
            AlertItem(
                id=r["id"],
                dateISO=r["date_iso"],
                fromLevel=r.get("from_level"),
                toLevel=r.get("to_level"),
                message=r["message"],
                isRead=bool(r["is_read"]),
                createdAt=r["created_at"],
            )
        )

    return {"userId": req.userId, "unreadCount": unread, "alerts": items}


@app.post("/alerts/mark-read", response_model=AlertsMarkReadResponse)
def alerts_mark_read(req: AlertsMarkReadRequest):
    mark_alerts_read(req.userId)
    return {"status": "ok"}
