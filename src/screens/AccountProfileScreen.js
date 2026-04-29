import React, { useCallback, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
} from 'firebase/auth';
import { apiEmailChangeRequest, apiEmailChangeVerify, apiSignupSendOtp, apiSignupVerifyOtp } from '../services/backendApi';

import { auth } from '../services/firebase';
import { fetchUserProfile, saveUserProfile } from '../services/userProfileService';
import {
  buildFirebasePasswordCandidates,
  calculateAgeFromDob,
  formatDateISO,
  generateUsername,
  getAdultDobCutoffDate,
  isAdultDob,
  isValidEmail,
  isValidName,
  isValidSriLankanPhone,
  normalizeEmail,
  normalizeSriLankanPhone,
  sanitizeNameInput,
} from '../services/authCredentials';

const DEFAULT_PROFILE_AVATAR = require('../../assets/icon.png');

function profilePhotoStorageKey(uid) {
  return `momera_profile_photo_${uid}`;
}

function buildFormFromProfile(data) {
  const visibleEmail = data?.pendingEmail || data?.email || '';
  return {
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    username: data?.username || '',
    dob: data?.dob || '',
    primaryPhone: data?.primaryPhone || '',
    secondaryPhone: data?.secondaryPhone || '',
    alertWhatsappPhone: data?.alertWhatsappPhone || '',
    email: visibleEmail,
    address: data?.address || '',
    provider: data?.provider || '',
    pendingEmail: data?.pendingEmail || '',
    whatsappAlertsEnabled: !!data?.whatsappAlertsEnabled,
    onboardingCompleted: !!data?.onboardingCompleted,
    onboarding: {
      height: data?.onboarding?.height ? String(data.onboarding.height) : '',
      weight: data?.onboarding?.weight ? String(data.onboarding.weight) : '',
      amhLevel: data?.onboarding?.amhLevel ? String(data.onboarding.amhLevel) : '',
      calculatedVelocity: data?.onboarding?.calculatedVelocity
        ? String(data.onboarding.calculatedVelocity)
        : '',
    },
  };
}

