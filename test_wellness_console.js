/**
 * WELLNESS DATA INJECTOR - Testing Script
 * 
 * How to use:
 * 1. Open the Momera app in browser (http://localhost:8081)
 * 2. Open Browser Console (F12 → Console tab)
 * 3. Copy-paste this entire script and press Enter
 * 4. Go back to HOME tab — Composite card will show Wellness ✓
 * 
 * This directly injects data into the React Context without modifying UI,
 * keeping your panel presentation safe.
 */

(function simulateWatch() {
    // 1. Check if the AppContext has exposed the injection function
    if (typeof window.__injectWellnessData !== 'function') {
        console.error("❌ Injection failed. Please refresh the page (F5) so the app loads the new context.");
        return;
    }

    // 2. Define the simulated data
    const SIMULATED_DATA = {
        hr: 75,
        hrv: 48,
        sleep: 7.5,
        steps: 7500,
        stressLevel: "Low"
    };

    // 3. Inject it directly into the React AppContext
    window.__injectWellnessData(SIMULATED_DATA);

    // 4. Output success
    console.log("");
    console.log("✅ WELLNESS DATA INJECTED SUCCESSFULLY!");
    console.log("📋 INJECTED VALUES:");
    console.log(`   Heart Rate: ${SIMULATED_DATA.hr} bpm`);
    console.log(`   HRV:        ${SIMULATED_DATA.hrv} ms`);
    console.log(`   Sleep:      ${SIMULATED_DATA.sleep} hrs`);
    console.log(`   Steps:      ${SIMULATED_DATA.steps}`);
    console.log(`   Stress:     ${SIMULATED_DATA.stressLevel}`);
    console.log("");
    console.log("👉 Go to the HOME tab now! You will see Wellness marked as ✓ and the Composite Score updated.");
})();
