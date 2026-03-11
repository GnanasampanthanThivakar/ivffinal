import joblib
import os
import pandas as pd
import numpy as np

BASE_DIR = r"c:\Users\thiva\Desktop\integrate ivf\thiva"
RESEARCH_MODEL_PATH = os.path.join(BASE_DIR, "final_ultimate_ivf_ensemble.pkl")

try:
    obj = joblib.load(RESEARCH_MODEL_PATH)
    imputer = obj['imputer']
    features = obj['features']
    
    # Create dummy input data matching the keys in app.py
    input_data = {f: 1.0 for f in features}
    df_input = pd.DataFrame([input_data], columns=features)
    
    print("Attempting imputer.transform...")
    df_imputed = pd.DataFrame(imputer.transform(df_input), columns=features)
    print("Success!")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
