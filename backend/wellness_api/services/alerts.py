from typing import Optional, Dict, Any
from wellness_api.services.storage import get_last_n_days

CALM_MESSAGES = {
    ("Low", "Medium"):  "A gentle note: your stress seems a little higher today. A few slow breaths may help.",
    ("Medium", "High"): "Just a calm reminder: stress looks higher today. Take things slowly and be kind to yourself.",
    ("Low", "High"):    "A gentle check-in: stress looks higher today. Try a short calming routine if you can.",
    ("High", "Medium"): "Your stress seems to be easing a bit. Small steps are enough for today.",
    ("Medium", "Low"):  "Good news—your stress looks lighter now. Keep following your gentle routine.",
    ("High", "Low"):    "Your body looks calmer now. Keep going gently, one step at a time."
}


def detect_stress_change(user_id: str, new_level: str) -> Optional[Dict[str, Any]]:
    """
    Compare current stress with the latest previous REAL stress level.
    Ignore Unknown-filled days.
    """
    if not new_level or new_level == "Unknown":
        return None

    hist = get_last_n_days(user_id, n=7)
    if not hist:
        return None

    # take previous real stress level before current/latest day
    prev_real = None

    # hist is oldest -> newest, current day is usually hist[-1]
    for row in reversed(hist[:-1]):
        level = row.get("stress_level")
        if level and level != "Unknown":
            prev_real = level
            break

    if not prev_real:
        return None

    if prev_real == new_level:
        return None

    msg = CALM_MESSAGES.get(
        (prev_real, new_level),
        "A gentle update: your stress level has changed. Take a slow breath and continue gently."
    )

    return {
        "from": prev_real,
        "to": new_level,
        "message": msg
    }
