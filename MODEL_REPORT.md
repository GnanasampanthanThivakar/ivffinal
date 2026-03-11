# 🧬 IVF Nutrition AI — How Our Model Works

> A simple guide explaining what the model does, what it takes as input, what it gives as output, and how recommendations are generated.

---

## 🤔 What is this system?

Imagine a **smart doctor** who looks at what a patient eats, how they sleep, and their health numbers — and then says:

> *"Based on everything I see, your chance of IVF success is 59%. But if you eat more spinach and get more sunlight, it could go up to 70%!"*

That's exactly what our AI system does. It uses a **machine learning model** trained on real clinical data to predict IVF outcomes and suggest improvements.

---

## 📥 What Goes IN? (The 24 Inputs)

The model needs **24 pieces of information** about a patient. Think of it like filling out a health form:

### 👤 About the Patient (4 inputs)
| # | Input | What it means | Example |
|---|-------|--------------|---------|
| 1 | **Age** | How old the patient is | 30 years |
| 2 | **Gender** | Male (1) or Female (2) | 2 (Female) |
| 3 | **BMI Category** | Body weight category: Underweight(1), Normal(2), Overweight(3), Obese(4) | 2 (Normal) |
| 4 | **Smoking** | Never smoked(2) or Former/Current smoker(1) | 2 (Never) |

### ❤️ Health Numbers (3 inputs)
| # | Input | What it means | Example |
|---|-------|--------------|---------|
| 5 | **Systolic BP** | Top blood pressure number | 120 mmHg |
| 6 | **Diastolic BP** | Bottom blood pressure number | 80 mmHg |
| 7 | **Cholesterol** | Blood cholesterol level | 180 mg/dL |

### 😴 Lifestyle (1 input)
| # | Input | What it means | Example |
|---|-------|--------------|---------|
| 8 | **Sleep Duration** | Hours of sleep per night | 7 hours |

### 🍎 Day 1 Nutrition (6 inputs)
*What the patient ate on the first protocol day:*

| # | Input | What it means | Example |
|---|-------|--------------|---------|
| 9 | **Calories** | Total energy from food | 2000 kcal |
| 10 | **Protein** | From meat, eggs, beans | 70 g |
| 11 | **Carbs** | From rice, bread, fruits | 250 g |
| 12 | **Fat** | From oil, butter, nuts | 60 g |
| 13 | **Vitamin D** | From sunlight, fish, milk | 12 mcg |
| 14 | **Vitamin B12** | From meat, dairy | 3.5 mcg |

### 🥗 Day 2 Nutrition (6 inputs)
*Same as Day 1 but measured on a second day to check consistency:*

| # | Input | What it means | Example |
|---|-------|--------------|---------|
| 15 | **Calories D2** | Total energy (day 2) | 2100 kcal |
| 16 | **Protein D2** | Protein intake (day 2) | 75 g |
| 17 | **Carbs D2** | Carbohydrate intake (day 2) | 260 g |
| 18 | **Fat D2** | Fat intake (day 2) | 65 g |
| 19 | **Folate D2** | From green vegetables (day 2) | 310 mcg |
| 20 | **Zinc D2** | From meat, seeds (day 2) | 8.5 mg |
| 21 | **Vitamin D D2** | From sunlight, fish (day 2) | 11 mcg |
| 22 | **Vitamin B12 D2** | From meat, dairy (day 2) | 3 mcg |

### 📊 Averaged Values (2 inputs)
*The system calculates these automatically from both days:*

| # | Input | What it means | How calculated |
|---|-------|--------------|----------------|
| 23 | **Mean Folate** | Average folate across both days | (Day1 + Day2) ÷ 2 |
| 24 | **Mean Zinc** | Average zinc across both days | (Day1 + Day2) ÷ 2 |

### Why these 24 inputs?

> These specific features were selected because research shows they have the **strongest correlation with IVF outcomes**. Nutrients like Folate, Zinc, and Vitamin D directly affect egg quality, embryo development, and implantation success.

### 🤷 Why Day 1 AND Day 2? Why not just one day?

The model was trained on **NHANES (National Health and Nutrition Examination Survey)** data. NHANES collects dietary data using a method called the **24-hour Dietary Recall** — and they do it **twice**:

| | What happens |
|:---|:---|
| **Day 1** | Patient recalls everything they ate in the last 24 hours (in-person interview) |
| **Day 2** | Same thing, but done 3–10 days later (phone interview) |

**Why not just one day?** Because what you eat on a single day is **unreliable**:

- Monday: You ate a huge salad → Folate = 500 mcg ✅
- Tuesday: You ate pizza all day → Folate = 100 mcg ❌

If the model only saw Monday, it would think *"this patient eats great!"* — but that's not true.

**By collecting two separate days:**

1. **Captures dietary variability** — people don't eat the same thing every day
2. **The average (Mean Folate, Mean Zinc) is more accurate** — closer to the patient's *actual habitual intake*
3. **The model can detect consistency** — if Day 1 and Day 2 are very different, the patient's diet is unstable

**How the model uses both:**

```
Day 1 Folate = 330 mcg
Day 2 Folate = 310 mcg
                ↓
Mean Folate = (330 + 310) / 2 = 320 mcg  ← Model uses this average
```

> **Simple analogy**: *"Asking about food on one day is like checking the weather once and predicting the whole year. Two days gives us a much better picture of what the patient **actually** eats regularly."*

---

## 📤 What Comes OUT? (The Outputs)

### Output 1: **Baseline Probability** (Model-Predicted ✅)
> *"Right now, your IVF success chance is **59.2%**"*

