import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady } from '../services/firebase';
import { normalizeAuthError } from '../services/authErrorMessages';
import { saveUserProfile } from '../services/userProfileService';
import { apiSignupSendOtp, apiSignupVerifyOtp } from '../services/backendApi';
import {
  buildFirebasePassword,
  calculateAgeFromDob,
  formatDateISO,
  generateUsername,
  getAdultDobCutoffDate,
  isAdultDob,
  isStrongPassword,
  isValidEmail,
  isValidName,
  isValidSriLankanPhone,
  normalizeEmail,
  normalizeSriLankanPhone,
  normalizeUsername,
  sanitizeNameInput,
} from '../services/authCredentials';

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  const onDobChange = (value) => {
    setDob(value);
    setAge(calculateAgeFromDob(value));
  };

  const onDobPickerChange = (_event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setShowDobPicker(false);
    }
    if (!selectedDate) return;
    onDobChange(formatDateISO(selectedDate));
  };

  useEffect(() => {
    if (usernameTouched) return;
    const suggestedUsername = generateUsername(email, firstName.trim(), lastName.trim());
    setUsername(suggestedUsername);
  }, [email, firstName, lastName, usernameTouched]);

  const normalizedEmail = normalizeEmail(email);
  const emailError =
    emailTouched && normalizedEmail
      ? !normalizedEmail.includes('@')
        ? 'Email address must include @ symbol.'
        : !isValidEmail(normalizedEmail)
        ? 'Enter a valid email address.'
        : ''
      : '';

  const handleEmailChange = (value) => {
    setEmailTouched(true);
    setEmail(normalizeEmail(value));
  };

  function validateForm() {
    const normalizedUsername = normalizeUsername(username) || generateUsername(normalizedEmail, firstName.trim(), lastName.trim());
    const cleanedPrimary = normalizeSriLankanPhone(primaryPhone);
    const cleanedSecondary = normalizeSriLankanPhone(secondaryPhone);

    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!normalizedUsername || normalizedUsername.length < 4) return 'Username must be at least 4 characters';
    if (!isValidName(firstName)) return 'First name should contain letters only';
    if (!isValidName(lastName)) return 'Last name should contain letters only';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) return 'DOB must be in YYYY-MM-DD format';
    if (!isAdultDob(dob)) return 'You must be at least 18 years old to sign up';
    if (!isValidSriLankanPhone(cleanedPrimary)) return 'User mobile number must be a valid Sri Lankan mobile number';
    if (!isValidSriLankanPhone(cleanedSecondary)) return 'Guardian mobile number must be a valid Sri Lankan mobile number';
    if (cleanedPrimary === cleanedSecondary) return 'Use two different phone numbers';
    if (!isValidEmail(email)) return 'Enter a valid email address';
    if (!isStrongPassword(password)) return 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol';
    if (address.trim().length < 10) return 'Address must be at least 10 characters';
    return null;
  }

  const onSendOtp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const cleanedPrimary = normalizeSriLankanPhone(primaryPhone);

    try {
      setOtpSending(true);
      setErrorMsg('');
      await apiSignupSendOtp({ phone: cleanedPrimary });
      setVerifiedPhone(cleanedPrimary);
      setOtpStep(true);
      setOtpValue('');
    } catch (error) {
      setErrorMsg(String(error?.message || 'Failed to send OTP').replace(/^Error:\s*/i, ''));
    } finally {
      setOtpSending(false);
    }
  };

  const onVerifyAndCreate = async () => {
    if (!firebaseReady || !auth) {
      setErrorMsg('Firebase auth is not configured yet.');
      return;
    }
    if (otpValue.length !== 4) {
      setErrorMsg('Enter the 4-digit code sent to your mobile.');
      return;
    }

    try {
      setOtpVerifying(true);
      setErrorMsg('');

      await apiSignupVerifyOtp({ phone: verifiedPhone, otp: otpValue });

      const cleanedPrimary = normalizeSriLankanPhone(primaryPhone);
      const cleanedSecondary = normalizeSriLankanPhone(secondaryPhone);
      const normalizedUsername = normalizeUsername(username) || generateUsername(normalizedEmail, firstName.trim(), lastName.trim());
      const firebasePassword = buildFirebasePassword(normalizedEmail, password);

      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, firebasePassword);
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      await saveUserProfile(userCredential.user, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
        dob: dob.trim(),
        age: age.trim(),
        primaryPhone: cleanedPrimary,
        secondaryPhone: cleanedSecondary,
        address: address.trim(),
        email: normalizedEmail,
        provider: 'password',
      });
    } catch (error) {
      setErrorMsg(normalizeAuthError(error, 'Signup failed'));
    } finally {
      setOtpVerifying(false);
    }
  };

  if (otpStep) {
    return (
      <LinearGradient colors={['#0F766E', '#14B8A6', '#E6FFFB']} style={styles.bg}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { justifyContent: 'center' }]} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.title}>Verify Mobile</Text>
              <Text style={styles.subTitle}>
                Enter the 4-digit code sent to{'\n'}
                <Text style={{ fontWeight: '800', color: '#0D9488' }}>{verifiedPhone}</Text>
              </Text>

              {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

              <TextInput
                style={[styles.input, { fontSize: 28, fontWeight: '800', letterSpacing: 16, textAlign: 'center' }]}
                value={otpValue}
                onChangeText={(v) => setOtpValue(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8, opacity: otpVerifying ? 0.7 : 1 }]}
                onPress={onVerifyAndCreate}
                disabled={otpVerifying}
                activeOpacity={0.85}
              >
                {otpVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: 16 }}
                onPress={() => { setOtpStep(false); setOtpValue(''); setErrorMsg(''); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#64748B', fontSize: 13 }}>Back to form</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F766E', '#14B8A6', '#E6FFFB']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subTitle}>Set up your account to start your personalized IVF journey.</Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={(value) => setFirstName(sanitizeNameInput(value))}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={(value) => setLastName(sanitizeNameInput(value))}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={username}
              onChangeText={(value) => {
                setUsernameTouched(true);
                setUsername(value);
              }}
            />

            <Text style={styles.label}>Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webDateShell}>
                <input
                  type="date"
                  value={dob}
                  onChange={(event) => onDobChange(event.target.value)}
                  max={formatDateISO(getAdultDobCutoffDate())}
                  style={styles.webDateInput}
                />
              </View>
            ) : (
              <Pressable style={styles.dateField} onPress={() => setShowDobPicker(true)}>
                <View>
                  <Text style={styles.dateValue}>{dob || 'Pick your date of birth'}</Text>
                  <Text style={styles.dateHint}>Open calendar</Text>
                </View>
                <Text style={styles.dateAction}>Select</Text>
              </Pressable>
            )}

            {Platform.OS !== 'web' && showDobPicker ? (
              <DateTimePicker
                value={dob ? new Date(`${dob}T00:00:00`) : new Date(1999, 6, 1)}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                maximumDate={getAdultDobCutoffDate()}
                onChange={onDobPickerChange}
              />
            ) : null}

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              placeholder="Calculated from DOB"
              placeholderTextColor="#94A3B8"
              value={age}
              editable={false}
            />

            <Text style={styles.label}>User Mobile Phone</Text>
            <View style={styles.phoneField}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>SL</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="77XXXXXXX or 07XXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={primaryPhone}
                onChangeText={(value) => setPrimaryPhone(normalizeSriLankanPhone(value))}
              />
            </View>
            <Text style={styles.helperText}>OTP will be sent to this number to verify your account.</Text>

            <Text style={styles.label}>Guardian Mobile</Text>
            <View style={styles.phoneField}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>SL</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="77XXXXXXX or 07XXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={secondaryPhone}
                onChangeText={(value) => setSecondaryPhone(normalizeSriLankanPhone(value))}
              />
            </View>
            <Text style={styles.helperText}>We will notify this number when stress is high.</Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={handleEmailChange}
            />
            {!!emailError && <Text style={styles.inlineError}>{emailError}</Text>}

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Create a secure password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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
            <Text style={styles.helperText}>
              Use at least 8 characters with uppercase, lowercase, number, and symbol.
            </Text>

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="Address"
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={address}
              onChangeText={setAddress}
            />

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, otpSending && { opacity: 0.7 }]}
              onPress={onSendOtp}
              activeOpacity={0.85}
              disabled={otpSending}
            >
              {otpSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
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
  label: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
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
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 14,
    justifyContent: 'center',
  },
  webDateShell: {
    borderWidth: 1,
    borderColor: '#D8E2E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  webDateInput: {
    borderWidth: 0,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    fontSize: 15,
    color: '#0F172A',
    width: '100%',
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#D8E2E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  dateHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  dateAction: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '800',
  },
  phoneField: {
    borderWidth: 1,
    borderColor: '#D8E2E8',
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phonePrefix: {
    backgroundColor: '#ECFEFF',
    borderRightWidth: 1,
    borderRightColor: '#CFFAFE',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  phonePrefixText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    marginLeft: 4,
  },
  readOnlyInput: {
    color: '#64748B',
  },
  addressInput: {
    minHeight: 92,
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inlineError: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 4,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 12,
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
