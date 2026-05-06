import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseReady } from '../services/firebase';
import { normalizeAuthError } from '../services/authErrorMessages';
import { apiAuthResolveLoginId } from '../services/backendApi';
import {
  buildFirebasePasswordCandidates,
  normalizeEmail,
} from '../services/authCredentials';
import { theme } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loginIdFocused, setLoginIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (route?.params?.prefillEmail) {
      setLoginId(route.params.prefillEmail);
    }
    if (route?.params?.signupSuccess) {
      setInfoMsg(route.params.signupSuccess);
    }
  }, [route]);

  const onLogin = async () => {
    if (!firebaseReady || !auth) {
      setErrorMsg('Firebase auth is not configured yet.');
      return;
    }

    if (!loginId.trim() || !password.trim()) {
      setErrorMsg('Email or username and password are required');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setInfoMsg('');
      const resolved = await apiAuthResolveLoginId({ loginId: loginId.trim() });
      const resolvedEmail = normalizeEmail(resolved.email);
      const candidates = buildFirebasePasswordCandidates(resolvedEmail, password);
      let lastError = null;

      for (const candidate of candidates) {
        try {
          await signInWithEmailAndPassword(auth, resolvedEmail, candidate);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (error) {
      setErrorMsg(normalizeAuthError(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D9488', '#0F766E']}
        style={styles.headerPanel}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌸</Text>
              </View>
              <Text style={styles.brandName}>Momera</Text>
            </View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>Sign in to your IVF wellness dashboard</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introBox}>
            <View style={styles.introIconBox}>
              <Text style={styles.introIcon}>👋</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Sign In</Text>
              <Text style={styles.introText}>Enter your credentials to access your personalized dashboard.</Text>
            </View>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.label}>Email or Username</Text>
            <View style={[styles.inputWrapper, loginIdFocused && styles.inputWrapperFocused]}>
              <View style={styles.inputIconBox}>
                <Ionicons name="person-outline" size={18} color={loginIdFocused ? '#0D9488' : '#94A3B8'} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter email or username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={loginId}
                onChangeText={setLoginId}
                onFocus={() => setLoginIdFocused(true)}
                onBlur={() => setLoginIdFocused(false)}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <View style={styles.inputIconBox}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? '#0D9488' : '#94A3B8'} />
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {!!infoMsg && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.successText}>{infoMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextButton, loading && { opacity: 0.7 }]}
              onPress={onLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              <LinearGradient
                colors={['#0D9488', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Sign In</Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createAccountBtn}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.createAccountText}>
              Don't have an account? <Text style={styles.createAccountLink}>Create one</Text>
            </Text>
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
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...theme.shadows.premium,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 22,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.3,
    opacity: 0.95,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexGrow: 1,
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...theme.shadows.soft,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputIconBox: {
    paddingLeft: 14,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 18,
  },
  forgotText: {
    color: '#0F766E',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginLeft: 8,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginLeft: 8,
    flex: 1,
  },
  nextButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
  },
  createAccountBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  createAccountText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#64748B',
  },
  createAccountLink: {
    color: '#0F766E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
