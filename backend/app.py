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
BASE_DIR = r"c:\Users\thiva\Desktop\ivf app"
MODEL_PATH = os.path.join(BASE_DIR, "Best_Ensemble_Perfect.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler_perfect.pkl")

model = None
scaler = None

@app.on_event("startup")
def load_ml_assets():
    global model, scaler
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully!")
        
        scaler = joblib.load(SCALER_PATH)
        print("Scaler loaded successfully!")
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

@app.post("/api/predict/ivf")
def predict_ivf(data: IVFInput):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML Model or Scaler not loaded.")
    
    try:
        # Create a 2D numpy array with the 7 features
        input_array = np.array([[
            data.age,
            data.bmi,
            data.amh_level,
            data.prior_sab,
            data.d3_cell_count,
            data.d3_fragmentation,
            data.calculated_velocity
        ]])
        
        # Scale the input data using the loaded scaler
        scaled_input = scaler.transform(input_array)
        
        # Make the prediction using the scaled data
        prediction = model.predict(scaled_input)
        
        # If your model supports probability prediction for % success
        try:
            success_prob = model.predict_proba(scaled_input)[0][1] * 100
        except:
            success_prob = None
            
        return {
            "success": True,
            "prediction": int(prediction[0]),
            "success_probability_percentage": round(success_prob, 2) if success_prob else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def home():
    return {"message": "IVF Prediction Backend is Running! Model and Scaler are active (7 features)."}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
