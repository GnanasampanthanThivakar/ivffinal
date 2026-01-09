import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image as RNImage, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

// Placeholder for the flower icon. 

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.topSection}>
            <View style={styles.logoCircle}>
                <RNImage 
                  source={require('../../assets/logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
            </View>
        </View>

        <View style={styles.bottomSection}>
            <Text style={styles.title}>Welcome to Momera</Text>
            
            <Text style={styles.description}>
              Your personal guide on your fertility journey. Let's start by creating your profile to personalize your success prediction.
            </Text>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('ProfileSetupStep1')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>Your data is secure and confidential</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
    justifyContent: 'space-between',
  },
  topSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  bottomSection: {
      flex: 0.8,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.display,
    fontSize: 32,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.subheading,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 18,
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  buttonText: {
    ...theme.typography.button,
    color: '#002B49', // Dark color for contrast on Peach
    fontSize: 18,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.l,
    fontSize: 12,
  },
});
