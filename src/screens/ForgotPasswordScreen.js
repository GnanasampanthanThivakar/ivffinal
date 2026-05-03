import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiForgotPin } from '../services/backendApi';
import { isStrongPassword } from '../services/authCredentials';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const onReset = async () => {
    if (!loginId.trim() || !primaryPhone.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('Fill all fields to reset your password');
      return;
    }

    if (!isStrongPassword(newPassword.trim())) {
      setErrorMsg('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg('Password confirmation does not match');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await apiForgotPin({
        loginId: loginId.trim(),
        primaryPhone: primaryPhone.trim(),
        newPassword: newPassword.trim(),
      });
      setSuccessMsg(res?.detail || 'Password reset successfully. Please log in again.');
    } catch (error) {
      const raw = String(error?.message || 'Failed to reset password');
      setErrorMsg(raw.replace(/^Error:\s*/i, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D9488', '#14B8A6', '#E6FFFB']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subTitle}>
            Verify your account with email or username and set a new secure password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={loginId}
            onChangeText={setLoginId}
          />

          <TextInput
            style={styles.input}
            placeholder="Primary Phone"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={primaryPhone}
            onChangeText={setPrimaryPhone}
          />

          <View style={styles.passwordField}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="New Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordField}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm New Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
          {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={onReset}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
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
  primaryBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
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
