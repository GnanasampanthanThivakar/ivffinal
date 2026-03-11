import joblib
import os

BASE_DIR = r"c:\Users\thiva\Desktop\integrate ivf\thiva"
RESEARCH_MODEL_PATH = os.path.join(BASE_DIR, "final_ultimate_ivf_ensemble.pkl")

try:
    obj = joblib.load(RESEARCH_MODEL_PATH)
    print(",".join(obj['features']))
except Exception as e:
    print(f"Error: {e}")
