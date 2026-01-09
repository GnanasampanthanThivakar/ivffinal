import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Switch
} from 'react-native';
import { theme } from '../theme';

export default function ProfileSetupStep2Screen({ navigation, route }) {
  // Get data from Step 1
  const step1Data = route.params || {};

  const [amhLevel, setAmhLevel] = useState('');


  const [previousIVF, setPreviousIVF] = useState(false);
  const [eggsRetrieved, setEggsRetrieved] = useState('');

  // New Clinical Data State
  const [priorSAB, setPriorSAB] = useState('');
  const [freshD3CellCount, setFreshD3CellCount] = useState('');
  const [freshD3Fragmentation, setFreshD3Fragmentation] = useState(''); // percent

  // Hormone Velocity Calculator State
  const [day2E2, setDay2E2] = useState('');
  const [triggerDayE2, setTriggerDayE2] = useState('');
  const [stimulationDays, setStimulationDays] = useState('');
  const [calculatedVelocity, setCalculatedVelocity] = useState('0.00');

  // Calculate Velocity automatically
  React.useEffect(() => {
    const d2 = parseFloat(day2E2);
    const trig = parseFloat(triggerDayE2);
    const days = parseFloat(stimulationDays);

    if (!isNaN(d2) && !isNaN(trig) && !isNaN(days) && days > 0) {
        const velocity = (trig - d2) / days;
        setCalculatedVelocity(velocity.toFixed(2));
    } else {
        setCalculatedVelocity('0.00');
    }
  }, [day2E2, triggerDayE2, stimulationDays]);

  const handleNext = () => {
    navigation.navigate('ProfileSetupStep3', {
        ...step1Data,
        amhLevel,


        previousIVF,
        eggsRetrieved,
        priorSAB,
        freshD3CellCount,
        freshD3Fragmentation,
        calculatedVelocity
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '66%' }]} />
         </View>
         <Text style={styles.stepIndicator}>Step 2 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
                <Text style={{fontSize: 24}}>📄</Text> 
            </View>
            <View>
                <Text style={styles.title}>Medical Profile</Text>
                <Text style={styles.subtitle}>Share your medical information for accurate prediction.</Text>
            </View>
        </View>

        <View style={styles.formContainer}>
            {/* AMH Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Anti-Müllerian Hormone (AMH) Level (ng/mL)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex. 5.5" 
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={amhLevel}
                onChangeText={setAmhLevel}
              />
              <Text style={styles.helperText}>Your doctor can provide this value.</Text>
            </View>




        </View>

        {/* --- Clinical Data Section --- */}
        <Text style={styles.sectionHeader}>Clinical Data</Text>
        <View style={styles.formContainer}>
            <View style={styles.row}>
                 <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Prior SAB</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="0" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={priorSAB}
                        onChangeText={setPriorSAB}
                    />
                 </View>
                 <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>D3 Cell Count</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="8" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={freshD3CellCount}
                        onChangeText={setFreshD3CellCount}
                    />
                 </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fresh D3 Fragmentation (%)</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="0 - 100" 
                    placeholderTextColor="#A0A0A0"
                    keyboardType="numeric"
                    value={freshD3Fragmentation}
                    onChangeText={setFreshD3Fragmentation}
                />
            </View>
        </View>

        {/* --- Hormone Velocity Calculator --- */}
        <Text style={styles.sectionHeader}>Hormone Velocity Calculator</Text>
        <View style={styles.formContainer}>
            <Text style={styles.helperText}>Enter E2 values to calculate velocity automatically.</Text>
            
            <View style={[styles.row, {marginTop: 12}]}>
                 <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Day 2 E2</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex. 40" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={day2E2}
                        onChangeText={setDay2E2}
                    />
                 </View>
                 <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>Trigger E2</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex. 2000" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={triggerDayE2}
                        onChangeText={setTriggerDayE2}
                    />
                 </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Stim. Days</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="10" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={stimulationDays}
                        onChangeText={setStimulationDays}
                    />
                 </View>
                 <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>Velocity</Text>
                    <View style={[styles.input, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9', justifyContent: 'center' }]}>
                        <Text style={{color: '#2E7D32', fontWeight: 'bold'}}>{calculatedVelocity}</Text>
                    </View>
                 </View>
            </View>
        </View>

        {/* Previous IVF Toggle */}
        <View style={[styles.formContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Previous IVF cycles?</Text>
            <Switch
                trackColor={{ false: "#E0E0E0", true: theme.colors.primary }} 
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setPreviousIVF}
                value={previousIVF}
            />
        </View>

        {previousIVF && (
            <View style={[styles.formContainer, { marginTop: -16 }]}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Eggs retrieved in last cycle</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex. 5" 
                        placeholderTextColor="#A0A0A0"
                        keyboardType="numeric"
                        value={eggsRetrieved}
                        onChangeText={setEggsRetrieved}
                    />
                </View>
            </View>
        )}

        <View style={styles.buttonRow}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
            >
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
            >
                <Text style={styles.nextButtonText}>Next</Text>
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
    paddingBottom: 40,
  },
  titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.l,
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(64, 145, 139, 0.1)', // Light teal
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
  },
  title: {
    ...theme.typography.heading,
    marginBottom: 4,
  },
  subtitle: {
    ...theme.typography.subheading,
    fontSize: 14,
    color: theme.colors.textLight,
    maxWidth: '85%',
  },
  formContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      ...theme.shadows.soft,
      marginBottom: theme.spacing.l,
  },
  sectionHeader: {
      ...theme.typography.label,
      fontSize: 14,
      color: theme.colors.textLight,
      marginBottom: 8,
      marginLeft: 4,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...theme.typography.label,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  helperText: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 6,
      fontStyle: 'italic',
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.xl,
  },
  backButton: {
      flex: 1,
      marginRight: theme.spacing.s,
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
      marginLeft: theme.spacing.s,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      ...theme.shadows.medium,
  },
  nextButtonText: {
    ...theme.typography.button,
  },
});