function getDobPickerValue(value) {
  const parsed = new Date(`${String(value || '').trim()}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(1999, 6, 1) : parsed;
}

function InfoPill({ label, active = false, subtle = false }) {
  return (
    <View
      style={[
        styles.infoPill,
        active && styles.infoPillActive,
        subtle && styles.infoPillSubtle,
      ]}
    >
      <Text
        style={[
          styles.infoPillText,
          active && styles.infoPillTextActive,
          subtle && styles.infoPillTextSubtle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionCard({ eyebrow, title, children, rightContent }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {rightContent}
      </View>
      {children}
    </View>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  isEditing,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  helperText,
  editable = true,
}) {
  const displayValue = String(value || '').trim();

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={String(value || '')}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#9AA9B8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={!!multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      ) : (
        <View style={[styles.valueBox, multiline && styles.multilineValueBox]}>
          <Text style={[styles.valueText, !displayValue && styles.valueTextMuted]}>
            {displayValue || 'Not added'}
          </Text>
        </View>
      )}
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

export default function AccountProfileScreen() {
  const navigation = useNavigation();
  const userId = auth?.currentUser?.uid || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [currentSecret, setCurrentSecret] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [phoneOtpValue, setPhoneOtpValue] = useState('');
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [pendingNewPhone, setPendingNewPhone] = useState('');

  const setField = (key, value) => {
    setForm((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const handleDobChange = useCallback((value) => {
    setForm((prev) => ({
      ...(prev || {}),
      dob: value,
      age: calculateAgeFromDob(value),
    }));
  }, []);

  const onDobPickerChange = useCallback((_event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setShowDobPicker(false);
    }

    if (!selectedDate) return;
    handleDobChange(formatDateISO(selectedDate));
  }, [handleDobChange]);

  const loadProfilePhoto = useCallback(async (uid) => {
    if (!uid) {
      setProfilePhotoUri('');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(profilePhotoStorageKey(uid));
      setProfilePhotoUri(String(stored || '').trim());
    } catch {
      setProfilePhotoUri('');
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const data = await fetchUserProfile(auth?.currentUser?.uid, {
        forceRefresh: true,
      });
      const nextForm = buildFormFromProfile(data);
      nextForm.email = normalizeEmail(data?.pendingEmail || data?.email || auth?.currentUser?.email || '');

      setProfile(data);
      setForm(nextForm);
      await loadProfilePhoto(auth?.currentUser?.uid || '');
      setShowDobPicker(false);
      setCurrentSecret('');
      setIsEditing(false);
    } catch (error) {
      setErrorMsg(error?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [loadProfilePhoto]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  React.useEffect(() => {
    if (!form) return;

    const nextUsername = generateUsername(form.email, form.firstName, form.lastName);
    if (nextUsername && nextUsername !== form.username) {
      setForm((prev) => ({
        ...(prev || {}),
        username: nextUsername,
      }));
    }
  }, [form?.email, form?.firstName, form?.lastName]);

  const fullName = useMemo(() => {
    const first = String(form?.firstName || '').trim();
    const last = String(form?.lastName || '').trim();
    return `${first} ${last}`.trim() || 'Your profile';
  }, [form?.firstName, form?.lastName]);

  const avatarSource = useMemo(() => {
    return profilePhotoUri ? { uri: profilePhotoUri } : DEFAULT_PROFILE_AVATAR;
  }, [profilePhotoUri]);

  const authEmail = String(auth?.currentUser?.email || '').trim().toLowerCase();
  const isEmailChanged = useMemo(() => {
    const formEmail = normalizeEmail(form?.email || '');
    return !!formEmail && !!authEmail && formEmail !== authEmail;
  }, [form?.email, authEmail]);

  function onStartEdit() {
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  }

  function onCancelEdit() {
    const resetForm = buildFormFromProfile(profile);
    resetForm.email = normalizeEmail(profile?.pendingEmail || auth?.currentUser?.email || '');
    setForm(resetForm);
    setShowDobPicker(false);
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentSecret('');
    setIsEditing(false);
  }

  async function onPickProfilePhoto() {
    if (!userId) {
      setErrorMsg('User session not found');
      return;
    }

    try {
      setPhotoBusy(true);
      setErrorMsg('');
      setSuccessMsg('');

      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Allow photo library access to choose a profile picture');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const nextUri = String(result.assets[0]?.uri || '').trim();
      if (!nextUri) {
        throw new Error('Selected image could not be loaded');
      }

      await AsyncStorage.setItem(profilePhotoStorageKey(userId), nextUri);
      setProfilePhotoUri(nextUri);
      setSuccessMsg('Profile photo updated.');
    } catch (error) {
      const raw = String(error?.message || 'Failed to update profile photo');
      setErrorMsg(raw.replace(/^Error:\s*/i, ''));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemoveProfilePhoto() {
    if (!userId) {
      setErrorMsg('User session not found');
      return;
    }

    try {
      setPhotoBusy(true);
      setErrorMsg('');
      setSuccessMsg('');
      await AsyncStorage.removeItem(profilePhotoStorageKey(userId));
      setProfilePhotoUri('');
      setSuccessMsg('Profile photo removed.');
    } catch (error) {
      const raw = String(error?.message || 'Failed to remove profile photo');
      setErrorMsg(raw.replace(/^Error:\s*/i, ''));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onSaveProfile() {
    if (!auth?.currentUser || !form) {
      setErrorMsg('User session not found');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const normalizedFirstName = sanitizeNameInput(form.firstName).trim();
      const normalizedLastName = sanitizeNameInput(form.lastName).trim();
      const normalizedDob = String(form.dob || '').trim();
      const normalizedAge = calculateAgeFromDob(normalizedDob);
      const normalizedPrimaryPhone = normalizeSriLankanPhone(form.primaryPhone);
      const normalizedSecondaryPhone = normalizeSriLankanPhone(form.secondaryPhone);
      const normalizedEmail = normalizeEmail(form.email);
      const normalizedUsername = generateUsername(
        normalizedEmail,
        normalizedFirstName,
        normalizedLastName
      );
      const currentAuthEmail = String(auth.currentUser.email || '').trim().toLowerCase();
      const emailChanged = !!normalizedEmail && !!currentAuthEmail && normalizedEmail !== currentAuthEmail;
      const nextDisplayName = `${normalizedFirstName} ${normalizedLastName}`.trim();

      if (!isValidName(normalizedFirstName)) {
        throw new Error('First name should contain letters only');
      }
      if (!isValidName(normalizedLastName)) {
        throw new Error('Last name should contain letters only');
      }
      if (!isAdultDob(normalizedDob)) {
        throw new Error('User must be at least 18 years old');
      }
      if (!isValidSriLankanPhone(normalizedPrimaryPhone)) {
        throw new Error('User mobile phone must be a valid Sri Lankan mobile number');
      }
      if (!isValidSriLankanPhone(normalizedSecondaryPhone)) {
        throw new Error('Guardian mobile must be a valid Sri Lankan mobile number');
      }
      if (normalizedPrimaryPhone === normalizedSecondaryPhone) {
        throw new Error('User mobile phone and guardian mobile must be different');
      }
      if (!isValidEmail(normalizedEmail)) {
        throw new Error('Enter a valid email address');
      }
      if (String(form.address || '').trim().length < 10) {
        throw new Error('Address must be at least 10 characters');
      }

      if (emailChanged) {
        if ((profile?.provider || 'password') !== 'password') {
          throw new Error('Email can only be changed after signing in again with the original provider.');
        }
        if (!String(currentSecret || '').trim()) {
          throw new Error('Enter your current password to change email.');
        }

        const candidates = buildFirebasePasswordCandidates(currentAuthEmail, currentSecret);
        let reauthError = null;
        for (const candidate of candidates) {
          try {
            const credential = EmailAuthProvider.credential(currentAuthEmail, candidate);
            await reauthenticateWithCredential(auth.currentUser, credential);
            reauthError = null;
            break;
          } catch (error) {
            reauthError = error;
          }
        }
        if (reauthError) throw new Error('Current password or PIN is incorrect.');

        await apiEmailChangeRequest({ userId, newEmail: normalizedEmail });
        setPendingNewEmail(normalizedEmail);
        setOtpStep(true);
        setOtpValue('');
        setSuccessMsg(`OTP sent to ${normalizedEmail}. Enter the 4-digit code below.`);
        setSaving(false);
        return;
      }

      const phoneChanged = !!normalizedPrimaryPhone && normalizedPrimaryPhone !== normalizeSriLankanPhone(profile?.primaryPhone || '');
      if (phoneChanged) {
        await apiSignupSendOtp({ phone: normalizedPrimaryPhone });
        setPendingNewPhone(normalizedPrimaryPhone);
        setPhoneOtpStep(true);
        setPhoneOtpValue('');
        setSuccessMsg(`OTP sent to ${normalizedPrimaryPhone}. Enter the 4-digit code below.`);
        setSaving(false);
        return;
      }

      if (nextDisplayName && nextDisplayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: nextDisplayName });
      }

      await saveUserProfile(auth.currentUser, {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        username: normalizedUsername,
        dob: normalizedDob,
        age: normalizedAge,
        primaryPhone: normalizedPrimaryPhone,
        secondaryPhone: normalizedSecondaryPhone,
        alertWhatsappPhone: String(form.alertWhatsappPhone || '').trim(),
        address: String(form.address || '').trim(),
        email: String(auth.currentUser.email || normalizedEmail || '').trim().toLowerCase(),
        pendingEmail: emailChanged ? normalizedEmail : '',
        provider: String(form.provider || '').trim(),
        whatsappAlertsEnabled: !!form.whatsappAlertsEnabled,
        onboardingCompleted: !!form.onboardingCompleted,
        onboarding: {
          height: form.onboarding?.height ? Number(form.onboarding.height) : '',
          weight: form.onboarding?.weight ? Number(form.onboarding.weight) : '',
          amhLevel: form.onboarding?.amhLevel
            ? String(form.onboarding.amhLevel).trim()
            : '',
          calculatedVelocity: form.onboarding?.calculatedVelocity
            ? String(form.onboarding.calculatedVelocity).trim()
            : '',
        },
      });
      setCurrentSecret('');
      setSuccessMsg(
        emailChanged
          ? 'Profile updated. Verify the link sent to your new email to finish changing the login email.'
          : 'Profile updated successfully.'
      );
      await loadProfile();
    } catch (error) {
      const raw = String(error?.message || 'Failed to save profile');
      setErrorMsg(raw.replace(/^Error:\s*/i, ''));
    } finally {
      setSaving(false);
    }
  }

  async function onVerifyOtp() {
    if (!userId || !pendingNewEmail) return;
    if (otpValue.length !== 4) {
      setErrorMsg('Enter the 4-digit code sent to your new email.');
      return;
    }
    try {
      setOtpVerifying(true);
      setErrorMsg('');
      await apiEmailChangeVerify({ userId, newEmail: pendingNewEmail, otp: otpValue });
      setOtpStep(false);
      setOtpValue('');
      setPendingNewEmail('');
      setCurrentSecret('');
      setSuccessMsg('Email updated successfully.');
      await loadProfile();
    } catch (error) {
      setErrorMsg(String(error?.message || 'Invalid or expired code. Try again.').replace(/^Error:\s*/i, ''));
    } finally {
      setOtpVerifying(false);
    }
  }

  async function onVerifyPhoneOtp() {
    if (!pendingNewPhone) return;
    if (phoneOtpValue.length !== 4) {
      setErrorMsg('Enter the 4-digit code sent to your mobile.');
      return;
    }
    try {
      setPhoneOtpVerifying(true);
      setErrorMsg('');
      await apiSignupVerifyOtp({ phone: pendingNewPhone, otp: phoneOtpValue });

      const normalizedFirstName = sanitizeNameInput(form.firstName).trim();
      const normalizedLastName = sanitizeNameInput(form.lastName).trim();
      const normalizedDob = String(form.dob || '').trim();
      const normalizedAge = calculateAgeFromDob(normalizedDob);
      const normalizedEmail = normalizeEmail(form.email);
      const normalizedUsername = generateUsername(normalizedEmail, normalizedFirstName, normalizedLastName);
      const nextDisplayName = `${normalizedFirstName} ${normalizedLastName}`.trim();

      if (nextDisplayName && nextDisplayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: nextDisplayName });
      }
      await saveUserProfile(auth.currentUser, {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        username: normalizedUsername,
        dob: normalizedDob,
        age: normalizedAge,
        primaryPhone: pendingNewPhone,
        secondaryPhone: normalizeSriLankanPhone(form.secondaryPhone),
        alertWhatsappPhone: String(form.alertWhatsappPhone || '').trim(),
        address: String(form.address || '').trim(),
        email: String(auth.currentUser.email || normalizedEmail || '').trim().toLowerCase(),
        pendingEmail: '',
        provider: String(form.provider || '').trim(),
        whatsappAlertsEnabled: !!form.whatsappAlertsEnabled,
        onboardingCompleted: !!form.onboardingCompleted,
        onboarding: {
          height: form.onboarding?.height ? Number(form.onboarding.height) : '',
          weight: form.onboarding?.weight ? Number(form.onboarding.weight) : '',
          amhLevel: form.onboarding?.amhLevel ? String(form.onboarding.amhLevel).trim() : '',
          calculatedVelocity: form.onboarding?.calculatedVelocity ? String(form.onboarding.calculatedVelocity).trim() : '',
        },
      });
      setPhoneOtpStep(false);
      setPhoneOtpValue('');
      setPendingNewPhone('');
      setCurrentSecret('');
      setSuccessMsg('Mobile number updated successfully.');
      await loadProfile();
    } catch (error) {
      setErrorMsg(String(error?.message || 'Invalid or expired code. Try again.').replace(/^Error:\s*/i, ''));
    } finally {
      setPhoneOtpVerifying(false);
    }
  }

  if (phoneOtpStep) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, { justifyContent: 'center', flexGrow: 1 }]}>
          <View style={[styles.sectionCard, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Verify Mobile Number</Text>
            <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
              Enter the 4-digit code sent to{'\n'}
              <Text style={{ fontWeight: '800', color: '#0D9488' }}>{pendingNewPhone}</Text>
            </Text>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

            <TextInput
              style={[styles.input, { fontSize: 28, fontWeight: '800', letterSpacing: 16, textAlign: 'center' }]}
              value={phoneOtpValue}
              onChangeText={(v) => setPhoneOtpValue(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.stickyBtnPrimary, { marginTop: 16, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: phoneOtpVerifying ? 0.7 : 1 }]}
              onPress={onVerifyPhoneOtp}
              disabled={phoneOtpVerifying}
              activeOpacity={0.85}
            >
              <Text style={styles.stickyBtnPrimaryText}>{phoneOtpVerifying ? 'Verifying...' : 'Verify Code'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => { setPhoneOtpStep(false); setPhoneOtpValue(''); setErrorMsg(''); setSuccessMsg(''); }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#64748B', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (otpStep) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, { justifyContent: 'center', flexGrow: 1 }]}>
          <View style={[styles.sectionCard, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Verify New Email</Text>
            <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
              Enter the 4-digit code sent to{'\n'}
              <Text style={{ fontWeight: '800', color: '#0D9488' }}>{pendingNewEmail}</Text>
            </Text>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

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
              style={[styles.stickyBtnPrimary, { marginTop: 16, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: otpVerifying ? 0.7 : 1 }]}
              onPress={onVerifyOtp}
              disabled={otpVerifying}
              activeOpacity={0.85}
            >
              <Text style={styles.stickyBtnPrimaryText}>{otpVerifying ? 'Verifying...' : 'Verify Code'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => { setOtpStep(false); setOtpValue(''); setErrorMsg(''); setSuccessMsg(''); }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#64748B', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isEditing && styles.contentEditing,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.back}>{"← Back"}</Text>
          </TouchableOpacity>

          {!loading && form ? (
            <TouchableOpacity
              onPress={isEditing ? onCancelEdit : onStartEdit}
              activeOpacity={0.85}
            >
              <Text style={styles.editTopAction}>{isEditing ? 'Close' : 'Edit'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading || !form ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0D9488" />
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <LinearGradient
                colors={['#146F6B', '#178E88', '#167A75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradientBg}
              />
              <View style={styles.heroAvatarWrap}>
                <View style={styles.heroAvatar}>
                  <Image source={avatarSource} style={styles.heroAvatarImage} />
                </View>
                <TouchableOpacity
                  style={[styles.heroAvatarEditBtn, photoBusy && styles.disabledBtn]}
                  onPress={onPickProfilePhoto}
                  activeOpacity={0.85}
                  disabled={photoBusy}
                >
                  <Text style={styles.heroAvatarEditText}>
                    {photoBusy ? '...' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroBody}>
                <Text style={styles.heroTitle}>{fullName}</Text>
                <Text style={styles.heroSubTitle}>Personal details and contact information</Text>
                {profilePhotoUri ? (
                  <TouchableOpacity
                    onPress={onRemoveProfilePhoto}
                    activeOpacity={0.85}
                    disabled={photoBusy}
                  >
                    <Text style={styles.heroRemovePhotoText}>Remove photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

            <SectionCard
              eyebrow="Personal"
              rightContent={!isEditing ? <InfoPill label="Read only" subtle /> : null}
            >
              <ProfileField
                label="First name"
                value={form.firstName}
                onChangeText={(value) => setField('firstName', sanitizeNameInput(value))}
                isEditing={isEditing}
                placeholder="Enter first name"
              />
              <ProfileField
                label="Last name"
                value={form.lastName}
                onChangeText={(value) => setField('lastName', sanitizeNameInput(value))}
                isEditing={isEditing}
                placeholder="Enter last name"
              />
              <ProfileField
                label="Username"
                value={form.username}
                onChangeText={(value) => setField('username', value)}
                isEditing={isEditing}
                placeholder="Username"
                autoCapitalize="none"
                editable={false}
                helperText="Username updates automatically from first name and last name."
              />
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Date of birth</Text>
                {isEditing ? (
                  Platform.OS === 'web' ? (
                    <View style={styles.webDateInputWrap}>
                      <input
                        type="date"
                        value={String(form.dob || '')}
                        onChange={(event) => handleDobChange(event.target.value)}
                        max={formatDateISO(getAdultDobCutoffDate())}
                        style={{
                          width: '100%',
                          border: '1px solid #D9E4EC',
                          borderRadius: 18,
                          padding: '14px 16px',
                          fontSize: 15,
                          color: '#102437',
                          backgroundColor: '#F8FBFD',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setShowDobPicker(true)}
                    >
                      <View pointerEvents="none" style={styles.iconInputWrap}>
                        <TextInput
                          style={[styles.input, styles.iconInput]}
                          value={String(form.dob || '')}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#9AA9B8"
                          editable={false}
                        />
                        <View style={styles.calendarIconBox}>
                          <Text style={styles.calendarIconText}>Pick</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.valueBox}>
                    <Text style={[styles.valueText, !form.dob && styles.valueTextMuted]}>
                      {String(form.dob || '').trim() || 'Not added'}
                    </Text>
                  </View>
                )}
                {isEditing && Platform.OS !== 'web' ? (
                  <Text style={styles.helperText}>
                    Choose a date on or before {formatDateISO(getAdultDobCutoffDate())}.
                  </Text>
                ) : null}
              </View>
            </SectionCard>

            <SectionCard eyebrow="Contact">
              <ProfileField
                label="User Mobile No "
                value={form.primaryPhone}
                onChangeText={(value) =>
                  setField('primaryPhone', normalizeSriLankanPhone(value))
                }
                isEditing={isEditing}
                placeholder="+94..."
                keyboardType="phone-pad"
              />

              <ProfileField
                label="Guardian Mobile No "
                value={form.secondaryPhone}
                onChangeText={(value) =>
                  setField('secondaryPhone', normalizeSriLankanPhone(value))
                }
                isEditing={isEditing}
                placeholder="+94..."
                keyboardType="phone-pad"
              />

              <ProfileField
                label="Email"
                value={form.email}
                onChangeText={(value) => setField('email', normalizeEmail(value))}
                isEditing={isEditing}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                helperText={
                  !isEditing && profile?.pendingEmail
                    ? 'Verification pending for this new email address.'
                    : ''
                }
              />

              {isEditing && isEmailChanged ? (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Current password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentSecret}
                    onChangeText={setCurrentSecret}
                    placeholder="Enter your current password"
                    placeholderTextColor="#9AA9B8"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>
                    Needed to re-authenticate before changing the login email.
                  </Text>
                </View>
              ) : null}

              <ProfileField
                label="Address"
                value={form.address}
                onChangeText={(value) => setField('address', value)}
                isEditing={isEditing}
                placeholder="Enter address"
                multiline
              />
            </SectionCard>

          </>
        )}
      </ScrollView>

      {showDobPicker && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={getDobPickerValue(form?.dob)}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
          maximumDate={getAdultDobCutoffDate()}
          onChange={onDobPickerChange}
        />
      ) : null}

      {isEditing && form ? (
        <View style={styles.stickyBar}>
          <TouchableOpacity
            style={[styles.stickyBtn, styles.stickyBtnGhost]}
            activeOpacity={0.85}
            onPress={onCancelEdit}
            disabled={saving}
          >
            <Text style={styles.stickyBtnGhostText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stickyBtn, styles.stickyBtnPrimary, saving && styles.disabledBtn]}
            activeOpacity={0.85}
            onPress={onSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.stickyBtnPrimaryText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F8FB',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  contentEditing: {
    paddingBottom: 124,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  back: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  backBtn: {
    backgroundColor: '#178E88',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editTopAction: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  center: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  hero: {
    backgroundColor: '#178E88',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroAvatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  heroAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  heroAvatarEditBtn: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D8E2E8',
  },
  heroAvatarEditText: {
    color: '#146F6B',
    fontSize: 11,
    fontWeight: '800',
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubTitle: {
    color: '#DFF7F5',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  heroRemovePhotoText: {
    color: '#FDECEC',
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  infoPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginRight: 8,
    marginBottom: 8,
  },
  infoPillActive: {
    backgroundColor: '#FFFFFF',
  },
  infoPillSubtle: {
    backgroundColor: '#EAF2F7',
  },
  infoPillText: {
    color: '#DFF7F5',
    fontSize: 12,
    fontWeight: '700',
  },
  infoPillTextActive: {
    color: '#0D9488',
  },
  infoPillTextSubtle: {
    color: '#5B7088',
  },
  error: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  success: {
    color: '#027A48',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: '#7B8BA0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 4,
    color: '#102437',
    fontSize: 18,
    fontWeight: '800',
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#63758B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E4EC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#102437',
    backgroundColor: '#F8FBFD',
  },
  iconInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  webDateInputWrap: {
    width: '100%',
  },
  iconInput: {
    paddingRight: 72,
  },
  calendarIconBox: {
    position: 'absolute',
    right: 12,
    top: 10,
    bottom: 10,
    minWidth: 44,
    borderRadius: 12,
    backgroundColor: '#E6FFFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B8EFE6',
  },
  calendarIconText: {
    color: '#0D9488',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  valueBox: {
    borderWidth: 1,
    borderColor: '#E4ECF2',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FBFD',
  },
  valueText: {
    color: '#102437',
    fontSize: 15,
    lineHeight: 22,
  },
  valueTextMuted: {
    color: '#94A3B8',
  },
  multilineInput: {
    minHeight: 96,
  },
  multilineValueBox: {
    minHeight: 96,
  },
  helperText: {
    marginTop: 6,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  inlineActionDanger: {
    backgroundColor: '#FFF1F2',
  },
  inlineActionText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineActionTextDanger: {
    color: '#BE123C',
  },
  stickyBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
    flexDirection: 'row',
  },
  stickyBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBtnGhost: {
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  stickyBtnPrimary: {
    backgroundColor: '#0D9488',
  },
  stickyBtnGhostText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  stickyBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
