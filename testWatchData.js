/**
 * SMARTWATCH INSIGHTS TEST HELPER
 * 
 * Use these test scenarios to verify that food recommendations appear correctly
 * when biometric data falls below optimal ranges.
 * 
 * Usage: Import and use these test objects in navigation params
 */

// SCENARIO 1: All metrics suboptimal - Should show 4 insight cards
export const TEST_ALL_POOR = {
    watchData: {
        hr: 110,          // > 100 (HIGH)
        hrv: 35,          // < 50 (LOW)
        sleepHours: 5.5,  // < 7 (LOW)
        steps: 3000       // < 5000 (LOW)
    },
    watchConnected: true
};

// SCENARIO 2: Only sleep is poor - Should show 1 sleep insight
export const TEST_SLEEP_ONLY = {
    watchData: {
        hr: 75,
        hrv: 60,
        sleepHours: 6.0,  // < 7 (LOW)
        steps: 8500
    },
    watchConnected: true
};

// SCENARIO 3: Only HRV is poor - Should show 1 HRV insight
export const TEST_HRV_ONLY = {
    watchData: {
        hr: 72,
        hrv: 45,          // < 50 (LOW)
        sleepHours: 7.5,
        steps: 9000
    },
    watchConnected: true
};

// SCENARIO 4: Only activity is poor - Should show 1 activity insight
export const TEST_ACTIVITY_ONLY = {
    watchData: {
        hr: 70,
        hrv: 65,
        sleepHours: 8.0,
        steps: 4000       // < 5000 (LOW)
    },
    watchConnected: true
};

// SCENARIO 5: Only heart rate is elevated - Should show 1 HR insight
export const TEST_HR_ONLY = {
    watchData: {
        hr: 105,          // > 100 (HIGH)
        hrv: 55,
        sleepHours: 7.5,
        steps: 8000
    },
    watchConnected: true
};

// SCENARIO 6: All metrics optimal - Should show 1 "All Good" card
export const TEST_ALL_OPTIMAL = {
    watchData: {
        hr: 72,
        hrv: 65,
        sleepHours: 7.5,
        steps: 9500
    },
    watchConnected: true
};

// SCENARIO 7: Borderline values (just below thresholds)
export const TEST_BORDERLINE = {
    watchData: {
        hr: 101,          // Just above 100
        hrv: 49,          // Just below 50
        sleepHours: 6.9,  // Just below 7
        steps: 4999       // Just below 5000
    },
    watchConnected: true
};

// SCENARIO 8: No watch data - Should not show smartwatch card
export const TEST_NO_WATCH = {
    watchData: null,
    watchConnected: false
};

// SCENARIO 9: Watch disconnected but has cached data
export const TEST_DISCONNECTED = {
    watchData: {
        hr: 75,
        hrv: 60,
        sleepHours: 7.0,
        steps: 8000
    },
    watchConnected: false  // Should show data but no "LIVE" badge
};

// SCENARIO 10: Extreme poor values
export const TEST_EXTREME_VALUES = {
    watchData: {
        hr: 130,          // Very high
        hrv: 20,          // Very low
        sleepHours: 4.0,  // Very low
        steps: 1000       // Very low
    },
    watchConnected: true
};

/**
 * EXPECTED FOOD RECOMMENDATIONS BY SCENARIO
 */
export const EXPECTED_FOODS = {
    LOW_SLEEP: [
        'Salmon, Eggs, Fortified Cereals',
        'Spinach, Almonds, Pumpkin Seeds',
        'Tart Cherry Juice, Kiwi'
    ],
    LOW_HRV: [
        'Salmon, Mackerel, Sardines',
        'Walnuts, Flaxseeds, Chia Seeds',
        'Dark Chocolate (70%+ cacao)'
    ],
    LOW_ACTIVITY: [
        'Bananas, Sweet Potatoes',
        'Lean Chicken, Greek Yogurt',
        'Beets, Watermelon'
    ],
    HIGH_HR: [
        'Chamomile Tea, Ashwagandha',
        'Coconut Water, Cucumber',
        'Oats, Whole Grains'
    ],
    ALL_OPTIMAL: [
        'Colorful Vegetables & Fruits',
        'Lean Proteins, Legumes',
        'Whole Grains, Healthy Fats'
    ]
};

