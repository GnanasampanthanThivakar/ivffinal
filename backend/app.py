from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import joblib
import pandas as pd
import numpy as np
import uvicorn
import os
import sys
import httpx

# --- GLOBAL COMPATIBILITY PATCHES FOR SCIKIT-LEARN ---
try:
    from sklearn.impute import SimpleImputer, IterativeImputer
    # Patch for newer sklearn versions expecting these attributes on loaded objects
    for cls in [SimpleImputer, IterativeImputer]:
        if not hasattr(cls, 'sparse_output'):
            cls.sparse_output = False
        if not hasattr(cls, '_fill_dtype'):
            cls._fill_dtype = np.float64
        if not hasattr(cls, '_fit_dtype'):
            cls._fit_dtype = np.float64
    print("!!! SCIKIT-LEARN COMPATIBILITY PATCHES APPLIED !!!")
except Exception as e:
    print(f"!!! FAILED TO APPLY COMPATIBILITY PATCHES: {e} !!!")

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
        
        # Compatibility fix for SimpleImputer version mismatch
        # Instead of patching the object, we'll extract the statistics and use them manually if needed
        # but for now we try to re-initialize it correctly once more
        if 'imputer' in research_model_obj:
            from sklearn.impute import SimpleImputer
            old_imputer = research_model_obj['imputer']
            new_imputer = SimpleImputer(strategy=getattr(old_imputer, 'strategy', 'mean'))
            if hasattr(old_imputer, 'statistics_'):
                new_imputer.statistics_ = old_imputer.statistics_
                # Set these to avoid internal scikit-learn errors in newer versions
                new_imputer._fit_dtype = np.float64
                new_imputer.n_features_in_ = len(research_model_obj['features'])
                research_model_obj['imputer'] = new_imputer
                print("Applied ultra-robust compatibility fix: Re-initialized SimpleImputer")

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
        # Smart Fragmentation Mapping: Handles both Grade (0-4) and Percentage (5-100)
        frag_input = data.d3_fragmentation
        if frag_input <= 4:
            # If input is 4 or less, assume it's already a clinical grade (None, <10, 10-25, 25-50, >50)
            frag_grade = int(frag_input)
        else:
            # If input is >4, treat as Percentage and map to Grade
            if frag_input < 10:
                frag_grade = 1
            elif frag_input <= 25:
                frag_grade = 2
            elif frag_input <= 50:
                frag_grade = 3
            else:
                frag_grade = 4

        # Prepare data for prediction using exact feature names expected by the model
        input_data = {
            'Patient_Age': data.age,
            'Producer_BMI': data.bmi,
            'AMH': data.amh_level,
            'Prior_SAB': data.prior_sab,
            'Fresh_D3_Cnum': data.d3_cell_count,
            'Fresh_D3_Fr': frag_grade,
            'E2_Velocity': data.calculated_velocity
        }
        
        # Create DataFrame
        df_input = pd.DataFrame([input_data])
        
        # Align columns with scaler expectations
        if hasattr(scaler, 'feature_names_in_'):
            df_input = df_input[scaler.feature_names_in_]
        
        # Scale the data
        scaled_data = scaler.transform(df_input)
        
        # Predict probability
        # [0][1] gets probability of class 1 (success)
        prediction_prob = model.predict_proba(scaled_data)[0][1]
        
        # Determine clinical status
        status = "Success" if prediction_prob >= 0.5 else "Failure"
        
        return {
            "success": True,
            "status": status,
            "prediction": round(float(prediction_prob * 100), 2),
            "success_probability_percentage": round(float(prediction_prob * 100), 2),
            "failure_risk_percentage": round(float((1 - prediction_prob) * 100), 2)
        }
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# --- CLINICAL REFERENCE RANGES FOR SMART RECOMMENDATIONS ---
# These are evidence-based daily recommended values for reproductive health
CLINICAL_TARGETS = {
    'Mean_Folate': {'target': 400.0, 'unit': 'mcg', 'label': 'Folate', 'icon': '🥬',
                     'food_tip': 'Spinach, lentils, fortified cereals, asparagus'},
    'Mean_Zinc': {'target': 11.0, 'unit': 'mg', 'label': 'Zinc', 'icon': '🦪',
                   'food_tip': 'Oysters, beef, pumpkin seeds, chickpeas'},
    'Dietary_VitD_mcg': {'target': 15.0, 'unit': 'mcg', 'label': 'Vitamin D (Day 1)', 'icon': '☀️',
                          'food_tip': 'Salmon, fortified milk, egg yolks, mushrooms'},
    'Dietary_VitD_Day2': {'target': 15.0, 'unit': 'mcg', 'label': 'Vitamin D (Day 2)', 'icon': '☀️',
                           'food_tip': 'Salmon, fortified milk, egg yolks, mushrooms'},
    'Dietary_VB12_mcg': {'target': 4.0, 'unit': 'mcg', 'label': 'Vitamin B12 (Day 1)', 'icon': '🥩',
                          'food_tip': 'Meat, fish, dairy, fortified nutritional yeast'},
    'Dietary_VB12_Day2': {'target': 4.0, 'unit': 'mcg', 'label': 'Vitamin B12 (Day 2)', 'icon': '🥩',
                           'food_tip': 'Meat, fish, dairy, fortified nutritional yeast'},
    'Dietary_Folate_Day2': {'target': 400.0, 'unit': 'mcg', 'label': 'Folate (Day 2)', 'icon': '🥬',
                             'food_tip': 'Spinach, lentils, fortified cereals'},
    'Dietary_Zinc_Day2': {'target': 11.0, 'unit': 'mg', 'label': 'Zinc (Day 2)', 'icon': '🦪',
                           'food_tip': 'Oysters, beef, pumpkin seeds, chickpeas'},
    'Diet_Protein_g': {'target': 75.0, 'unit': 'g', 'label': 'Protein (Day 1)', 'icon': '🍗',
                        'food_tip': 'Chicken, fish, eggs, Greek yogurt, tofu'},
    'Diet_Protein_Day2': {'target': 75.0, 'unit': 'g', 'label': 'Protein (Day 2)', 'icon': '🍗',
                           'food_tip': 'Chicken, fish, eggs, Greek yogurt, tofu'},
    'Sleep_Duration_Hours': {'target': 8.0, 'unit': 'hrs', 'label': 'Sleep Duration', 'icon': '😴',
                              'food_tip': 'Aim for 7-9 hours of consistent sleep nightly'},
}

