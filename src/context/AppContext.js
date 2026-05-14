import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * AppContext — Shared State for Cross-Component Integration
 * 
 * This context connects all 3 major components:
 *   1. Clinical IVF Prediction (7-feature model)
 *   2. Nutrition Impact Analysis (24-feature model)
 *   3. Wellness/Stress Monitoring (wearable data)
 * 
 * By sharing scores across tabs, the Dashboard can display a 
 * Composite Score that demonstrates component interconnection.
 */

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // --- Helper for cross-platform persistence (Web safe) ---
    const loadSavedState = (key) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const saved = window.localStorage.getItem(key);
                return saved ? JSON.parse(saved) : null;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const saveState = (key, value) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                if (value === null) {
                    window.localStorage.removeItem(key);
                } else {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (e) {}
        }
    };

    // --- Clinical IVF Score (from 7-feature model) ---
    const [clinicalScore, setClinicalScoreState] = useState(() => loadSavedState('ivf_clinical_score'));

    const setClinicalScore = useCallback((data) => {
        setClinicalScoreState(data);
        saveState('ivf_clinical_score', data);
    }, []);

    // --- Nutrition Score (from 24-feature model) ---
    const [nutritionScore, setNutritionScoreState] = useState(() => loadSavedState('ivf_nutrition_score'));

    const setNutritionScore = useCallback((data) => {
        setNutritionScoreState(data);
        saveState('ivf_nutrition_score', data);
    }, []);

    // --- Wellness Data (from wearable/stress model) ---
    const [wellnessData, setWellnessDataState] = useState(() => loadSavedState('ivf_wellness_data'));

    const setWellnessData = useCallback((data) => {
        setWellnessDataState(data);
        saveState('ivf_wellness_data', data);
    }, []);

    // --- Composite Score Calculator ---
    const getCompositeScore = useCallback(() => {
        if (!clinicalScore) return null;

        const clinScore = clinicalScore.score;
        let sumScore = clinScore * 0.7;
        let sumWeight = 0.7;

        let components = [
            { 
                name: 'Clinical IVF', 
                score: clinScore, 
                status: 'completed',
                icon: '🔬'
            }
        ];

        // Add nutrition impact if available (Weight: 0.2)
        if (nutritionScore) {
            // Treat Nutrition standalone sub-score as optimized probability or base+impact
            const nutSubScore = nutritionScore.optimized || (clinScore + nutritionScore.impact);
            sumScore += nutSubScore * 0.2;
            sumWeight += 0.2;

            components.push({ 
                name: 'Nutrition', 
                score: nutritionScore.impact, // Preserved delta for ResultScreen UI formatting compatibility
                status: 'completed',
                icon: '🥗'
            });
        } else {
            components.push({ 
                name: 'Nutrition', 
                score: null, 
                status: 'pending',
                icon: '🥗'
            });
        }

        // Add wellness factor if available (Weight: 0.1)
        if (wellnessData) {
            const stressBonus = wellnessData.stressLevel === 'Low' ? 1.5 
                              : wellnessData.stressLevel === 'Medium' ? 0 
                              : -1.5;
            
            // Map stress to a Behavioral Health Quality Score out of 100
            const wellSubScore = wellnessData.stressLevel === 'Low' ? 95 
                               : wellnessData.stressLevel === 'Medium' ? 75 
                               : 50;
            sumScore += wellSubScore * 0.1;
            sumWeight += 0.1;

            components.push({ 
                name: 'Wellness', 
                score: stressBonus, // Preserved bonus delta for ResultScreen UI formatting compatibility
                status: 'completed',
                icon: '💓'
            });
        } else {
            components.push({ 
                name: 'Wellness', 
                score: null, 
                status: 'pending',
                icon: '💓'
            });
        }

        // Dynamically normalized weighted average based on completed components
        const composite = sumWeight > 0 ? (sumScore / sumWeight) : clinScore;
        const completedCount = components.filter(c => c.status === 'completed').length;

        return {
            compositeScore: Math.min(100, Math.max(0, parseFloat(composite.toFixed(2)))),
            baselineScore: clinScore,
            components,
            completedCount,
            totalComponents: 3,
            integrationLevel: completedCount === 3 ? 'Full' : completedCount === 2 ? 'Partial' : 'Basic'
        };
    }, [clinicalScore, nutritionScore, wellnessData]);

    const value = {
        // Clinical
        clinicalScore,
        setClinicalScore,
        // Nutrition
        nutritionScore,
        setNutritionScore,
        // Wellness
        wellnessData,
        setWellnessData,
        // Composite
        getCompositeScore,
    };

    // Expose setters to window for console-based testing (invisible to UI)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__injectWellnessData = setWellnessData;
            window.__injectNutritionScore = setNutritionScore;
        }
    }, [setWellnessData, setNutritionScore]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