/**
 * HOW TO USE IN YOUR APP
 * 
 * Option 1: Temporary Testing in NutritionInputScreen.js
 * -----------------------------------------------------
 * import { TEST_SLEEP_ONLY } from './testWatchData';
 * 
 * // In handleSubmit, before navigation:
 * nav.navigate('NutritionResult', {
 *     ...yourNutritionData,
 *     ...TEST_SLEEP_ONLY  // Override with test data
 * });
 * 
 * 
 * Option 2: Direct Navigation Testing
 * -----------------------------------
 * Navigate directly to NutritionResult with test data:
 * 
 * navigation.navigate('NutritionResult', {
 *     predictionSuccess: 65,
 *     optimizedProbability: 75,
 *     impactScore: 10,
 *     recommendation: 'Test scenario',
 *     detailedRecommendations: [],
 *     ...TEST_ALL_POOR
 * });
 * 
 * 
 * Option 3: Quick Toggle Button (Development Only)
 * -----------------------------------------------
 * Add a button in NutritionInputScreen:
 * 
 * <TouchableOpacity onPress={() => setWatchData(TEST_ALL_POOR.watchData)}>
 *   <Text>Test All Poor Metrics</Text>
 * </TouchableOpacity>
 */

/**
 * VERIFICATION STEPS FOR EACH SCENARIO
 */
export const VERIFICATION_CHECKLIST = {
    TEST_ALL_POOR: [
        '✓ 4 insight cards appear',
        '✓ Sleep insight shows with Vitamin B12/Magnesium foods',
        '✓ HRV insight shows with Omega-3 foods',
        '✓ Activity insight shows with energy-boosting foods',
        '✓ HR insight shows with hydration/calming foods'
    ],
    TEST_SLEEP_ONLY: [
        '✓ Only 1 insight card appears',
        '✓ Card shows sleep icon 😴',
        '✓ Shows "Current: 6.0 hrs/night"',
        '✓ Lists Salmon, Almonds, Tart Cherry Juice'
    ],
    TEST_ALL_OPTIMAL: [
        '✓ Only 1 insight card appears',
        '✓ Card shows checkmark ✅',
        '✓ Shows "Excellent Biometric Profile"',
        '✓ Recommends maintenance foods'
    ],
    TEST_NO_WATCH: [
        '✓ No smartwatch metrics card appears',
        '✓ Only nutrition recommendations shown',
        '✓ Console shows "NO WATCH DATA"'
    ]
};

/**
 * CONSOLE OUTPUT EXAMPLES
 */
export const EXPECTED_CONSOLE_OUTPUT = {
    TEST_ALL_POOR: `
=== SMARTWATCH DATA RECEIVED ===
Watch Connected: true
Heart Rate: 110 bpm
HRV: 35 ms
Sleep: 5.5 hours
Steps: 3000

=== INSIGHT CONDITIONS CHECK ===
❌ Low Sleep (<7 hrs)? YES - Will show Vitamin B12 & Magnesium recommendation
❌ Low HRV (<50 ms)? YES - Will show Omega-3 recommendation
❌ Low Steps (<5000)? YES - Will show energy-boosting foods
❌ High HR (>100 bpm)? YES - Will show hydration & calming foods
✅ All Metrics Good? NO
    `,
    
    TEST_ALL_OPTIMAL: `
=== SMARTWATCH DATA RECEIVED ===
Watch Connected: true
Heart Rate: 72 bpm
HRV: 65 ms
Sleep: 7.5 hours
Steps: 9500

=== INSIGHT CONDITIONS CHECK ===
❌ Low Sleep (<7 hrs)? NO
❌ Low HRV (<50 ms)? NO
❌ Low Steps (<5000)? NO
❌ High HR (>100 bpm)? NO
✅ All Metrics Good? YES - Will show maintenance foods
    `
};

export default {
    TEST_ALL_POOR,
    TEST_SLEEP_ONLY,
    TEST_HRV_ONLY,
    TEST_ACTIVITY_ONLY,
    TEST_HR_ONLY,
    TEST_ALL_OPTIMAL,
    TEST_BORDERLINE,
    TEST_NO_WATCH,
    TEST_DISCONNECTED,
    TEST_EXTREME_VALUES,
    EXPECTED_FOODS,
    VERIFICATION_CHECKLIST,
    EXPECTED_CONSOLE_OUTPUT
};