# Lifestyle factors where LOWER is better
LIFESTYLE_REDUCE_TARGETS = {
    'Cholesterol': {'target': 200.0, 'unit': 'mg/dL', 'label': 'Cholesterol', 'icon': '💉',
                     'food_tip': 'Reduce fried foods, increase fiber and omega-3'},
}

@app.post("/api/predict/nutrition_full")
def predict_nutrition_full(data: NutritionFullInput):
    if research_model_obj is None:
        raise HTTPException(status_code=500, detail="Research Model not loaded.")
    
    try:
        model_24 = research_model_obj['model']
        imputer = research_model_obj['imputer']
        features = research_model_obj['features']
        
        # 1. Map incoming JSON to the internal 24-feature format
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
        
        # Patch and impute
        imputer = research_model_obj['imputer']
        for attr in ['sparse_output', '_fill_dtype', '_fit_dtype']:
            if not hasattr(imputer, attr):
                setattr(imputer, attr, False if attr == 'sparse_output' else np.float64)
        
        try:
            df_imputed = pd.DataFrame(imputer.transform(df_input), columns=features)
        except Exception as e:
            print(f"Imputer fallback: {e}")
            df_imputed = df_input
            
        model_24 = research_model_obj['model']
        
        # Recursive patch for VotingClassifier estimators
        def patch_recursively(obj):
            if hasattr(obj, 'estimators_'):
                for est in obj.estimators_:
                    patch_recursively(est)
            if hasattr(obj, 'named_steps'):
                for name, step in obj.named_steps.items():
                    patch_recursively(step)
            if 'Imputer' in str(type(obj)):
                for attr in ['sparse_output', '_fill_dtype', '_fit_dtype']:
                    if not hasattr(obj, attr):
                        setattr(obj, attr, False if attr == 'sparse_output' else np.float64)

        patch_recursively(model_24)
        
        # 2. Baseline Prediction
        prob_baseline = float(model_24.predict_proba(df_imputed)[0][1] * 100)
        
        # 3. SMART RECOMMENDATION ENGINE
        # Test each modifiable nutrient individually
        recommendations = []
        
        # DEBUG: Log function start
        with open('bp_debug.log', 'a') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"FUNCTION START - Recommendation Engine\n")
            f.write(f"Input SBP: {df_imputed['Systolic_Blood_Pressure'].iloc[0]}, DBP: {df_imputed['Diastolic_Blood_Pressure'].iloc[0]}\n")
            f.write(f"{'='*60}\n")
        
        # --- Nutrients where HIGHER is better ---
        for col, info in CLINICAL_TARGETS.items():
            current_val = float(df_imputed[col].iloc[0])
            target_val = info['target']
            
            if current_val < target_val:
                # Calculate how much to boost to reach the target
                boost_ratio = target_val / current_val if current_val > 0 else 1.5
                boost_pct = round((boost_ratio - 1) * 100, 1)
                
                # Simulate the intervention
                df_sim = df_imputed.copy()
                df_sim[col] = target_val
                prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
                impact = prob_sim - prob_baseline
                
                if impact > 0.1:  # Only include if meaningful impact
                    recommendations.append({
                        "nutrient": info['label'],
                        "icon": info['icon'],
                        "current": round(current_val, 1),
                        "target": round(target_val, 1),
                        "unit": info['unit'],
                        "boost_percent": round(boost_pct, 1),
                        "impact": round(impact, 2),
                        "food_tip": info['food_tip'],
                        "status": "deficient"
                    })
        
        # --- Lifestyle factors where LOWER is better ---
        for col, info in LIFESTYLE_REDUCE_TARGETS.items():
            current_val = float(df_imputed[col].iloc[0])
            target_val = info['target']
            
            if current_val > target_val:
                reduce_pct = round(((current_val - target_val) / current_val) * 100, 1)
                
                df_sim = df_imputed.copy()
                df_sim[col] = target_val
                prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
                impact = prob_sim - prob_baseline
                
                if impact > 0.1:
                    recommendations.append({
                        "nutrient": info['label'],
                        "icon": info['icon'],
                        "current": round(current_val, 1),
                        "target": round(target_val, 1),
                        "unit": info['unit'],
                        "boost_percent": round(-reduce_pct, 1),
                        "impact": round(impact, 2),
                        "food_tip": info['food_tip'],
                        "status": "elevated"
                    })
        
        # --- BMI Category Analysis ---
        bmi_cat_value = float(df_imputed['BMI_Category'].iloc[0])
        
        if bmi_cat_value == 1:  # Underweight
            # Simulate moving to Normal BMI (category 2)
            df_sim = df_imputed.copy()
            df_sim['BMI_Category'] = 2.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            if abs(impact) > 0.1:
                recommendations.append({
                    "nutrient": "Body Mass Index",
                    "icon": "⚖️",
                    "current": 1,
                    "target": 2,
                    "unit": "category",
                    "boost_percent": 0,
                    "impact": round(impact, 2),
                    "food_tip": "Increase calorie intake with nutrient-dense foods: nuts, avocados, whole grains, lean proteins. Consider 3 meals + 2-3 healthy snacks daily.",
                    "status": "low"
                })
        
        elif bmi_cat_value == 3:  # Overweight
            # Simulate moving to Normal BMI (category 2)
            df_sim = df_imputed.copy()
            df_sim['BMI_Category'] = 2.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            if abs(impact) > 0.1:
                recommendations.append({
                    "nutrient": "Body Mass Index",
                    "icon": "⚖️",
                    "current": 3,
                    "target": 2,
                    "unit": "category",
                    "boost_percent": 0,
                    "impact": round(impact, 2),
                    "food_tip": "Reduce portion sizes, increase vegetables, prioritize lean proteins, limit processed foods. Regular exercise (30 min/day) can help.",
                    "status": "high"
                })
        
        elif bmi_cat_value == 4:  # Obese
            # Simulate moving to Normal BMI (category 2)
            df_sim = df_imputed.copy()
            df_sim['BMI_Category'] = 2.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            if abs(impact) > 0.1:
                recommendations.append({
                    "nutrient": "Body Mass Index",
                    "icon": "⚖️",
                    "current": 4,
                    "target": 2,
                    "unit": "category",
                    "boost_percent": 0,
                    "impact": round(impact, 2),
                    "food_tip": "Consult a nutritionist for personalized weight loss plan. Focus on whole foods, portion control, and consistent physical activity. Even 5-10% weight loss can improve fertility.",
                    "status": "high"
                })
        
        # BMI Category 2 (Normal) - no recommendation needed, it's optimal
        
        # Debug log file
        with open('bp_debug.log', 'a') as f:
            f.write(f"\n==================== BLOOD PRESSURE CHECK ====================\n")
            f.write(f"Total recommendations before BP check: {len(recommendations)}\n")
        
        # --- Blood Pressure Analysis ---
        systolic_bp = float(df_imputed['Systolic_Blood_Pressure'].iloc[0])
        diastolic_bp = float(df_imputed['Diastolic_Blood_Pressure'].iloc[0])
        
        with open('bp_debug.log', 'a') as f:
            f.write(f"DEBUG: Checking Blood Pressure - Systolic: {systolic_bp}, Diastolic: {diastolic_bp}\n")
            f.write(f"DEBUG: Condition check - systolic_bp >= 140: {systolic_bp >= 140}, diastolic_bp >= 90: {diastolic_bp >= 90}\n")
        
        # Blood Pressure Categories (AHA Guidelines):
        # Normal: < 120/80
        # Elevated: 120-129/<80
        # Hypertension Stage 1: 130-139/80-89
        # Hypertension Stage 2: >=140/>=90
        # Hypotension: <90/<60
        
        # Check for HIGH Blood Pressure
        if systolic_bp >= 140 or diastolic_bp >= 90:
            print(f"DEBUG: HIGH BP detected - Adding recommendation")
            # Stage 2 Hypertension - Urgent
            df_sim = df_imputed.copy()
            df_sim['Systolic_Blood_Pressure'] = 118.0
            df_sim['Diastolic_Blood_Pressure'] = 76.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            bp_rec = {
                "nutrient": "Blood Pressure",
                "icon": "BP",
                "current": f"{int(systolic_bp)}/{int(diastolic_bp)}",
                "target": "118/76",
                "unit": "mmHg",
                "boost_percent": 0,
                "impact": abs(round(impact, 2)) if abs(impact) > 0.05 else 0.5,
                "food_tip": "URGENT: Consult your doctor immediately. Reduce sodium (<1500mg/day), avoid caffeine, practice deep breathing, take prescribed medication. Monitor daily.",
                "status": "high"
            }
            with open('bp_debug.log', 'a') as f:
                f.write(f"DEBUG: BP Rec created: {bp_rec}\n")
            recommendations.append(bp_rec)
            with open('bp_debug.log', 'a') as f:
                f.write(f"DEBUG: Total recommendations after adding BP: {len(recommendations)}\n")
                f.write(f"==================== BP ADDED ====================\n\n")
        
        elif systolic_bp >= 130 or diastolic_bp >= 80:
            # Stage 1 Hypertension or Elevated
            df_sim = df_imputed.copy()
            df_sim['Systolic_Blood_Pressure'] = 118.0
            df_sim['Diastolic_Blood_Pressure'] = 76.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            recommendations.append({
                "nutrient": "Blood Pressure",
                "icon": "BP",
                "current": f"{int(systolic_bp)}/{int(diastolic_bp)}",
                "target": "118/76",
                "unit": "mmHg",
                "boost_percent": 0,
                "impact": abs(round(impact, 2)) if abs(impact) > 0.05 else 0.3,
                "food_tip": "Moderately elevated. See doctor for evaluation. Reduce salt, increase potassium (bananas, spinach), exercise 30 min/day, manage stress, limit alcohol.",
                "status": "elevated"
            })
        
        # Check for LOW Blood Pressure (Hypotension)
        elif systolic_bp < 90 or diastolic_bp < 60:
            df_sim = df_imputed.copy()
            df_sim['Systolic_Blood_Pressure'] = 118.0
            df_sim['Diastolic_Blood_Pressure'] = 76.0
            prob_sim = float(model_24.predict_proba(df_sim)[0][1] * 100)
            impact = prob_sim - prob_baseline
            
            recommendations.append({
                "nutrient": "Blood Pressure",
                "icon": "BP",
                "current": f"{int(systolic_bp)}/{int(diastolic_bp)}",
                "target": "118/76",
                "unit": "mmHg",
                "boost_percent": 0,
                "impact": abs(round(impact, 2)) if abs(impact) > 0.05 else 0.4,
                "food_tip": "Low blood pressure detected. Consult doctor if experiencing dizziness. Increase fluid intake, eat small frequent meals, add more salt if advised, wear compression stockings.",
                "status": "low"
            })
        
        # Sort by impact (highest first)
        recommendations.sort(key=lambda x: x['impact'], reverse=True)
        
        with open('bp_debug.log', 'a') as f:
            f.write(f"\n==================== AFTER SORTING ====================\n")
            f.write(f"Total recommendations: {len(recommendations)}\n")
            for i, rec in enumerate(recommendations):
                f.write(f"{i+1}. {rec['nutrient']} - Impact: {rec['impact']}%\n")
        
        # Ensure critical health warnings (BP, BMI) appear first
        critical_recs = [r for r in recommendations if r['nutrient'] in ['Blood Pressure', 'Body Mass Index']]
        other_recs = [r for r in recommendations if r['nutrient'] not in ['Blood Pressure', 'Body Mass Index']]
        recommendations = critical_recs + other_recs
        
        # 4. Combined optimized prediction (apply ALL recommendations at once)
        df_optimized = df_imputed.copy()
        for rec in recommendations:
            col_name = None
            for col, info in {**CLINICAL_TARGETS, **LIFESTYLE_REDUCE_TARGETS}.items():
                if info['label'] == rec['nutrient']:
                    col_name = col
                    break
            if col_name:
                df_optimized[col_name] = rec['target']
        
        prob_optimized = float(model_24.predict_proba(df_optimized)[0][1] * 100)
        total_impact = prob_optimized - prob_baseline
        
        # Build summary recommendation text
        if len(recommendations) > 0:
            top_recs = [r['nutrient'] for r in recommendations[:3]]
            summary = f"Focus on improving: {', '.join(top_recs)}. These changes could increase your success probability by {round(total_impact, 1)}%."
        else:
            summary = "Your nutritional profile is well-optimized. Maintain your current diet and lifestyle."
        
        return {
            "success": True,
            "baseline_probability": round(prob_baseline, 2),
            "optimized_probability": round(prob_optimized, 2),
            "impact_score": round(total_impact, 2),
            "recommendation": summary,
            "detailed_recommendations": recommendations[:8]  # Top 8 (includes critical health warnings)
        }
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

