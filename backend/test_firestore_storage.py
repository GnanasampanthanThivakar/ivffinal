from firestore_storage import (
    upsert_daily_metric_fs,
    get_previous_stress_level_fs,
    insert_alert_fs,
    get_alerts_fs,
    get_unread_count_fs,
    mark_alerts_read_fs,
    get_last_n_days_fs,
)

user_id = "user_1"
date_iso = "2026-03-17"

try:
    print("1. Saving daily metric...")
    upsert_daily_metric_fs(
        user_id=user_id,
        date_iso=date_iso,
        hr=82,
        hrv=31,
        sleep_hours=6.5,
        steps=4200,
        stress_level="Medium",
        activity_suggested="Breathing Exercise",
        category="Mindfulness",
        support_message="Take a small calming step.",
    )
    print("Saved daily metric")

    print("2. Fetching previous stress...")
    prev = get_previous_stress_level_fs(user_id, date_iso)
    print("Previous stress:", prev)

    print("3. Inserting alert...")
    alert_id = insert_alert_fs(
        user_id=user_id,
        date_iso=date_iso,
        from_level="Low",
        to_level="Medium",
        message="Your stress has increased slightly today.",
    )
    print("Inserted alert:", alert_id)

    print("4. Unread count...")
    unread = get_unread_count_fs(user_id)
    print("Unread count:", unread)

    print("5. Alerts list...")
    alerts = get_alerts_fs(user_id, 10)
    print("Alerts:", alerts)

    print("6. Weekly data...")
    weekly = get_last_n_days_fs(user_id, 7)
    print("Weekly:", weekly)

    print("7. Marking alerts as read...")
    changed = mark_alerts_read_fs(user_id)
    print("Marked read:", changed)

    print("All Firestore storage tests passed!")

except Exception as e:
    print("Test failed:", e)