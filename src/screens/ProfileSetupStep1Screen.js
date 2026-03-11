import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('160');
  const [weight, setWeight] = useState('55');

  const InputGroup = ({ label, value, onChangeText, placeholder, keyboardType = 'default', unit }) => {
    const [isFocused, setIsFocused] = useState(false);
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <TextInput 
            style={styles.input} 
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D9488', '#0F766E']}
        style={styles.headerPanel}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.progressSection}>
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBar, { width: '33.33%' }]} />
              </View>
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>
            <Text style={styles.headerTitle}>Profile Setup</Text>
            <Text style={styles.headerSubtitle}>Personalizing your IVF journey</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introBox}>
            <View style={styles.introIconBox}>
                <Text style={styles.introIcon}>👋</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>About You</Text>
                <Text style={styles.introText}>Let's start with the basics to build your core profile.</Text>
            </View>
          </View>

          <View style={styles.glassCard}>
            <InputGroup 
              label="What's your name?" 
              value={name} 
              onChangeText={setName} 
              placeholder="Ex. Sarah" 
            />

            <InputGroup 
              label="Age" 
              value={age} 
              onChangeText={setAge} 
              placeholder="Ex. 32" 
              keyboardType="numeric" 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputGroup 
                  label="Height" 
                  unit="cm"
                  value={height} 
                  onChangeText={setHeight} 
                  placeholder="160" 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputGroup 
                  label="Weight" 
                  unit="kg"
                  value={weight} 
                  onChangeText={setWeight} 
                  placeholder="55" 
                  keyboardType="numeric" 
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => navigation.navigate('ProfileSetupStep2', {
              name, age, height, weight
            })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#0D9488', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} /> 
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerPanel: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...theme.shadows.premium,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressBarWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    opacity: 0.9,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  introIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  introIcon: {
    fontSize: 24,
  },
  introTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  introText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: theme.colors.textLight,
    lineHeight: 18,
  },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...theme.shadows.soft,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 2,
  },
  unitText: {
    fontWeight: '400',
    fontSize: 11,
    color: '#94A3B8',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  row: {
    flexDirection: 'row',
  },
  nextButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
  }
});