- This is the **core prediction** from the ML model
- The model looks at all 24 inputs together and calculates this number
- It is NOT a simple formula — it's learned from thousands of real patient records

### Output 2: **Optimized Probability** (Model-Predicted ✅)
> *"If you improve your nutrition, it could be **70.7%**"*

- The system takes all the recommended improvements and applies them
- It runs the model **again** with the improved values
- This is also a real ML prediction, not a guess

### Output 3: **Impact Score** (Model-Predicted ✅)
> *"That's a **+11.6%** potential improvement"*

- Simply: Optimized − Baseline = Impact
- Example: 70.7% − 59.2% = +11.5%

### Output 4: **Per-Nutrient Impact** (Model-Predicted ✅)
> *"Folate alone could improve your score by **+6.78%**"*

- For each nutrient that is below the recommended level, the system:
  1. Sets ONLY that nutrient to its clinical target
  2. Keeps everything else the same
  3. Runs the model again
  4. Measures the change in probability
- This means **each impact score is a separate model prediction**

### Output 5: **Recommendations** (Hybrid: Rule-Based + Model ⚙️)
> *"Eat more spinach and lentils to increase your Folate"*

| Part | Source |
|------|--------|
| "Your Folate is 320 mcg" | From the patient's input data |
| "Target is 400 mcg" | Rule-based: WHO clinical guideline |
| "Below Target" label | Rule-based: simple comparison (320 < 400) |
| "+6.78% impact" | **Model-predicted**: actual `predict_proba()` result |
| "Eat spinach, lentils..." | Rule-based: hardcoded food suggestions |
| Ranking order (Folate first) | Sorted by model-predicted impact (highest first) |

---

## 🧠 The Model Inside

### What type of model?
- **Ensemble Classifier** — it combines multiple models working together (like asking 5 doctors instead of 1)
- Trained using scikit-learn's `VotingClassifier`
- Uses an `IterativeImputer` to handle any missing values

### How was it trained?
- Trained on **real clinical + NHANES nutritional data**
- The model learned patterns like:
  - *"Patients with Folate > 400mcg tend to have better outcomes"*
  - *"Low Vitamin D combined with poor sleep reduces success rates"*
- It learned these patterns **automatically** from the data — we did not program these rules

### What does `predict_proba()` return?
- A number between **0.0 and 1.0**
- We multiply by 100 to show as a percentage
- Example: `predict_proba() = 0.592` means **59.2% success probability**

---

## 🔄 Step-by-Step Flow

Here's exactly what happens when a patient submits their data:

```
Step 1: Patient fills in 24 values in the app
           ↓
Step 2: App sends data to the backend server
           ↓
Step 3: Backend maps the data to model features
           ↓
Step 4: Missing values are handled (imputer)
           ↓
Step 5: MODEL PREDICTION #1 → Baseline probability (e.g., 59.2%)
           ↓
Step 6: System checks each nutrient against clinical targets
           ↓
Step 7: For each deficient nutrient:
         - Set it to the target value
         - MODEL PREDICTION #2, #3, #4... → Individual impact
           ↓
Step 8: Apply ALL improvements together
         - MODEL PREDICTION (final) → Optimized probability (e.g., 70.7%)
           ↓
Step 9: Sort recommendations by impact (highest first)
           ↓
Step 10: Send everything back to the app for display
```

---

## 📊 Example Result Breakdown

For a patient who entered their nutrition data, the system returned:

| Recommendation | Current | Target | Impact | Source of Impact |
|:---|:---:|:---:|:---:|:---|
| 🥬 **Folate** | 320 mcg | 400 mcg | **+6.78%** | ML Model prediction |
| ☀️ **Vitamin D (D2)** | 11 mcg | 15 mcg | **+2.59%** | ML Model prediction |
| 🥬 **Folate (D2)** | 310 mcg | 400 mcg | **+2.27%** | ML Model prediction |
| 🦪 **Zinc** | 9 mg | 11 mg | **+2.06%** | ML Model prediction |
| ☀️ **Vitamin D (D1)** | 12.5 mcg | 15 mcg | **+1.48%** | ML Model prediction |
| 🦪 **Zinc (D2)** | 8.5 mg | 11 mg | **+0.53%** | ML Model prediction |

> **Why Folate is ranked #1**: Because when the model tested *"what if this patient had 400mcg Folate instead of 320mcg?"*, it found the **biggest improvement** (+6.78%) compared to any other single nutrient change.

---

## ✅ Summary Table: What is Model vs What is Rule-Based

| Component | Model-Predicted? | Rule-Based? |
|:---|:---:|:---:|
| Baseline probability (59.2%) | ✅ Yes | |
| Optimized probability (70.7%) | ✅ Yes | |
| Individual impact scores (+6.78%, +2.59%, etc.) | ✅ Yes | |
| Ranking order of recommendations | ✅ Yes (sorted by impact) | |
| Clinical target values (400mcg, 15mcg, 11mg) | | ✅ Yes (WHO/RDA guidelines) |
| "Below Target" / "Above Target" labels | | ✅ Yes (simple comparison) |
| Food suggestions (spinach, salmon, etc.) | | ✅ Yes (hardcoded advice) |

---

## 🎤 One-Line Answer for Your Panel

> *"The probabilities and impact scores are predicted by our trained ML ensemble model. The clinical targets are from medical guidelines. The system combines both: it uses clinical targets to identify deficiencies, then uses the ML model to measure how much fixing each deficiency would actually improve the IVF outcome."*

---

*Report generated for the IVF Nutrition AI System — `final_ultimate_ivf_ensemble.pkl` (24-feature Research Model)*
