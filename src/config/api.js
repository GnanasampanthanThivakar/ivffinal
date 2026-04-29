// API Configuration
// Switch between these depending on where you're testing:

// Use this when testing in browser or Expo web
// export const API_BASE_URL = 'http://127.0.0.1:8000';

// Use this when testing on physical device or emulator
export const API_BASE_URL = 'http://192.168.40.1:8000';

// Full endpoint
export const NUTRITION_PREDICT_URL = `${API_BASE_URL}/api/predict/nutrition_full`;

export default {
    API_BASE_URL,
    NUTRITION_PREDICT_URL
};
