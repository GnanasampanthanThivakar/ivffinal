import random
import string
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore
from firebase_admin_client import get_firestore_db


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def save_signup_otp_fs(phone: str, otp: str, expires_minutes: int = 5):
    db = get_firestore_db()
    db.collection("signup_otps").document(phone).set({
        "otp": otp,
        "expiresAt": _now_utc() + timedelta(minutes=expires_minutes),
        "createdAt": firestore.SERVER_TIMESTAMP,
    })


def verify_signup_otp_fs(phone: str, otp: str) -> bool:
    db = get_firestore_db()
    doc = db.collection("signup_otps").document(phone).get()
    if not doc.exists:
        return False
    data = doc.to_dict()
    if data.get("otp") != otp:
        return False
    expires_at = data["expiresAt"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if _now_utc() > expires_at:
        return False
    db.collection("signup_otps").document(phone).delete()
    return True


def save_email_otp_fs(user_id: str, new_email: str, otp: str, expires_minutes: int = 5):
    db = get_firestore_db()
    db.collection("email_change_otps").document(user_id).set({
        "newEmail": new_email.strip().lower(),
        "otp": otp,
        "expiresAt": _now_utc() + timedelta(minutes=expires_minutes),
        "createdAt": firestore.SERVER_TIMESTAMP,
    })


def verify_email_otp_fs(user_id: str, new_email: str, otp: str) -> bool:
    db = get_firestore_db()
    doc = db.collection("email_change_otps").document(user_id).get()
    if not doc.exists:
        return False
    data = doc.to_dict()
    if data.get("otp") != otp:
        return False
    if data.get("newEmail") != new_email.strip().lower():
        return False
    expires_at = data["expiresAt"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if _now_utc() > expires_at:
        return False
    db.collection("email_change_otps").document(user_id).delete()
    return True


def generate_otp(length: int = 4) -> str:
    return "".join(random.choices(string.digits, k=length))


def upsert_daily_metric_fs(
    user_id: str,
    date_iso: str,
    hr: float,
    hrv: float,
    sleep_hours: float,
    steps: float,
    stress_level: str,
    stress_percent: int | None = None,
    activity_suggested: str | None = None,
    category: str | None = None,
    support_message: str | None = None,
):
    db = get_firestore_db()

    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("daily_metrics")
        .document(date_iso)
    )

    old_doc = doc_ref.get()
    old_created_at = None
    if old_doc.exists:
        old_created_at = (old_doc.to_dict() or {}).get("createdAt")

    doc_ref.set(
        {
            "dateISO": date_iso,
            "HR": float(hr or 0),
            "HRV": float(hrv or 0),
            "SleepHours": float(sleep_hours or 0),
            "Steps": float(steps or 0),
            "StressLevel": str(stress_level or "Unknown"),
            "stressPercent": int(stress_percent or 0),
            "activitySuggested": activity_suggested,
            "category": category,
            "supportMessage": support_message,
            "createdAt": old_created_at or firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )


def insert_vital_stream_fs(
    user_id: str,
    date_iso: str,
    hr: float,
    hrv: float,
    sleep_hours: float,
    steps: float,
    stress_level: str,
    stress_percent: int | None = None,
    activity_suggested: str | None = None,
    category: str | None = None,
    support_message: str | None = None,
):
    db = get_firestore_db()
    now = datetime.now()
    bucket_minute = (now.minute // 2) * 2
    bucket_id = f"{date_iso}T{now.hour:02d}:{bucket_minute:02d}"

    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("vital_stream")
        .document(bucket_id)
    )

    doc_ref.set(
        {
            "dateISO": date_iso,
            "bucketId": bucket_id,
            "HR": float(hr or 0),
            "HRV": float(hrv or 0),
            "SleepHours": float(sleep_hours or 0),
            "Steps": float(steps or 0),
            "StressLevel": str(stress_level or "Unknown"),
            "stressPercent": int(stress_percent or 0),
            "activitySuggested": activity_suggested,
            "category": category,
            "supportMessage": support_message,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    return doc_ref.id


def get_previous_stress_level_fs(user_id: str, date_iso: str) -> str | None:
    snapshot = get_previous_stress_snapshot_fs(user_id, date_iso)
    return snapshot.get("stressLevel")


def get_previous_stress_snapshot_fs(user_id: str, date_iso: str) -> dict:
    db = get_firestore_db()

    try:
        latest_stream_docs = (
            db.collection("users")
            .document(user_id)
            .collection("vital_stream")
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )

        for doc in latest_stream_docs:
            data = doc.to_dict() or {}
            stream_level = data.get("StressLevel")
            stream_percent = data.get("stressPercent")
            if stream_level or stream_percent is not None:
                return {
                    "stressLevel": stream_level,
                    "stressPercent": stream_percent,
                }
    except Exception:
        pass

    docs = (
        db.collection("users")
        .document(user_id)
        .collection("daily_metrics")
        .where("dateISO", "<", date_iso)
        .order_by("dateISO", direction=firestore.Query.DESCENDING)
        .limit(1)
        .stream()
    )

    for doc in docs:
        data = doc.to_dict() or {}
        return {
            "stressLevel": data.get("StressLevel"),
            "stressPercent": data.get("stressPercent"),
        }

    return {}


def insert_alert_fs(
    user_id: str,
    date_iso: str,
    from_level: str | None,
    to_level: str | None,
    message: str,
    alert_type: str = "awareness",
) -> str | None:
    db = get_firestore_db()

    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("alerts")
        .document()
    )

    doc_ref.set(
        {
            "dateISO": date_iso,
            "fromLevel": from_level,
            "toLevel": to_level,
            "message": message,
            "isRead": False,
            "type": alert_type,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )

    return doc_ref.id


def insert_activity_fs(
    user_id: str,
    date_iso: str,
    title: str,
    description: str | None = None,
    duration_min: int | None = None,
    category: str | None = None,
) -> str | None:
    db = get_firestore_db()

    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("activities")
        .document()
    )

    doc_ref.set(
        {
            "dateISO": date_iso,
            "title": str(title or "Wellness Activity"),
            "description": str(description or ""),
            "durationMin": int(duration_min or 10),
            "category": str(category or "Wellness"),
            "isRead": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )

    return doc_ref.id


def get_alerts_fs(user_id: str, limit_n: int = 50) -> list[dict]:
    db = get_firestore_db()

    try:
        docs = (
            db.collection("users")
            .document(user_id)
            .collection("alerts")
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .limit(limit_n)
            .stream()
        )
    except Exception:
        docs = (
            db.collection("users")
            .document(user_id)
            .collection("alerts")
            .limit(limit_n)
            .stream()
        )

    out = []
    for doc in docs:
        d = doc.to_dict() or {}
        created_at = d.get("createdAt")

        if created_at is None:
            created_at_str = ""
            created_at_sort = 0
        else:
            try:
                created_at_str = created_at.isoformat()
                created_at_sort = created_at.timestamp()
            except Exception:
                created_at_str = str(created_at)
                created_at_sort = 0

        out.append(
            {
                "id": str(doc.id),
                "dateISO": str(d.get("dateISO", "")),
                "fromLevel": d.get("fromLevel"),
                "toLevel": d.get("toLevel"),
                "message": str(d.get("message", "")),
                "isRead": bool(d.get("isRead", False)),
                "createdAt": created_at_str,
                "_createdAtSort": created_at_sort,
            }
        )

    out.sort(
        key=lambda x: (
            x.get("_createdAtSort", 0),
            x.get("dateISO", ""),
        ),
        reverse=True,
    )

    for item in out:
        item.pop("_createdAtSort", None)

    return out


def get_unread_count_fs(user_id: str) -> int:
    db = get_firestore_db()

    docs = (
        db.collection("users")
        .document(user_id)
        .collection("alerts")
        .where("isRead", "==", False)
        .stream()
    )

    return sum(1 for _ in docs)


def get_user_profile_fs(user_id: str) -> dict:
    db = get_firestore_db()
    doc_ref = db.collection("users").document(user_id).get()
    if not doc_ref.exists:
        return {}
    return doc_ref.to_dict() or {}


def get_user_profile_by_email_fs(email: str) -> dict:
    db = get_firestore_db()
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return {}

    docs = (
        db.collection("users")
        .where("email", "==", normalized_email)
        .limit(1)
        .stream()
    )

    for doc in docs:
        data = doc.to_dict() or {}
        data["uid"] = str(doc.id)
        return data

    return {}


def get_user_profile_by_username_fs(username: str) -> dict:
    db = get_firestore_db()
    raw_username = str(username or "").strip()
    normalized_username = raw_username.lower()
    if not raw_username:
        return {}

    query_candidates = [
        ("usernameLower", normalized_username),
        ("username", raw_username),
        ("username", normalized_username),
    ]

    for field_name, field_value in query_candidates:
        docs = (
            db.collection("users")
            .where(field_name, "==", field_value)
            .limit(1)
            .stream()
        )

        for doc in docs:
            data = doc.to_dict() or {}
            data["uid"] = str(doc.id)
            return data

    return {}


def mark_alerts_read_fs(user_id: str) -> int:
    db = get_firestore_db()

    docs = (
        db.collection("users")
        .document(user_id)
        .collection("alerts")
        .where("isRead", "==", False)
        .stream()
    )

    batch = db.batch()
    count = 0

    for doc in docs:
        batch.update(doc.reference, {"isRead": True})
        count += 1

    if count > 0:
        batch.commit()

    return count


def _get_latest_date_iso_for_user(user_id: str) -> str | None:
    db = get_firestore_db()

    docs = (
        db.collection("users")
        .document(user_id)
        .collection("daily_metrics")
        .order_by("dateISO", direction=firestore.Query.DESCENDING)
        .limit(1)
        .stream()
    )

    for doc in docs:
        d = doc.to_dict() or {}
        value = d.get("dateISO")
        if value:
            return str(value)

    return None


def get_last_n_days_fs(user_id: str, days: int = 7) -> list[dict]:
    db = get_firestore_db()

    docs = (
        db.collection("users")
        .document(user_id)
        .collection("daily_metrics")
        .order_by("dateISO", direction=firestore.Query.DESCENDING)
        .limit(days)
        .stream()
    )

    rows = {}
    for doc in docs:
        d = doc.to_dict() or {}
        key = d.get("dateISO")
        if not key:
            continue

        rows[key] = {
            "dateISO": key,
            "HR": float(d.get("HR", 0) or 0),
            "HRV": float(d.get("HRV", 0) or 0),
            "SleepHours": float(d.get("SleepHours", 0) or 0),
            "Steps": float(d.get("Steps", 0) or 0),
            "StressLevel": str(d.get("StressLevel", "Unknown")),
        }

    latest_date_iso = _get_latest_date_iso_for_user(user_id)

    if latest_date_iso:
        try:
            end_date = datetime.strptime(latest_date_iso, "%Y-%m-%d").date()
        except Exception:
            end_date = datetime.now().date()
    else:
        end_date = datetime.now().date()

    out = []
    for i in range(days - 1, -1, -1):
        dt = end_date - timedelta(days=i)
        key = dt.isoformat()

        out.append(
            rows.get(
                key,
                {
                    "dateISO": key,
                    "HR": 0.0,
                    "HRV": 0.0,
                    "SleepHours": 0.0,
                    "Steps": 0.0,
                    "StressLevel": "Unknown",
                },
            )
        )

    return out


def get_activity_history_fs(user_id: str, limit_n: int = 50) -> list[dict]:
    db = get_firestore_db()

    try:
        docs = (
            db.collection("users")
            .document(user_id)
            .collection("activities")
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .limit(limit_n)
            .stream()
        )
    except Exception:
        docs = (
            db.collection("users")
            .document(user_id)
            .collection("activities")
            .limit(limit_n)
            .stream()
        )

    out = []

    def append_activity_doc(doc):
        nonlocal out
        d = doc.to_dict() or {}
        activity = str(d.get("title") or d.get("activitySuggested") or "").strip()
        if not activity:
            return

        created_at = d.get("createdAt")
        if created_at is None:
            created_at_str = ""
            created_at_sort = 0
        else:
            try:
                created_at_str = created_at.isoformat()
                created_at_sort = created_at.timestamp()
            except Exception:
                created_at_str = str(created_at)
                created_at_sort = 0

        out.append(
            {
                "id": str(doc.id),
                "title": activity,
                "description": str(d.get("description") or d.get("supportMessage") or d.get("category") or ""),
                "durationMin": int(d.get("durationMin") or 10),
                "category": str(d.get("category") or "Wellness"),
                "createdAt": created_at_str,
                "_createdAtSort": created_at_sort,
            }
        )

    for doc in docs:
        append_activity_doc(doc)

    if not out:
        try:
            fallback_docs = (
                db.collection("users")
                .document(user_id)
                .collection("vital_stream")
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(limit_n)
                .stream()
            )
        except Exception:
            fallback_docs = (
                db.collection("users")
                .document(user_id)
                .collection("vital_stream")
                .limit(limit_n)
                .stream()
            )

        for doc in fallback_docs:
            append_activity_doc(doc)

    out.sort(key=lambda x: x.get("_createdAtSort", 0), reverse=True)

    deduped = []
    seen = set()
    for item in out:
        key = (
            item.get("title", ""),
            item.get("category", ""),
            item.get("createdAt", ""),
        )
        if key in seen:
            continue
        seen.add(key)
        item.pop("_createdAtSort", None)
        deduped.append(item)

    return deduped
