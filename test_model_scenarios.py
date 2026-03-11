import joblib
import pandas as pd
import numpy as np
import os
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import SimpleImputer, IterativeImputer

# --- SCIKIT-LEARN COMPATIBILITY PATCHES ---
for cls in [SimpleImputer, IterativeImputer]:
    if not hasattr(cls, 'sparse_output'):
        cls.sparse_output = False
    if not hasattr(cls, '_fill_dtype'):
        cls._fill_dtype = np.float64
    if not hasattr(cls, '_fit_dtype'):
        cls._fit_dtype = np.float64

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

# Paths
MODEL_PATH = r"c:\Users\VICTUS\Documents\narmatha\narmatha\narmatha real\ivffinal_app\final_ultimate_ivf_ensemble.pkl"

def run_evaluation():
    print(f"Loading model: {MODEL_PATH}")
    research_model_obj = joblib.load(MODEL_PATH)
    model = research_model_obj['model']
    imputer = research_model_obj['imputer']
    features = research_model_obj['features']
    
    # Patch features
    patch_recursively(model)
    patch_recursively(imputer)

    # Define Scenarios
    scenarios = {
        "Optimal Profile": {
            'Age': 28.0, 'Gender': 2.0, 'Systolic_Blood_Pressure': 115.0, 'Diastolic_Blood_Pressure': 75.0,
            'Diet_Calories_Kcal': 2000.0, 'Diet_Protein_g': 85.0, 'Diet_Carbs_g': 250.0, 'Diet_Total_Fat_g': 60.0,
            'Dietary_VitD_mcg': 15.0, 'Dietary_VB12_mcg': 5.0, 'Diet_Calories_Day2': 2100.0, 'Diet_Protein_Day2': 90.0,
            'Diet_Carbs_Day2': 260.0, 'Diet_Total_Fat_Day2_g': 65.0, 'Dietary_Folate_Day2': 400.0, 'Dietary_Zinc_Day2': 11.0,
            'Dietary_VitD_Day2': 15.0, 'Dietary_VB12_Day2': 5.0, 'Sleep_Duration_Hours': 8.0, 'Smoking_History_Status': 2.0,
            'Cholesterol': 170.0, 'Mean_Zinc': 10.5, 'Mean_Folate': 380.0, 'BMI_Category': 2.0
        },
        "Nutrient Deficient": {
            'Age': 32.0, 'Gender': 2.0, 'Systolic_Blood_Pressure': 120.0, 'Diastolic_Blood_Pressure': 80.0,
            'Diet_Calories_Kcal': 1600.0, 'Diet_Protein_g': 45.0, 'Diet_Carbs_g': 300.0, 'Diet_Total_Fat_g': 40.0,
            'Dietary_VitD_mcg': 5.0, 'Dietary_VB12_mcg': 1.5, 'Diet_Calories_Day2': 1650.0, 'Diet_Protein_Day2': 50.0,
            'Diet_Carbs_Day2': 310.0, 'Diet_Total_Fat_Day2_g': 45.0, 'Dietary_Folate_Day2': 150.0, 'Dietary_Zinc_Day2': 5.0,
            'Dietary_VitD_Day2': 5.0, 'Dietary_VB12_Day2': 1.5, 'Sleep_Duration_Hours': 6.0, 'Smoking_History_Status': 2.0,
            'Cholesterol': 190.0, 'Mean_Zinc': 5.5, 'Mean_Folate': 160.0, 'BMI_Category': 2.0
        },
        "High Risk / Lifestyle": {
            'Age': 38.0, 'Gender': 2.0, 'Systolic_Blood_Pressure': 135.0, 'Diastolic_Blood_Pressure': 88.0,
            'Diet_Calories_Kcal': 2400.0, 'Diet_Protein_g': 60.0, 'Diet_Carbs_g': 350.0, 'Diet_Total_Fat_g': 100.0,
            'Dietary_VitD_mcg': 8.0, 'Dietary_VB12_mcg': 2.5, 'Diet_Calories_Day2': 2500.0, 'Diet_Protein_Day2': 65.0,
            'Diet_Carbs_Day2': 360.0, 'Diet_Total_Fat_Day2_g': 110.0, 'Dietary_Folate_Day2': 200.0, 'Dietary_Zinc_Day2': 7.0,
            'Dietary_VitD_Day2': 8.0, 'Dietary_VB12_Day2': 2.5, 'Sleep_Duration_Hours': 5.0, 'Smoking_History_Status': 1.0,
            'Cholesterol': 230.0, 'Mean_Zinc': 7.5, 'Mean_Folate': 220.0, 'BMI_Category': 3.0
        }
    }

    print("\n" + "="*80)
    print(f"{'Scenario':<25} | {'Base Prob (%)':<15} | {'Boosted Prob (%)':<15} | {'Impact'}")
    print("-" * 80)

    for name, data in scenarios.items():
        # Baseline
        df_base = pd.DataFrame([data], columns=features)
        df_base_imputed = pd.DataFrame(imputer.transform(df_base), columns=features)
        prob_base = model.predict_proba(df_base_imputed)[0][1] * 100

        # Intervention (+20% Folate & Zinc)
        df_boost = df_base_imputed.copy()
        df_boost['Mean_Folate'] *= 1.20
        df_boost['Mean_Zinc'] *= 1.20
        df_boost['Dietary_Folate_Day2'] *= 1.20 # Mirroring intervention
        df_boost['Dietary_Zinc_Day2'] *= 1.20
        
        prob_boost = model.predict_proba(df_boost)[0][1] * 100
        impact = prob_boost - prob_base

        print(f"{name:<25} | {prob_base:>14.2f}% | {prob_boost:>14.2f}% | {impact:>+6.2f}")

    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        run_evaluation()
    except Exception as e:
        print(f"Error running evaluation: {e}")
        import traceback
        traceback.print_exc()
