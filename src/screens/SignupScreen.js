import React, { useEffect, useState, useRef } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
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
  const otpInputRef = useRef(null);

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
      <View style={styles.container}>
        <LinearGradient colors={['#0D9488', '#0F766E']} style={[styles.headerPanel, { paddingBottom: 40 }]}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setOtpStep(false); setOtpValue(''); setErrorMsg(''); }}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 32 }}>🔐</Text>
                </View>
                <Text style={[styles.headerTitle, { textAlign: 'center' }]}>Verify Your Number</Text>
                <Text style={[styles.headerSubtitle, { textAlign: 'center', marginTop: 6 }]}>We sent a 4-digit code to</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', marginTop: 4 }}>{verifiedPhone}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1, alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.glassCard, { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, marginTop: -20, width: '100%', maxWidth: 400 }]}>
            {!!errorMsg && (<View style={[styles.errorBox, { width: '100%', marginBottom: 20 }]}><Ionicons name="alert-circle" size={16} color="#DC2626" /><Text style={styles.errorBoxText}>{errorMsg}</Text></View>)}
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#475569', marginBottom: 20 }}>Enter verification code</Text>
            <Pressable onPress={() => otpInputRef.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: 56, height: 64, borderRadius: 16, borderWidth: 2, borderColor: otpValue[i] ? '#0D9488' : '#E2E8F0', backgroundColor: otpValue[i] ? '#F0FDFA' : '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', color: otpValue[i] ? '#0D9488' : '#CBD5E1' }}>{otpValue[i] || '·'}</Text>
                </View>
              ))}
            </Pressable>
            <TextInput ref={otpInputRef} style={{ position: 'absolute', opacity: 0, width: '100%', height: 80 }} value={otpValue} onChangeText={(v) => setOtpValue(v.replace(/\D/g, '').slice(0, 4))} keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'} maxLength={4} autoFocus />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}><Text style={{ fontSize: 16 }}>🛡️</Text></View>
              <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'PlusJakartaSans_400Regular', flex: 1 }}>Your data is encrypted and protected</Text>
            </View>
            <TouchableOpacity style={[styles.nextButton, { width: '100%' }, otpVerifying && { opacity: 0.7 }]} onPress={onVerifyAndCreate} disabled={otpVerifying} activeOpacity={0.9}>
              <LinearGradient colors={['#0D9488', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                {otpVerifying ? <ActivityIndicator color="#FFFFFF" /> : (<><Text style={styles.nextButtonText}>Verify & Create Account</Text><Text style={styles.buttonArrow}>→</Text></>)}
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={onSendOtp} activeOpacity={0.7}><Text style={{ fontSize: 13, color: '#0D9488', fontFamily: 'PlusJakartaSans_700Bold' }}>Resend</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={() => { setOtpStep(false); setOtpValue(''); setErrorMsg(''); }} activeOpacity={0.8}>
            <Text style={{ color: '#64748B', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>← Back to form</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D9488', '#0F766E']} style={styles.headerPanel}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}><Text style={{ fontSize: 22 }}>🌱</Text></View>
              <Text style={styles.brandName}>Momera</Text>
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your personalized IVF journey</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.introBox}>
            <View style={styles.introIconBox}><Text style={styles.introIcon}>🌸</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Join Momera</Text>
              <Text style={styles.introText}>Set up your account to access personalized wellness insights.</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderBox}><Text style={styles.sectionHeader}>Personal Info</Text><View style={styles.sectionLine} /></View>
          <View style={styles.glassCard}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your first name" placeholderTextColor="#94A3B8" value={firstName} onChangeText={(v) => setFirstName(sanitizeNameInput(v))} /></View>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Enter your last name" placeholderTextColor="#94A3B8" value={lastName} onChangeText={(v) => setLastName(sanitizeNameInput(v))} /></View>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}><TextInput style={styles.input} placeholder="Choose a username" placeholderTextColor="#94A3B8" autoCapitalize="none" value={username} onChangeText={(v) => { setUsernameTouched(true); setUsername(v); }} /></View>
            <Text style={styles.label}>Date of Birth</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.inputWrapper}><input type="date" value={dob} onChange={(e) => onDobChange(e.target.value)} max={formatDateISO(getAdultDobCutoffDate())} style={{ border: 0, outline: 'none', backgroundColor: 'transparent', fontSize: 15, color: '#0F172A', width: '100%', padding: '14px 16px' }} /></View>
            ) : (
              <Pressable style={styles.dateField} onPress={() => setShowDobPicker(true)}>
                <Text style={styles.dateValue}>{dob || 'Pick your date of birth'}</Text>
                <Text style={{ color: '#0D9488', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>Select</Text>
              </Pressable>
            )}
            {Platform.OS !== 'web' && showDobPicker && (<DateTimePicker value={dob ? new Date(`${dob}T00:00:00`) : new Date(1999, 6, 1)} mode="date" display={Platform.OS === 'android' ? 'calendar' : 'spinner'} maximumDate={getAdultDobCutoffDate()} onChange={onDobPickerChange} />)}
            <Text style={styles.label}>Age</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#F1F5F9' }]}><TextInput style={[styles.input, { color: '#64748B' }]} placeholder="Calculated from DOB" placeholderTextColor="#94A3B8" value={age} editable={false} /></View>
          </View>

          <View style={styles.sectionHeaderBox}><Text style={styles.sectionHeader}>Contact Details</Text><View style={styles.sectionLine} /></View>
          <View style={styles.glassCard}>
            <Text style={styles.label}>User Mobile Phone</Text>
            <View style={styles.phoneField}>
              <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>SL</Text></View>
              <TextInput style={styles.phoneInput} placeholder="77XXXXXXX or 07XXXXXXXX" placeholderTextColor="#94A3B8" keyboardType={Platform.OS === 'web' ? 'default' : 'phone-pad'} value={primaryPhone} onChangeText={setPrimaryPhone} onBlur={() => setPrimaryPhone(normalizeSriLankanPhone(primaryPhone))} />
            </View>
            <Text style={styles.helperText}>OTP will be sent to this number to verify your account.</Text>
            <Text style={styles.label}>Guardian Mobile</Text>
            <View style={styles.phoneField}>
              <View style={styles.phonePrefix}><Text style={styles.phonePrefixText}>SL</Text></View>
              <TextInput style={styles.phoneInput} placeholder="77XXXXXXX or 07XXXXXXXX" placeholderTextColor="#94A3B8" keyboardType={Platform.OS === 'web' ? 'default' : 'phone-pad'} value={secondaryPhone} onChangeText={setSecondaryPhone} onBlur={() => setSecondaryPhone(normalizeSriLankanPhone(secondaryPhone))} />
            </View>
            <Text style={styles.helperText}>We will notify this number when stress is high.</Text>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailError ? { borderColor: '#EF4444' } : null]}><TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="#94A3B8" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={handleEmailChange} /></View>
            {!!emailError && <Text style={styles.inlineError}>{emailError}</Text>}
          </View>

          <View style={styles.sectionHeaderBox}><Text style={styles.sectionHeader}>Security</Text><View style={styles.sectionLine} /></View>
          <View style={styles.glassCard}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Create a secure password" placeholderTextColor="#94A3B8" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setShowPassword((p) => !p)} activeOpacity={0.8}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" /></TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Use at least 8 characters with uppercase, lowercase, number, and symbol.</Text>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputWrapper}><TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Your address" placeholderTextColor="#94A3B8" multiline value={address} onChangeText={setAddress} /></View>
          </View>

          {!!errorMsg && (<View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color="#DC2626" /><Text style={styles.errorBoxText}>{errorMsg}</Text></View>)}

          <TouchableOpacity style={[styles.nextButton, otpSending && { opacity: 0.7 }]} onPress={onSendOtp} activeOpacity={0.9} disabled={otpSending}>
            <LinearGradient colors={['#0D9488', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              {otpSending ? <ActivityIndicator color="#FFFFFF" /> : (<><Text style={styles.nextButtonText}>Sign Up</Text><Text style={styles.buttonArrow}>→</Text></>)}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 18 }} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#64748B' }}>Already have an account? <Text style={{ color: '#0F766E', fontFamily: 'PlusJakartaSans_700Bold' }}>Login</Text></Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerPanel: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...theme.shadows.premium },
  headerContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 10 : 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandName: { color: '#FFF', fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.3, opacity: 0.95 },
  headerTitle: { color: '#FFF', fontSize: 26, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  backBtnText: { color: '#FFF', fontSize: 18, fontWeight: '300' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  introBox: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', ...theme.shadows.soft },
  introIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  introIcon: { fontSize: 24 },
  introTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: theme.colors.text, marginBottom: 2 },
  introText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: theme.colors.textLight, lineHeight: 18 },
  sectionHeaderBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionHeader: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 12 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  glassCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', ...theme.shadows.soft },
  label: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#475569', marginBottom: 8, marginLeft: 2 },
  inputWrapper: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#F1F5F9', marginBottom: 16, overflow: 'hidden' },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.text, fontFamily: 'PlusJakartaSans_500Medium' },
  dateField: { borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateValue: { color: '#0F172A', fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium' },
  phoneField: { borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 14, marginBottom: 8, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  phonePrefix: { backgroundColor: '#F0FDFA', borderRightWidth: 1, borderRightColor: '#CCFBF1', paddingHorizontal: 14, paddingVertical: 14 },
  phonePrefixText: { color: '#0F766E', fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#0F172A', fontFamily: 'PlusJakartaSans_500Medium' },
  helperText: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 16, marginLeft: 4, fontStyle: 'italic' },
  inlineError: { color: '#DC2626', fontSize: 12, marginTop: -10, marginBottom: 14, marginLeft: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorBoxText: { color: '#DC2626', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginLeft: 8, flex: 1 },
  otpInput: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#F1F5F9', paddingVertical: 16, fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 16, textAlign: 'center', color: theme.colors.text, marginBottom: 20 },
  nextButton: { borderRadius: 20, overflow: 'hidden', marginBottom: 8, ...theme.shadows.medium },
  gradientButton: { paddingVertical: 18, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { color: '#FFF', fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', marginRight: 8 },
  buttonArrow: { color: '#FFF', fontSize: 20, fontWeight: '300' },
});

