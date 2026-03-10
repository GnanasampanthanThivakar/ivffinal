import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ProfileSetupStep1Screen from './src/screens/ProfileSetupStep1Screen';
import ProfileSetupStep2Screen from './src/screens/ProfileSetupStep2Screen';
import ProfileSetupStep3Screen from './src/screens/ProfileSetupStep3Screen';
import LoadingScreen from './src/screens/LoadingScreen';
import WeeklyReportScreen from './src/screens/WeeklyReportScreen';
import AlertsScreen from './src/screens/AlertScreen';
import ActivitiesScreen from './src/screens/ActivityScreen';
import NutritionInputScreen from './src/screens/NutritionInputScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import NutritionResultScreen from './src/screens/NutritionResultScreen';
import MainTabNavigator from './MainTabNavigator';

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null; // or a custom loading screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupStep1Screen} />
          {/* Kept 'ProfileSetup' as name for Step 1 if WelcomeScreen links there, 
              but let's update WelcomeScreen to point to 'ProfileSetupStep1' for clarity 
              OR just alias it here. Let's start clean. */}
          <Stack.Screen name="ProfileSetupStep1" component={ProfileSetupStep1Screen} />
          <Stack.Screen name="ProfileSetupStep2" component={ProfileSetupStep2Screen} />
          <Stack.Screen name="ProfileSetupStep3" component={ProfileSetupStep3Screen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen} />
          <Stack.Screen name="Alerts" component={AlertsScreen} />
          <Stack.Screen name="Activities" component={ActivitiesScreen} />
          <Stack.Screen name="NutritionInput" component={NutritionInputScreen} />
          <Stack.Screen name="Nutrition" component={NutritionScreen} />
          <Stack.Screen name="NutritionResult" component={NutritionResultScreen} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
