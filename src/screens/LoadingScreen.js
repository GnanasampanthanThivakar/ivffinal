import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions, Image as RNImage } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function LoadingScreen({ navigation, route }) {
  const params = route.params || {};
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      ),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      )
    ]).start();

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
      // Create an async function to call the backend API and wait for the progress bar
      const fetchPrediction = async () => {
          try {
              // The API expects age, bmi, amh_level, prior_sab, d3_cell_count, d3_fragmentation, calculated_velocity
              const apiUrl = 'http://127.0.0.1:8000/api/predict/ivf';
              
              const requestBody = {
                  age: parseFloat(params.age) || 30.0,
                  bmi: parseFloat(params.bmi) || 22.0,
                  amh_level: parseFloat(params.amhLevel) || 2.0,
                  prior_sab: parseFloat(params.priorSAB) || 0.0,
                  d3_cell_count: parseFloat(params.freshD3CellCount) || 8.0,
                  d3_fragmentation: parseFloat(params.freshD3Fragmentation) || 0.0,
                  calculated_velocity: parseFloat(params.calculatedVelocity) || 0.0
              };

              const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestBody)
              });

              const data = await response.json();
              if (response.ok && data.success) {
                  // Wait until progress reaches 100% just to show the UI
                  const checkProgress = setInterval(() => {
                      setProgress((currentProgress) => {
                          if (currentProgress >= 100) {
                              clearInterval(checkProgress);
                              setTimeout(() => {
                                  // Pass the prediction percentage to the next screen (params or direct)
                                  navigation.replace('MainTabs', {
                                      ...params,
                                      predictionSuccess: data.success_probability_percentage || data.prediction || 68
                                  });
                              }, 500);
                              return 100;
                          }
                          return currentProgress;
                      });
                  }, 50);
              } else {
                  console.error('API Error:', data.detail);
                  // Fallback if API fails
                  fallbackNavigation();
              }
          } catch (error) {
              console.error('Network Error:', error);
              // Fallback if no network
              fallbackNavigation();
          }
      };

      const fallbackNavigation = () => {
          const checkProgress = setInterval(() => {
              setProgress((currentProgress) => {
                   if (currentProgress >= 100) {
                       clearInterval(checkProgress);
                       setTimeout(() => {
                           navigation.replace('MainTabs', params);
                       }, 500);
                       return 100;
                   }
                   return currentProgress;
              });
          }, 50);
      };

      // Call the API when component mounts
      fetchPrediction();

      // Clear intervals on unmount would go here if needed
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F766E', '#0D9488', '#115E59']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.bgCircle, { top: -50, right: -50, width: 250, height: 250 }]} />
      <View style={[styles.bgCircle, { bottom: -100, left: -100, width: 300, height: 300, opacity: 0.1 }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          
          {/* Logo/Icon Area with Pulse */}
          <View style={styles.logoWrapper}>
              <Animated.View style={[
                  styles.pulseCircle, 
                  { transform: [{ scale: pulseAnim }] }
              ]} />
              <View style={styles.logoCircle}>
                   <RNImage 
                      source={require('../../assets/loading_doctor.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                  />
              </View>
          </View>

          <Text style={styles.title}>Analyzing Your Data</Text>
          
          <Text style={styles.subtitle}>
            Preparing your personal clinical insights...
          </Text>

          <View style={styles.loaderContainer}>
            <View style={styles.progressBarBackground}>
                <LinearGradient
                    colors={['#F97316', '#FBBF24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBar, { width: `${progress}%` }]}
                />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  bgCircle: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  logoWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
  },
  pulseCircle: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: "#0D9488", // Teal glow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    marginBottom: 50,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  loaderContainer: {
      width: '100%',
      alignItems: 'center',
  },
  progressBarBackground: {
      width: '80%',
      height: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 5,
      marginBottom: 18,
      overflow: 'hidden',
  },
  progressBar: {
      height: '100%',
      borderRadius: 5,
  },
  progressText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: 'PlusJakartaSans_700Bold',
      fontVariant: ['tabular-nums'],
  }
});
