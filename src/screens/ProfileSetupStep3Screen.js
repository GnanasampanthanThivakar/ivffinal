import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const CheckBox = ({ checked, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={[styles.checkbox, checked && styles.checkboxChecked]}
        activeOpacity={0.7}
    >
        {checked && <Text style={{color: '#FFF', fontSize: 12, fontWeight: '800'}}>✓</Text>}
    </TouchableOpacity>
);

export default function ProfileSetupStep3Screen({ navigation, route }) {
  const params = route.params || {};

  const heightM = (parseFloat(params.height) || 0) / 100;
  const weightKg = parseFloat(params.weight) || 0;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : 'N/A';

  const [consent, setConsent] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = () => {
      if (!consent) return;
      setCalculating(true);
      navigation.navigate('Loading', { ...params, bmi });
      setTimeout(() => setCalculating(false), 500);
  };

  const InfoRow = ({ label, value }) => (
      <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
      </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D9488', '#0F766E']}
        style={styles.headerPanel}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { width: '100%' }]} />
                </View>
                <Text style={styles.stepText}>Step 3 of 3</Text>
            </View>
            <Text style={styles.headerTitle}>Review & Confirm</Text>
            <Text style={styles.headerSubtitle}>Verify your data before analysis</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
            <View style={styles.introIconBox}>
                <Text style={styles.introIcon}>🏁</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>Final Check</Text>
                <Text style={styles.introText}>Review the details below. Our AI will use this data to generate its findings.</Text>
            </View>
        </View>

        <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, {backgroundColor: '#F0FDFA'}]}>
                    <Text style={{fontSize: 18}}>👤</Text>
                </View>
                <Text style={styles.cardTitle}>Personal Profile</Text>
            </View>
            <View style={styles.divider} />
            <InfoRow label="Name" value={params.name || '-'} />
            <InfoRow label="Age" value={params.age ? `${params.age} years` : '-'} />
            <InfoRow label="BMI Index" value={bmi} />
        </View>

        <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
                 <View style={[styles.cardIconCircle, {backgroundColor: '#F5F3FF'}]}>
                    <Text style={{fontSize: 18}}>🏥</Text>
                </View>
                <Text style={styles.cardTitle}>Clinical Data</Text>
            </View>
             <View style={styles.divider} />
            <InfoRow label="AMH Level" value={params.amhLevel ? `${params.amhLevel} ng/mL` : '-'} />
            <InfoRow label="Prior SAB" value={params.priorSAB || '0'} />
            <InfoRow label="D3 Cell Count" value={params.freshD3CellCount || '-'} />
            <InfoRow label="D3 Fragmentation" value={params.freshD3Fragmentation ? `${params.freshD3Fragmentation}%` : '-'} />
            <InfoRow label="Hormonal Velocity" value={params.calculatedVelocity || '-'} />
            <InfoRow label="Previous IVF" value={params.previousIVF ? 'Yes' : 'No'} />
        </View>

        <View style={styles.privacyBox}>
            <Text style={styles.privacyIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Security Protocol</Text>
                <Text style={styles.privacyText}>
                    Your data is high-level encrypted and used strictly for personal health simulation.
                </Text>
            </View>
        </View>

        <TouchableOpacity 
            style={styles.consentRow} 
            onPress={() => setConsent(!consent)}
            activeOpacity={0.8}
        >
            <CheckBox checked={consent} onPress={() => setConsent(!consent)} />
            <Text style={styles.consentText}>
                I certify that the information provided is accurate to the best of my knowledge.
            </Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.nextButton, !consent && styles.buttonDisabled]} 
            onPress={handleCalculate}
            disabled={!consent}
            activeOpacity={0.9}
        >
            <LinearGradient
              colors={consent ? ['#0D9488', '#14B8A6'] : ['#94A3B8', '#64748B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
                {calculating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        <Text style={styles.nextButtonText}>Generate Analysis</Text>
                        <Text style={styles.buttonArrow}>→</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>

        <View style={{height: 60}} /> 
      </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
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
    fontSize: 22,
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  cardTitle: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans_700Bold',
      color: '#1E293B',
  },
  divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
      marginBottom: 16,
  },
  infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  infoLabel: {
      color: '#64748B',
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  infoValue: {
      color: '#0F172A',
      fontSize: 14,
      fontFamily: 'PlusJakartaSans_700Bold',
      textAlign: 'right',
  },
  privacyBox: {
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  consentRow: {
      flexDirection: 'row',
      marginBottom: 36,
      paddingHorizontal: 4,
      alignItems: 'center',
  },
  checkbox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#E2E8F0',
      marginRight: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
  },
  consentText: {
      flex: 1,
      fontSize: 14,
      color: '#334155',
      fontFamily: 'PlusJakartaSans_500Medium',
      lineHeight: 20,
  },
  nextButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
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
