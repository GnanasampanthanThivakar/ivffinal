import json
import os
import threading
from pathlib import Path

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore

_db = None
_reused_logged = False
_init_lock = threading.Lock()


def get_firestore_db():
    global _db, _reused_logged

    # already initialized
    if _db is not None:
        if not _reused_logged:
            print("Firebase already connected. Reusing existing Firestore client.")
            _reused_logged = True
        return _db

    env_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if env_path:
        key_path = Path(env_path)
    else:
        key_path = Path(__file__).resolve().parent / "firebase_key.json"

    print(f"Checking Firebase key path: {key_path}")

    if not key_path.exists():
        raise FileNotFoundError(f"Firebase key file not found: {key_path}")

    expected_project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    try:
        key_payload = json.loads(key_path.read_text(encoding="utf-8"))
        key_project_id = str(key_payload.get("project_id", "")).strip()
    except Exception:
        key_payload = {}
        key_project_id = ""

    if expected_project_id and key_project_id and expected_project_id != key_project_id:
        print(
            "WARNING: Firebase service account project mismatch. "
            f"Expected '{expected_project_id}' but key belongs to '{key_project_id}'."
        )

    with _init_lock:
        if _db is not None:
            if not _reused_logged:
                print("Firebase already connected. Reusing existing Firestore client.")
                _reused_logged = True
            return _db

        if not firebase_admin._apps:
            cred = credentials.Certificate(str(key_path))
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully.")

        _db = firestore.client()
        print("Firebase connected successfully. Firestore client is ready.")
        _reused_logged = False

    return _db


def get_firebase_admin_auth():
    # Ensure the default app is initialized before using admin auth APIs.
    get_firestore_db()
    return firebase_auth