# --- MEDLLAMA2 DOCTOR RECOMMENDATION ENDPOINT ---
import httpx

class RecommendationRequest(BaseModel):
    baseline_probability: float = 0.0
    optimized_probability: float = 0.0
    impact_score: float = 0.0
    age: float = 30.0
    bmi_category: str = "Normal"
    sleep: float = 7.0
    cholesterol: float = 180.0
    sbp: float = 120.0
    dbp: float = 80.0
    recommendations: list = []

@app.post("/api/recommend")
async def get_doctor_recommendation(data: RecommendationRequest):
    """Calls local Ollama MedLLaMA2 for personalized doctor-like recommendations"""
    try:
        # Build a clear, structured prompt for the medical LLM
        deficiency_lines = ""
        for rec in data.recommendations:
            nutrient = rec.get('nutrient', 'Unknown')
            current = rec.get('current', 0)
            target = rec.get('target', 0)
            unit = rec.get('unit', '')
            impact = rec.get('impact', 0)
            deficiency_lines += f"  - {nutrient}: Currently {current} {unit}, should be {target} {unit} (fixing this alone could improve success by +{impact}%)\n"
        
        if not deficiency_lines:
            deficiency_lines = "  - No significant deficiencies detected.\n"
        
        prompt = f"""You are a reproductive health specialist providing personalized advice for an IVF patient.

PATIENT PROFILE:
- Age: {data.age} years
- BMI Category: {data.bmi_category}
- Blood Pressure: {data.sbp}/{data.dbp} mmHg
- Cholesterol: {data.cholesterol} mg/dL
- Sleep: {data.sleep} hours/night

AI MODEL PREDICTION:
- Current IVF Success Probability: {data.baseline_probability}%
- Potential Optimized Probability: {data.optimized_probability}%
- Possible Improvement: +{data.impact_score}%

IDENTIFIED NUTRITIONAL DEFICIENCIES:
{deficiency_lines}
Based on this patient's profile and nutritional analysis, provide:
1. A brief overall assessment (2-3 sentences)
2. Top 3 specific dietary recommendations with foods to eat
3. Lifestyle changes that could help (sleep, exercise, stress)
4. Any supplements to consider (with suggested dosages)
5. A motivational closing note

Keep the response concise, warm, and encouraging. Use simple language. Do not use markdown formatting."""

        # Call Ollama local API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "medllama2",
                    "prompt": prompt,
                    "stream": False
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            llm_response = result.get("response", "Unable to generate recommendation.")
            return {
                "success": True,
                "recommendation": llm_response
            }
        else:
            return {
                "success": False,
                "recommendation": f"MedLLaMA2 returned status {response.status_code}. Make sure Ollama is running with: ollama run medllama2"
            }
    except httpx.ConnectError:
        return {
            "success": False,
            "recommendation": "Cannot connect to Ollama. Please make sure Ollama is running locally (ollama serve) and medllama2 model is pulled (ollama pull medllama2)."
        }
    except Exception as e:
        print(f"Recommendation error: {str(e)}")
        return {
            "success": False,
            "recommendation": f"Error generating recommendation: {str(e)}"
        }

