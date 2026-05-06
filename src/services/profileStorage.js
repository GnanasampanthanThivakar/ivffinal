import { Platform } from 'react-native';

const PROFILE_KEY = '@user_profile';

// Cross-platform storage that works for web and mobile
const storage = {
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  },
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    }
  }
};

export const saveUserProfile = async (profileData) => {
  try {
    const jsonValue = JSON.stringify(profileData);
    await storage.setItem(PROFILE_KEY, jsonValue);
    console.log('Profile saved:', profileData);
    return true;
  } catch (e) {
    console.error('Error saving profile:', e);
    return false;
  }
};

export const getUserProfile = async () => {
  try {
    const jsonValue = await storage.getItem(PROFILE_KEY);
    const profile = jsonValue != null ? JSON.parse(jsonValue) : null;
    console.log('Profile retrieved:', profile);
    return profile;
  } catch (e) {
    console.error('Error reading profile:', e);
    return null;
  }
};

export const clearUserProfile = async () => {
  try {
    await storage.removeItem(PROFILE_KEY);
    return true;
  } catch (e) {
    console.error('Error clearing profile:', e);
    return false;
  }
};
