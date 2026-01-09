import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions, Image as RNImage } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function LoadingScreen({ navigation, route }) {
  const params = route.params || {};
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Simulate progress
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + 2; // Increment by 2% every 50ms = 2.5 seconds total
        });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (progress === 100) {
          setTimeout(() => {
              navigation.replace('MainTabs', params);
          }, 500);
      }
  }, [progress]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Logo/Icon Area */}
        <View style={styles.logoCircle}>
             <RNImage 
                source={require('../../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
            />
        </View>

        <Text style={styles.title}>Analyzing Your Data</Text>
        
        <Text style={styles.subtitle}>
          We're creating your personalized fertility prediction...
        </Text>

        <View style={styles.progressBarBackground}>
             <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary, // Keep the teal background for this screen as it's a transition
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80, // Circle
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent white
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
      width: 100,
      height: 100,
  },
  title: {
    ...theme.typography.display,
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.subheading,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  progressBarBackground: {
      width: '85%',
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 4,
      marginBottom: 16,
      overflow: 'hidden',
  },
  progressBar: {
      height: '100%',
      backgroundColor: theme.colors.secondary, // Peach/Orange loading bar
      borderRadius: 4,
  },
  progressText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontVariant: ['tabular-nums'],
  }
});
