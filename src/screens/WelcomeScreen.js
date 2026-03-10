import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image as RNImage, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Rings */}
      <View style={[styles.ring, styles.ring1]} />
      <View style={[styles.ring, styles.ring2]} />

      <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
            <RNImage 
                source={require('../../assets/ivf_hero_teal.png')} 
                style={styles.heroImage}
                resizeMode="contain"
            />
        </View>

        <View style={styles.bottomSection}>
            <Text style={styles.title}>Momera</Text>
            
            <Text style={styles.description}>
              Your AI-powered guide for proactive IVF success{'\n'}and personalized nutrition.
            </Text>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('ProfileSetupStep1')}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Get started</Text>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height,
    width: width,
    backgroundColor: '#1E9A8A', // Teal color matching the app's theme
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  ring1: {
    width: width * 2.0,
    height: width * 2.0,
    top: height * 0.3 - width,
    left: width * 0.5 - width,
  },
  ring2: {
    width: width * 1.4,
    height: width * 1.4,
    top: height * 0.3 - width * 0.7,
    left: width * 0.5 - width * 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 24, // reduced for overflow
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topSection: {
      flex: 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20, // reduced
  },
  heroImage: {
    width: width * 0.65, // reduced size slightly
    height: width * 0.65,
  },
  bottomSection: {
      flex: 1, // increased flex
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: 'PlusJakartaSans_700Bold', // Explicit font
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular', // Explicit font
  },
  button: {
    backgroundColor: '#FFFFFF',
    height: 64,
    width: '95%',
    alignSelf: 'center',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    color: '#000000',
    fontSize: 16,
    paddingLeft: 48, 
    fontFamily: 'PlusJakartaSans_500Medium', // Explicit font
  },
  arrowContainer: {
    backgroundColor: '#1E1E1E',
    height: 48,
    width: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: -2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
