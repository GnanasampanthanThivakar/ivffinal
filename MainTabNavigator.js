import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import ResultScreen from './src/screens/ResultScreen';
import NutritionInputScreen from './src/screens/NutritionInputScreen';
import WellnessHomeScreen from './src/screens/WellnessHomeScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

// Custom Icon Component (using Text emojis for now to save setup time, or simple SVGs if I had them)
// The user updated image shows simple outlined icons.
// I will use Unicode characters that look close enough for now, or View shapes. 
// "Home", "Cutlery", "Heart"
const TabIcon = ({ focused, name }) => {
    let icon = '';
    switch(name) {
        case 'Dashboard': icon = '🏠'; break; // or ☖
        case 'Nutrition': icon = '🥗'; break; // or 🍴
        case 'Wellness': icon = '♥'; break; // or ♡
    }
    
    // Override with better distinct emojis or text icons if preferred
    if (name === 'Dashboard') icon = '☖'; 
    if (name === 'Nutrition') icon = '🍴'; 
    if (name === 'Wellness') icon = '♡'; 

    return (
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{
                fontSize: 24, 
                color: focused ? theme.colors.primary : theme.colors.textLight
            }}>{icon}</Text>
        </View>
    );
}


export default function MainTabNavigator({ route }) {
    // Pass params down to the ResultScreen (Dashboard)
    // The params from ProfileSetupStep3 are in route.params
    const dashboardParams = route.params || {};

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textLight,
                tabBarStyle: {
                    paddingVertical: 8,
                    height: 60,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F0F0F0',
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginBottom: 4,
                },
                tabBarIcon: ({ focused }) => <TabIcon focused={focused} name={route.name} />
            })}
        >
            <Tab.Screen 
                name="Dashboard" 
                component={ResultScreen} 
                initialParams={dashboardParams}
            />
            <Tab.Screen name="Nutrition" component={NutritionInputScreen} />
            <Tab.Screen name="Wellness" component={WellnessHomeScreen} />
        </Tab.Navigator>
    );
}