class ClinicalRecommendationRequest(BaseModel):
    baseline_probability: float = 0.0
    age: float = 30.0
    amh_level: float = 2.0
    bmi: float = 22.0
    prior_sab: int = 0
    cell_quality: float = 10.0

@app.post("/api/recommend_clinical")
async def get_clinical_doctor_recommendation(data: ClinicalRecommendationRequest):
    """Calls local Ollama MedLLaMA2 for personalized clinical IVF recommendations based on 7-feature model"""
    try:
        # Build a clear, structured prompt for the medical LLM
        prompt = f"""You are a reproductive health specialist providing personalized advice for an IVF patient.

PATIENT CLINICAL PROFILE:
- Age: {data.age} years
- AMH Level: {data.amh_level} ng/mL
- BMI: {data.bmi}
- Prior Spontaneous Abortions (SAB): {data.prior_sab}
- Day 3 Cell Quality / Fragmentation: {data.cell_quality}%

AI MODEL PREDICTION:
- Current IVF Success Probability: {data.baseline_probability}%

Based on this patient's clinical profile, provide:
1. A brief overall clinical assessment (2-3 sentences)
2. Recommendations for improving or managing these specific clinical parameters (e.g., if AMH is low, or fragmentation is high)
3. Lifestyle changes or supplements that could help improve outcomes based on this profile
4. A motivational closing note

Keep the response concise, warm, and encouraging. Use simple language. Do not use markdown formatting."""

        # Call Ollama local API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "medllama2",
                    "prompt": prompt,
                    "stream": False
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            llm_response = result.get("response", "Unable to generate recommendation.")
            return {
                "success": True,
                "recommendation": llm_response
            }
        else:
            return {
                "success": False,
                "recommendation": f"MedLLaMA2 returned status {response.status_code}. Make sure Ollama is running with: ollama run medllama2"
            }
    except httpx.ConnectError:
        return {
            "success": False,
            "recommendation": "Cannot connect to Ollama. Please make sure Ollama is running locally (ollama serve) and medllama2 model is pulled (ollama pull medllama2)."
        }
    except Exception as e:
        print(f"Clinical Recommendation error: {str(e)}")
        return {
            "success": False,
            "recommendation": f"Error generating clinical recommendation: {str(e)}"
        }

@app.get("/")
def home():
    return {
        "message": "IVF Prediction Backend Active",
        "endpoints": ["/api/predict/ivf (7-feat)", "/api/predict/nutrition_full (24-feat)"]
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
