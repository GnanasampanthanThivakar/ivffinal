import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ResultScreen from './src/screens/ResultScreen';
import NutritionInputScreen from './src/screens/NutritionInputScreen';
import WellnessHomeScreen from './src/screens/WellnessHomeScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

// Premium Tab Component
const TabIcon = ({ focused, name }) => {
    let iconName = '';
    let label = '';
    
    switch(name) {
        case 'Dashboard': 
            iconName = focused ? 'home' : 'home-outline'; 
            label = 'Home';
            break;
        case 'Nutrition': 
            iconName = focused ? 'leaf' : 'leaf-outline'; 
            label = 'Nutrition';
            break;
        case 'Wellness': 
            iconName = focused ? 'heart' : 'heart-outline'; 
            label = 'Wellness';
            break;
    }

    const activeColor = '#0D9488';
    const inactiveColor = '#94A3B8';

    return (
        <View style={styles.tabItemContainer}>
            <Ionicons 
                name={iconName} 
                size={22} 
                color={focused ? activeColor : inactiveColor} 
            />
            <Text style={[
                styles.tabLabel, 
                { color: focused ? activeColor : inactiveColor }
            ]}>{label}</Text>
            {focused && <View style={styles.dotIndicator} />}
        </View>
    );
}

export default function MainTabNavigator({ route }) {
    const dashboardParams = route.params || {};

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
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

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 90 : 70,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...theme.shadows.medium,
        elevation: 20,
    },
    tabItemContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        width: 80,
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_700Bold',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dotIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#0D9488',
        marginTop: 4,
    }
});
