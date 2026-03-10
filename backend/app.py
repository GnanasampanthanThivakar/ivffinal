from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import uvicorn
import os

app = FastAPI(title="IVF Prediction API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Wellness API as a sub-application
from wellness_api.main import app as wellness_app
app.mount("/wellness", wellness_app)

# Paths to the model and scaler
# Using relative paths from the backend folder for better portability, 
# or absolute paths if they are in the parent directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Original 7-feature model
MODEL_PATH = os.path.join(BASE_DIR, "Best_Ensemble_Perfect.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler_perfect.pkl")

# NEW 24-feature Research model
RESEARCH_MODEL_PATH = os.path.join(BASE_DIR, "final_ultimate_ivf_ensemble.pkl")

model = None
scaler = None
research_model_obj = None # Will hold {model, imputer, features}

@app.on_event("startup")
def load_ml_assets():
    global model, scaler, research_model_obj
    try:
        model = joblib.load(MODEL_PATH)
        print("Original Model loaded successfully!")
        scaler = joblib.load(SCALER_PATH)
        print("Original Scaler loaded successfully!")
        
        # Load the 24-feature Nutrition Research Ensemble
        research_model_obj = joblib.load(RESEARCH_MODEL_PATH)
        print("24-Feature Nutrition Research Model loaded successfully!")
    except Exception as e:
        print(f"Error loading ML assets: {e}")

# The model expects exactly 7 features.
class IVFInput(BaseModel):
    age: float
    bmi: float
    amh_level: float
    prior_sab: float
    d3_cell_count: float
    d3_fragmentation: float
    calculated_velocity: float

# --- NEW 24-FEATURE NUTRITION RESEARCH SCHEMA ---
class NutritionFullInput(BaseModel):
    age: float
    gender: float
    sbp: float
    dbp: float
    calories: float
    protein: float
    carbs: float
    fat: float
    vit_d: float
    vit_b12: float
    calories_d2: float
    protein_d2: float
    carbs_d2: float
    fat_d2: float
    folate_d2: float
    zinc_d2: float
    vit_d_d2: float
    vit_b12_d2: float
    sleep: float
    smoke: float
    chol: float
    folate_d1: float # For Mean Synthesis
    zinc_d1: float   # For Mean Synthesis
    bmi_cat: float

@app.post("/api/predict/ivf")
def predict_ivf(data: IVFInput):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Original Model or Scaler not loaded.")
    
    try:
        # Prepare data for prediction (7 features)
        input_data = np.array([[
            data.age, data.bmi, data.amh_level, data.prior_sab,
            data.d3_cell_count, data.d3_fragmentation, data.calculated_velocity
        ]])
        
        # Scale the data
        scaled_data = scaler.transform(input_data)
        
        # Predict probability
        # [0][1] gets probability of class 1 (success)
        prediction_prob = model.predict_proba(scaled_data)[0][1]
        
        return {
            "success": True,
            "prediction": round(float(prediction_prob * 100), 2),
            "success_probability_percentage": round(float(prediction_prob * 100), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/predict/nutrition_full")
def predict_nutrition_full(data: NutritionFullInput):
    if research_model_obj is None:
        raise HTTPException(status_code=500, detail="Research Model not loaded.")
    
    try:
        model_24 = research_model_obj['model']
        imputer = research_model_obj['imputer']
        features = research_model_obj['features']
        
        # 1. Map incoming JSON to the internal 24-feature format
        # Note: Mean calculation happens here in the backend for clean encapsulation
        folate_mean = (data.folate_d1 + data.folate_d2) / 2.0
        zinc_mean = (data.zinc_d1 + data.zinc_d2) / 2.0
        
        input_data = {
            'Age': data.age, 'Gender': data.gender, 
            'Systolic_Blood_Pressure': data.sbp, 'Diastolic_Blood_Pressure': data.dbp,
            'Diet_Calories_Kcal': data.calories, 'Diet_Protein_g': data.protein,
            'Diet_Carbs_g': data.carbs, 'Diet_Total_Fat_g': data.fat,
            'Dietary_VitD_mcg': data.vit_d, 'Dietary_VB12_mcg': data.vit_b12,
            'Diet_Calories_Day2': data.calories_d2, 'Diet_Protein_Day2': data.protein_d2,
            'Diet_Carbs_Day2': data.carbs_d2, 'Diet_Total_Fat_Day2_g': data.fat_d2,
            'Dietary_Folate_Day2': data.folate_d2, 'Dietary_Zinc_Day2': data.zinc_d2,
            'Dietary_VitD_Day2': data.vit_d_d2, 'Dietary_VB12_Day2': data.vit_b12_d2,
            'Sleep_Duration_Hours': data.sleep, 'Smoking_History_Status': data.smoke,
            'Cholesterol': data.chol, 'Mean_Zinc': zinc_mean,
            'Mean_Folate': folate_mean, 'BMI_Category': data.bmi_cat
        }
        
        df_input = pd.DataFrame([input_data], columns=features)
        df_imputed = pd.DataFrame(imputer.transform(df_input), columns=features)
        
        # 2. Baseline Prediction
        prob_baseline = float(model_24.predict_proba(df_imputed)[0][1] * 100)
        
        # 3. Simulation: +20% Folate/Zinc Intervention
        df_intervention = df_imputed.copy()
        df_intervention['Mean_Folate'] *= 1.20
        df_intervention['Mean_Zinc'] *= 1.20
        df_intervention['Dietary_Folate_Day2'] *= 1.20 # Mirroring the intervention across relevant columns
        df_intervention['Dietary_Zinc_Day2'] *= 1.20
        
        prob_optimized = float(model_24.predict_proba(df_intervention)[0][1] * 100)
        impact_score = prob_optimized - prob_baseline
        
        return {
            "success": True,
            "baseline_probability": round(prob_baseline, 2),
            "optimized_probability": round(prob_optimized, 2),
            "impact_score": round(impact_score, 2),
            "recommendation": "Increase Folate and Zinc by 20% to reach optimized probability."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def home():
    return {
        "message": "IVF Prediction Backend Active",
        "endpoints": ["/api/predict/ivf (7-feat)", "/api/predict/nutrition_full (24-feat)"]
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
