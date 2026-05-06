def predict_stress_ensemble(req):
    hr = float(getattr(req, "HR_sensor", 0) or 0)
    hrv = float(getattr(req, "Heart_Rate_Variability", 0) or 0)
    sleep = float(getattr(req, "Sleep_Hours", 0) or 0)
    steps = float(getattr(req, "steps_sensor", 0) or 0)

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
        label = "High"
    elif score <= 1:
        label = "Low"
    else:
        label = "Medium"

    return {
        "finalStressLabel": label,
        "modelUsed": "fallback_rule_based"
    }