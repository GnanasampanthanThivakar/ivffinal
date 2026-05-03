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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseReady } from '../services/firebase';
import { normalizeAuthError } from '../services/authErrorMessages';
import { apiAuthResolveLoginId } from '../services/backendApi';
import {
  buildFirebasePasswordCandidates,
  normalizeEmail,
} from '../services/authCredentials';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation, route }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

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
    <LinearGradient colors={['#0D9488', '#14B8A6', '#E6FFFB']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subTitle}>Sign in to continue to your IVF wellness dashboard.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={loginId}
              onChangeText={setLoginId}
            />

            <View style={styles.passwordField}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password or legacy PIN"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
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

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            {!!infoMsg && <Text style={styles.success}>{infoMsg}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={onLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8E2E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  passwordField: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 12,
  },
  success: {
    color: '#059669',
    fontSize: 13,
    marginBottom: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 14,
  },
  forgotText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: 18,
  },
  linkText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
});
