import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import AccountProfileScreen from './src/screens/AccountProfileScreen';
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
import { auth, firebaseReady } from './src/services/firebase';
import { fetchUserProfile } from './src/services/userProfileService';

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authReady, setAuthReady] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  React.useEffect(() => {
    if (!firebaseReady || !auth) {
      setUser(null);
      setAuthLoading(false);
      setAuthReady(true);
      return;
    }

    const fallback = setTimeout(() => {
      setAuthLoading(false);
      setAuthReady(true);
    }, 1500);

    let unsub = () => {};

    try {
      unsub = onAuthStateChanged(auth, async (nextUser) => {
        clearTimeout(fallback);
        setUser(nextUser);

        if (nextUser?.uid) {
          try {
            const profile = await fetchUserProfile(nextUser.uid);
            setNeedsOnboarding(!profile?.onboardingCompleted);
          } catch (error) {
            console.log('profile bootstrap error:', error);
            setNeedsOnboarding(true);
          }
        } else {
          setNeedsOnboarding(false);
        }

        setAuthLoading(false);
        setAuthReady(true);
      });
    } catch (error) {
      console.log('auth init error:', error);
      clearTimeout(fallback);
      setAuthLoading(false);
      setAuthReady(true);
    }

    return () => {
      clearTimeout(fallback);
      unsub();
    };
  }, []);

  if (!fontsLoaded || (authLoading && !authReady)) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  const isLoggedIn = !!user;
  const initialPrivateRoute = needsOnboarding ? 'ProfileSetup' : 'MainTabs';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isLoggedIn ? initialPrivateRoute : 'Login'}
          screenOptions={{
            headerShown: false
          }}
        >
          {!isLoggedIn ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="AccountProfile" component={AccountProfileScreen} />
              <Stack.Screen name="ProfileSetup" component={ProfileSetupStep1Screen} />
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
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
