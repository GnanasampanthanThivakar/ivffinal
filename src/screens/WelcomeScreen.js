import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Image as RNImage, 
    Dimensions, 
    StatusBar,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0D9488', '#14B8A6', '#0F766E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
            {/* Top Text Section */}
            <View style={styles.topTextSection}>
                <Text style={styles.mainHeadline}>Momera</Text>
                <Text style={styles.subHeadline}>
                    Your AI-powered guide for IVF success,{'\n'}personalized nutrition, and wellness with{'\n'}seamless watch integration.
                </Text>
            </View>

            {/* Centered Doctor Image Section */}
            <View style={styles.heroSection}>
                <RNImage 
                    source={require('../../assets/male_doctor.png')} 
                    style={styles.doctorImage}
                    resizeMode="contain"
                />
                
                {/* Floating Labels */}
                <View style={[styles.floatingLabel, styles.aiConsultLabel]}>
                    <Text style={styles.labelEmoji}>✨</Text>
                    <Text style={styles.labelText}>AI Consult</Text>
                </View>

                <View style={[styles.floatingLabel, styles.trustLabel]}>
                    <Text style={styles.labelEmoji}>🩺</Text>
                    <Text style={styles.labelText}>Trust Us</Text>
                </View>
            </View>

            {/* Bottom Actions Section */}
            <View style={styles.bottomSection}>
                {/* Seamless Background Fade - Overlays the transition */}
                <LinearGradient
                    colors={['rgba(13, 148, 136, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)'] }
                    style={styles.bottomFadeOverlay}
                />
                
                <TouchableOpacity 
                    style={styles.glassButton}
                    onPress={() => navigation.navigate('ProfileSetupStep1')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                        style={styles.buttonInner}
                    >
                        <Text style={styles.buttonText}>Let's Started</Text>
                    </LinearGradient>
                </TouchableOpacity>


            </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D9488',
    overflow: 'hidden', // Prevent overscroll
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
  },
  topTextSection: {
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
    alignItems: 'center',
  },
  mainHeadline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  subHeadline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  doctorImage: {
    width: width * 1.5, // Even larger for maximum impact
    height: height * 0.8, 
    bottom: -120, // Sinking deeper into the fade to maintain head position
  },
  bottomFadeOverlay: {
    position: 'absolute',
    top: -100, // Starts above the bottom section
    left: -28,
    right: -28,
    bottom: -40, // Extend below the content
    zIndex: -1, // Behind buttons but over the background/doctor
  },
  floatingLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiConsultLabel: {
    top: '35%',
    left: -10,
  },
  trustLabel: {
    bottom: '25%',
    right: -10,
  },
  labelEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  glassButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...theme.shadows?.soft,
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488', // Teal text for contrast on glass
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  registerLink: {
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#334155', // Darker text for readability on light background
  },
  registerBold: {
    fontWeight: '800',
    color: '#0D9488',
    textDecorationLine: 'underline',
  }
});
