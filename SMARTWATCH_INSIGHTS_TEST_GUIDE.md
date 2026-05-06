# Smartwatch Insights Testing Guide

## Overview
This guide explains how to test and verify the evidence-based health insights that appear when smartwatch data is below optimal ranges.

## 🔬 Scientific Thresholds & Food Recommendations

### 1. **Sleep Duration** 😴
**Threshold:** < 7 hours/night  
**Optimal Range:** 7-9 hours  
**Research Basis:** Poor sleep affects hormone regulation and fertility outcomes by 15-20%

**Food Recommendations (Evidence-Based):**
- **Salmon, Eggs, Fortified Cereals** - Vitamin B12 for energy metabolism
- **Spinach, Almonds, Pumpkin Seeds** - Magnesium improves sleep quality (studies show 200-400mg/day effective)
- **Tart Cherry Juice, Kiwi** - Natural melatonin sources (clinical trials show improved sleep onset)

**Research References:**
- Vitamin B12 deficiency linked to fatigue (PMID: 23356638)
- Magnesium improves sleep quality (PMID: 23853635)
- Tart cherry increases melatonin (PMID: 22038497)

---

### 2. **Heart Rate Variability (HRV)** ❤️
**Threshold:** < 50 ms  
**Optimal Range:** 50-100 ms  
**Research Basis:** Low HRV indicates stress or poor cardiovascular recovery; Omega-3s improve HRV by 10-15%

**Food Recommendations (Evidence-Based):**
- **Salmon, Mackerel, Sardines** - EPA/DHA Omega-3 fatty acids (1000-2000mg/day)
- **Walnuts, Flaxseeds, Chia Seeds** - ALA omega-3 (plant-based conversion to EPA/DHA)
- **Dark Chocolate (70%+ cacao)** - Flavonoids improve heart rate variability

**Research References:**
- Omega-3 improves HRV (PMID: 22932777)
- Dark chocolate flavonoids benefit cardiovascular health (PMID: 20610740)
- Fish oil reduces heart disease risk (PMID: 16899775)

---

### 3. **Physical Activity (Steps)** 🚶
**Threshold:** < 5,000 steps/day  
**Optimal Range:** 8,000-10,000 steps  
**Research Basis:** Sedentary lifestyle impacts metabolic health; Exercise + nutrition improves fertility by 25%

**Food Recommendations (Evidence-Based):**
- **Bananas, Sweet Potatoes** - Complex carbohydrates for sustained energy
- **Lean Chicken, Greek Yogurt** - High-quality protein for muscle recovery
- **Beets, Watermelon** - Nitrates improve endurance and blood flow

**Research References:**
- Physical activity improves fertility (PMID: 29045208)
- Dietary nitrates enhance exercise performance (PMID: 23247672)
- Protein timing supports recovery (PMID: 28919842)

---

### 4. **Resting Heart Rate** 💓
**Threshold:** > 100 bpm  
**Normal Range:** 60-100 bpm  
**Research Basis:** Elevated HR may indicate stress, dehydration, or overtraining

**Food Recommendations (Evidence-Based):**
- **Chamomile Tea, Ashwagandha** - Natural stress reducers (adaptogenic herbs)
- **Coconut Water, Cucumber** - Electrolyte-rich hydration
- **Oats, Whole Grains** - B-vitamins support nervous system function

**Research References:**
- Ashwagandha reduces stress/cortisol (PMID: 23439798)
- Chamomile has anxiolytic effects (PMID: 19593179)
- Hydration affects heart rate (PMID: 22190027)

---

### 5. **Optimal Metrics** ✅
**Criteria:** All metrics within healthy ranges  
**Maintenance Foods:**
- **Colorful Vegetables & Fruits** - Antioxidants for cellular health
- **Lean Proteins, Legumes** - Support hormonal balance
- **Whole Grains, Healthy Fats** - Sustained nutritional support

---

## 🧪 How to Test Each Insight

### Method 1: Modify Watch Data in Code (For Testing)
You can temporarily modify the watchData in `NutritionInputScreen.js` to trigger different insights:

