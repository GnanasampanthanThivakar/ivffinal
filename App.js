import * as React from 'react';
import { ActivityIndicator, View, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { AppProvider } from './src/context/AppContext';
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

const NAV_STATE_KEY = 'momera_nav_state';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authReady, setAuthReady] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  // Navigation state persistence
  const [isNavReady, setIsNavReady] = React.useState(Platform.OS !== 'web');
  const [initialNavState, setInitialNavState] = React.useState(undefined);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  // Restore saved navigation state on web
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const saved = window.localStorage.getItem(NAV_STATE_KEY);
      if (saved) {
        setInitialNavState(JSON.parse(saved));
      }
    } catch (e) {}
    setIsNavReady(true);
  }, []);

  React.useEffect(() => {
    if (!firebaseReady) {
      setAuthLoading(false);
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      try {
        if (currUser) {
          const profile = await fetchUserProfile(currUser.uid);
          setUser(currUser);
          setNeedsOnboarding(!profile?.onboardingCompleted);
        } else {
          setUser(null);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
      } finally {
        setAuthLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  console.log("App State:", { fontsLoaded, authLoading, authReady, isNavReady, firebaseReady, user: !!user });

  if (!fontsLoaded || (authLoading && !authReady) || !isNavReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <View style={{ marginTop: 20 }}>
            {!fontsLoaded && <Text>Loading fonts...</Text>}
            {authLoading && !authReady && <Text>Initializing auth...</Text>}
            {!isNavReady && <Text>Preparing navigation...</Text>}
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  const isLoggedIn = !!user;
  const initialPrivateRoute = needsOnboarding ? 'ProfileSetup' : 'MainTabs';

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer
          initialState={initialNavState}
          onStateChange={(state) => {
            if (Platform.OS === 'web') {
              try {
                window.localStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
              } catch (e) {}
            }
          }}
        >
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
      </AppProvider>
    </SafeAreaProvider>
  );
}
