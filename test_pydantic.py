from pydantic import BaseModel, ValidationError

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

payload = {
    "age": 34, "gender": 2, "sbp": 118, "dbp": 76,
    "chol": 185, "sleep": 7.5, "smoke": 2, "bmi_cat": 2,
    "calories": 1850, "protein": 75, "carbs": 220, "fat": 65,
    "vit_d": 12.5, "vit_b12": 4.5, "folate_d1": 330, "zinc_d1": 9.5,
    "calories_d2": 1900, "protein_d2": 80, "carbs_d2": 230, "fat_d2": 70,
    "folate_d2": 310, "zinc_d2": 8.5, "vit_d_d2": 11, "vit_b12_d2": 5
}

try:
    NutritionFullInput(**payload)
    print("Validation SUCCESS!")
except ValidationError as e:
    print("Validation ERROR:")
    print(e.json())
except Exception as e:
    print(f"Generic ERROR: {e}")
