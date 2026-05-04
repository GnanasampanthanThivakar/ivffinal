def detect_stress_change(previous_level: str | None, current_level: str):
    if not previous_level:
        return None

    previous = str(previous_level).strip().title()
    current = str(current_level).strip().title()

    if previous == current:
        return None

    prev = previous.lower()
    curr = current.lower()

    gentle_messages = {
        ("low", "medium"): "Your stress seems slightly higher today. Please take things gently and give yourself a short break.",
        ("medium", "high"): "Your stress appears to have increased. A calm breathing break or light rest may help.",
        ("low", "high"): "Your stress seems to have increased noticeably. Please slow down, hydrate, and rest for a few minutes.",
        ("high", "medium"): "Good sign — your stress looks a little better now. Keep following a calm routine.",
        ("medium", "low"): "Your stress looks improved today. Keep up your steady self-care routine.",
        ("high", "low"): "Your stress looks much better now. That is encouraging — continue your healthy routine."
    }

    message = gentle_messages.get(
        (prev, curr),
        f"Your stress level changed from {previous} to {current}."
    )

    return {
        "from": previous,
        "to": current,
        "message": message,
    }