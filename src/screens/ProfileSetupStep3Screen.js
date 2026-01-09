import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { theme } from '../theme';

// Simple check icon component or placeholder
const CheckBox = ({ checked, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={{color: '#FFF', fontSize: 10}}>✓</Text>}
    </TouchableOpacity>
);

export default function ProfileSetupStep3Screen({ navigation, route }) {
  const params = route.params || {};

  // Calculate BMI
  const heightM = (parseFloat(params.height) || 0) / 100;
  const weightKg = parseFloat(params.weight) || 0;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : 'N/A';

  const [consent, setConsent] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = () => {
      if (!consent) {
          alert("Please confirm the information is accurate.");
          return;
      }
      setCalculating(true);
      // Navigate immediately to Loading Screen, passing the params
      navigation.navigate('Loading', { ...params, bmi });
      setCalculating(false); // Reset state just in case we come back
  };

  const InfoRow = ({ label, value }) => (
      <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '100%' }]} />
         </View>
         <Text style={styles.stepIndicator}>Step 3 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Confirm Your Details</Text>
        <Text style={styles.subtitle}>Review your information before we calculate your personalized prediction.</Text>

        {/* Personal Information Card */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, {backgroundColor: '#E0F2F1'}]}>
                    <Text>👤</Text>
                </View>
                <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <View style={styles.divider} />
            <InfoRow label="Name" value={params.name || '-'} />
            <InfoRow label="Age" value={params.age ? `${params.age} years` : '-'} />
            <InfoRow label="BMI" value={bmi} />
        </View>

        {/* Medical Profile Card */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                 <View style={[styles.cardIconCircle, {backgroundColor: '#F3E5F5'}]}>
                    <Text>🏥</Text>
                </View>
                <Text style={styles.cardTitle}>Medical Profile</Text>
            </View>
             <View style={styles.divider} />
            <InfoRow label="AMH Level" value={params.amhLevel ? `${params.amhLevel} ng/mL` : '-'} />

            <InfoRow label="Prior SAB" value={params.priorSAB || '0'} />
            <InfoRow label="D3 Cell Count" value={params.freshD3CellCount || '-'} />
            <InfoRow label="D3 Fragmentation" value={params.freshD3Fragmentation ? `${params.freshD3Fragmentation}%` : '-'} />
            <InfoRow label="Hormonal Velocity" value={params.calculatedVelocity || '-'} />
            <InfoRow label="Previous IVF" value={params.previousIVF ? 'Yes' : 'No'} />
        </View>

        {/* Privacy Box */}
        <View style={styles.privacyBox}>
            <Text style={{fontSize: 24, marginRight: 16}}>🛡️</Text>
            <Text style={styles.privacyText}>
                Your data is secure and encrypted. It will only be used to generate your personalized prediction.
            </Text>
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity 
            style={styles.consentRow} 
            onPress={() => setConsent(!consent)}
            activeOpacity={0.8}
        >
            <CheckBox checked={consent} onPress={() => setConsent(!consent)} />
            <Text style={styles.consentText}>
                I confirm the information is accurate and consent to its use for prediction and personalized recommendations.
            </Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.nextButton, { backgroundColor: consent ? theme.colors.primary : '#B2B2B2' }]} // Grey if disabled
                onPress={handleCalculate}
                disabled={!consent}
                activeOpacity={0.8}
            >
                 {calculating ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.nextButtonText}>Calculate</Text>
                )}
            </TouchableOpacity>
        </View>
        <View style={{height: 40}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  progressBarContainer: {
      height: 6,
      backgroundColor: theme.colors.progressBarBackground,
      borderRadius: 3,
      marginBottom: 8,
      overflow: 'hidden',
  },
  progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
  },
  stepIndicator: {
      ...theme.typography.label,
      color: theme.colors.textLight,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.l,
  },
  title: {
    ...theme.typography.heading,
    marginBottom: 4,
  },
  subtitle: {
    ...theme.typography.subheading,
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.l,
  },
  card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.l,
      ...theme.shadows.soft,
  },
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  cardIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
  },
  cardTitle: {
      ...theme.typography.label,
      fontSize: 16,
      marginBottom: 0,
  },
  divider: {
      height: 1,
      backgroundColor: theme.colors.inputBorder,
      marginBottom: 16,
  },
  infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
  },
  infoLabel: {
      color: theme.colors.textLight,
      fontSize: 14,
      fontWeight: '500',
  },
  infoValue: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
  },
  privacyBox: {
      backgroundColor: '#E3F2FD', // Light Blue
      padding: theme.spacing.l,
      borderRadius: theme.borderRadius.l,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.l,
      borderWidth: 1,
      borderColor: '#BBDEFB',
  },
  privacyText: {
      flex: 1,
      fontSize: 13,
      color: '#0D47A1',
      lineHeight: 18,
  },
  consentRow: {
      flexDirection: 'row',
      marginBottom: 32,
      paddingHorizontal: 4,
      alignItems: 'flex-start',
  },
  checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.textLight,
      marginRight: 12,
      marginTop: 2,
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
      color: theme.colors.text,
      lineHeight: 20,
  },
  buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 40,
  },
  backButton: {
      width: 80,
      marginRight: 12,
      paddingVertical: 16,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.surface,
  },
  backButtonText: {
      ...theme.typography.button,
      color: theme.colors.text,
  },
  nextButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      ...theme.shadows.medium,
  },
  nextButtonText: {
    ...theme.typography.button,
  },
});
