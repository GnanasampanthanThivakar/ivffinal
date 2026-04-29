import os
from dotenv import load_dotenv

load_dotenv()

# backend/app
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def abs_from_app(rel: str | None) -> str | None:
    if not rel:
        return None
    rel = rel.strip().lstrip("./")
    return os.path.join(APP_DIR, rel.replace("/", os.sep))

# -------------------------
# LSTM
# -------------------------
LSTM_MODEL_PATH = abs_from_app(os.getenv("LSTM_MODEL_PATH"))
LSTM_SCALER_PATH = abs_from_app(os.getenv("LSTM_SCALER_PATH"))
LSTM_LABEL_MAP_PATH = abs_from_app(os.getenv("LSTM_LABEL_MAP_PATH"))
LSTM_META_PATH = abs_from_app(os.getenv("LSTM_META_PATH"))

# -------------------------
# ANFIS
# -------------------------
ANFIS_MODEL_PATH = abs_from_app(os.getenv("ANFIS_MODEL_PATH"))
ANFIS_SCALER_PATH = abs_from_app(os.getenv("ANFIS_SCALER_PATH"))
ANFIS_LABEL_MAP_PATH = abs_from_app(os.getenv("ANFIS_LABEL_MAP_PATH"))
ANFIS_META_PATH = abs_from_app(os.getenv("ANFIS_META_PATH"))

# -------------------------
# Stress XGBoost
# -------------------------
STRESS_XGB_MODEL_PATH = abs_from_app(os.getenv("STRESS_XGB_MODEL_PATH"))
STRESS_XGB_LABEL_MAP_PATH = abs_from_app(os.getenv("STRESS_XGB_LABEL_MAP_PATH"))
STRESS_XGB_META_PATH = abs_from_app(os.getenv("STRESS_XGB_META_PATH"))

# -------------------------
# Ensemble weights
# -------------------------
ENSEMBLE_W_LSTM = float(os.getenv("ENSEMBLE_W_LSTM", "0.6"))
ENSEMBLE_W_ANFIS = float(os.getenv("ENSEMBLE_W_ANFIS", "0.3"))
ENSEMBLE_W_XGB = float(os.getenv("ENSEMBLE_W_XGB", "0.1"))

# =========================================================
# Activity Recommender XGBoost
# =========================================================
ACTIVITY_XGB_MODEL_PATH = abs_from_app(
    os.getenv("ACTIVITY_XGB_MODEL_PATH", "models/ivf_activity_xgb_model_v1.json")
)
ACTIVITY_XGB_FEATURES_PATH = abs_from_app(
    os.getenv("ACTIVITY_XGB_FEATURES_PATH", "models/activity_feature_columns_v1.json")
)
ACTIVITY_XGB_LABEL_MAP_PATH = abs_from_app(
    os.getenv("ACTIVITY_XGB_LABEL_MAP_PATH", "models/activity_label_map_v1.json")
)
ACTIVITY_XGB_CATALOG_PATH = abs_from_app(
    os.getenv("ACTIVITY_XGB_CATALOG_PATH", "models/activity_catalog_v1.json")
)
ACTIVITY_XGB_META_PATH = abs_from_app(
    os.getenv("ACTIVITY_XGB_META_PATH", "models/activity_model_meta_v1.json")
)

# -------------------------
# Notify.lk SMS
# -------------------------
NOTIFY_SMS_ENABLED = os.getenv("NOTIFY_SMS_ENABLED", "false").strip().lower() == "true"
NOTIFY_SMS_USER_ID = os.getenv("NOTIFY_SMS_USER_ID", "").strip()
NOTIFY_SMS_API_KEY = os.getenv("NOTIFY_SMS_API_KEY", "").strip()
NOTIFY_SMS_SENDER_ID = os.getenv("NOTIFY_SMS_SENDER_ID", "").strip()