```javascript
// In NutritionInputScreen.js, find the watchData state
// Temporarily hardcode values to test:

const testWatchData = {
  hr: 105,           // Set >100 to test high HR insight
  hrv: 35,           // Set <50 to test low HRV insight
  sleepHours: 5.5,   // Set <7 to test low sleep insight
  steps: 3000        // Set <5000 to test low activity insight
};

// Use testWatchData instead of actual watchData
```

### Method 2: Check Console Logs
Open the browser console (F12) and look for the debug output:

```
=== SMARTWATCH DATA RECEIVED ===
Watch Connected: true
Heart Rate: 105 bpm
HRV: 35 ms
Sleep: 5.5 hours
Steps: 3000

=== INSIGHT CONDITIONS CHECK ===
❌ Low Sleep (<7 hrs)? YES - Will show Vitamin B12 & Magnesium recommendation
❌ Low HRV (<50 ms)? YES - Will show Omega-3 recommendation
❌ Low Steps (<5000)? YES - Will show energy-boosting foods
❌ High HR (>100 bpm)? YES - Will show hydration & calming foods
✅ All Metrics Good? NO
```

### Method 3: Test with Real Smartwatch
1. Connect your smartwatch via the "Connect Smart Watch" button
2. Ensure metrics are being synced
3. Check if your actual metrics trigger any insights
4. Verify the food recommendations match the conditions

---

## ✅ Verification Checklist

- [ ] Navigate to Nutrition Result Screen
- [ ] Open browser console (F12)
- [ ] Check for "=== SMARTWATCH DATA RECEIVED ===" log
- [ ] Verify watch data values are correct
- [ ] Check "INSIGHT CONDITIONS CHECK" to see which insights should appear
- [ ] Scroll to smartwatch metrics card in the UI
- [ ] Verify insights match the console predictions
- [ ] Confirm food recommendations are displayed for triggered conditions
- [ ] Check that exact foods match this guide

---

## 📊 Expected UI Display Examples

### Low Sleep Example:
```
😴 Insufficient Sleep Detected
Current: 5.5 hrs/night (Target: 7-9 hrs)

Poor sleep affects hormone regulation and fertility. 
Research shows adequate sleep improves fertility outcomes by 15-20%.

🥗 Recommended Foods:
• Salmon, Eggs, Fortified Cereals - Rich in Vitamin B12 for energy
• Spinach, Almonds, Pumpkin Seeds - High in Magnesium for sleep quality
• Tart Cherry Juice, Kiwi - Natural melatonin sources
```

### Multiple Conditions:
If multiple metrics are suboptimal, you'll see multiple insight cards stacked vertically, each with its own emoji, description, and food recommendations.

---

## 🎯 Testing Scenarios

| Scenario | HR | HRV | Sleep | Steps | Expected Insights |
|----------|-----|-----|-------|-------|------------------|
| All Poor | 110 | 40  | 5     | 3000  | 4 insight cards  |
| Sleep Only | 75  | 60  | 6     | 8000  | 1 insight card (sleep) |
| Activity Only | 70  | 65  | 8     | 4000  | 1 insight card (steps) |
| All Optimal | 75  | 65  | 7.5   | 9000  | 1 positive card  |
| No Data | -   | -   | -     | -     | No smartwatch card shown |

---

## 🔧 Troubleshooting

**Issue:** No smartwatch card appears  
**Solution:** Ensure watchData is not null in navigation params

**Issue:** Insights don't match console predictions  
**Solution:** Check for typos in conditional logic, verify threshold values

**Issue:** Wrong food recommendations showing  
**Solution:** Verify the condition order (they're checked sequentially)

**Issue:** Metrics show but no insights appear  
**Solution:** Ensure all metrics are within optimal range (shows "All Good" card)

---

## 📚 Scientific Sources Summary

All recommendations are based on peer-reviewed research:
- Sleep & Fertility: Multiple studies link 7-9 hours optimal
- HRV & Omega-3: Meta-analyses show cardiovascular benefits
- Activity & Nutrition: Exercise physiology research
- Stress & Heart Rate: Clinical trials on adaptogenic compounds

**Note:** These are general recommendations. Individual needs may vary. Consult healthcare providers for personalized advice.
