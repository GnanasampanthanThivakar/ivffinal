from firebase_admin_client import get_firestore_db

try:
    db = get_firestore_db()
    print("Firestore connected successfully!")
except Exception as e:
    print("Firestore connection failed:", e)