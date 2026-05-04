import json
from urllib import parse, request, error

from wellness_api.core.config import (
    NOTIFY_SMS_API_KEY,
    NOTIFY_SMS_ENABLED,
    NOTIFY_SMS_SENDER_ID,
    NOTIFY_SMS_USER_ID,
)


def notify_sms_ready() -> bool:
    return bool(
        NOTIFY_SMS_ENABLED
        and NOTIFY_SMS_USER_ID
        and NOTIFY_SMS_API_KEY
        and NOTIFY_SMS_SENDER_ID
    )


def normalize_sms_phone(value: str | None) -> str:
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    if not digits:
        return ""

    if digits.startswith("94") and len(digits) >= 11:
        return digits

    if digits.startswith("0") and len(digits) == 10:
        return f"94{digits[1:]}"

    if len(digits) == 9:
        return f"94{digits}"

    return digits


def send_notify_sms(phone: str, message: str) -> dict:
    if not notify_sms_ready():
        return {
            "sent": False,
            "reason": "Notify.lk SMS is not configured",
            "details": "",
        }

    normalized_phone = normalize_sms_phone(phone)
    if not normalized_phone:
        return {
            "sent": False,
            "reason": "Missing or invalid recipient phone",
            "details": "",
        }

    payload = parse.urlencode(
        {
            "user_id": NOTIFY_SMS_USER_ID,
            "api_key": NOTIFY_SMS_API_KEY,
            "sender_id": NOTIFY_SMS_SENDER_ID,
            "to": normalized_phone,
            "message": str(message or "").strip(),
        }
    ).encode("utf-8")

    req = request.Request(
        "https://app.notify.lk/api/v1/send",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            parsed = json.loads(raw) if raw else {}
            print("notify.lk sms send success:", parsed)
            return {
                "sent": True,
                "response": parsed,
                "phone": normalized_phone,
            }
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        print("notify.lk sms http error:", exc.code, body)
        return {
            "sent": False,
            "reason": f"http_{exc.code}",
            "details": body,
            "phone": normalized_phone,
        }
    except Exception as exc:
        print("notify.lk sms request failed:", str(exc))
        return {
            "sent": False,
            "reason": "request_failed",
            "details": str(exc),
            "phone": normalized_phone,
        }
