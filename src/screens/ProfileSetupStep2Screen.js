import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';


const GradeSelector = ({ label, selectedGrade, onSelect, error }) => {
  const grades = [
    { value: 0, label: 'None', sub: 'G0' },
    { value: 1, label: '<10%', sub: 'G1' },
    { value: 2, label: '10-25%', sub: 'G2' },
    { value: 3, label: '25-50%', sub: 'G3' },
    { value: 4, label: '>50%', sub: 'G4' },
  ];

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.gradeGrid}>
        {grades.map((g) => (
          <TouchableOpacity 
            key={g.value}
            style={[
              styles.gradeButton,
              selectedGrade === g.value && styles.gradeButtonSelected,
              error && !selectedGrade && selectedGrade !== 0 && styles.gradeButtonError
            ]}
            onPress={() => onSelect(g.value)}
          >
            <Text style={[styles.gradeLabel, selectedGrade === g.value && styles.gradeLabelSelected]}>{g.label}</Text>
            <Text style={[styles.gradeSub, selectedGrade === g.value && styles.gradeSubSelected]}>{g.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const InputGroup = ({ label, value, onChangeText, placeholder, unit, keyboardType = 'numeric', helperText, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError
      ]}>
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
      {error ? <Text style={styles.errorText}>{error}</Text> : (helperText && <Text style={styles.helperText}>{helperText}</Text>)}
    </View>
  );
};

export default function ProfileSetupStep2Screen({ navigation, route }) {
  const step1Data = route.params || {};

  const [amhLevel, setAmhLevel] = useState('');
  const [previousIVF, setPreviousIVF] = useState(false);
  const [eggsRetrieved, setEggsRetrieved] = useState('');
  const [priorSAB, setPriorSAB] = useState('');
  const [freshD3CellCount, setFreshD3CellCount] = useState('');
  const [freshD3Fragmentation, setFreshD3Fragmentation] = useState(null);
  const [day2E2, setDay2E2] = useState('');
  const [triggerDayE2, setTriggerDayE2] = useState('');
  const [stimulationDays, setStimulationDays] = useState('');
  const [calculatedVelocity, setCalculatedVelocity] = useState('0.00');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const d2 = parseFloat(day2E2);
    const trig = parseFloat(triggerDayE2);
    const days = parseFloat(stimulationDays);

    if (!isNaN(d2) && !isNaN(trig) && !isNaN(days) && days > 0) {
        setCalculatedVelocity(((trig - d2) / days).toFixed(2));
    } else {
        setCalculatedVelocity('0.00');
    }
  }, [day2E2, triggerDayE2, stimulationDays]);

  const validate = () => {
    let newErrors = {};
    
    const amh = parseFloat(amhLevel);
    if (amhLevel === '') newErrors.amh = "Required field";
    else if (isNaN(amh) || amh < 0 || amh > 50) newErrors.amh = "Must be 0-50";

    const sab = parseInt(priorSAB);
    if (priorSAB === '') newErrors.sab = "Required field";
    else if (isNaN(sab) || sab < 0 || sab > 20) newErrors.sab = "Must be 0-20";

    const cells = parseInt(freshD3CellCount);
    if (freshD3CellCount === '') newErrors.cells = "Required field";
    else if (isNaN(cells) || cells < 0 || cells > 50) newErrors.cells = "Must be 0-50";

    if (freshD3Fragmentation === null) newErrors.frag = "Please select a grade";

    const d2e2 = parseFloat(day2E2);
    if (day2E2 === '') newErrors.d2e2 = "Required field";
    else if (isNaN(d2e2) || d2e2 < 0 || d2e2 > 2000) newErrors.d2e2 = "0-2000 pg/mL";

    const trigE2 = parseFloat(triggerDayE2);
    if (triggerDayE2 === '') newErrors.trigE2 = "Required field";
    else if (isNaN(trigE2) || trigE2 < 0 || trigE2 > 15000) newErrors.trigE2 = "0-15000 pg/mL";

    const stimDays = parseFloat(stimulationDays);
    if (stimulationDays === '') newErrors.stimDays = "Required field";
    else if (isNaN(stimDays) || stimDays < 1 || stimDays > 40) newErrors.stimDays = "1-40 days";

    if (previousIVF) {
        const eggs = parseInt(eggsRetrieved);
        if (eggsRetrieved === '') newErrors.eggs = "Required field";
        else if (isNaN(eggs) || eggs < 0 || eggs > 100) newErrors.eggs = "0-100 eggs";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
        navigation.navigate('ProfileSetupStep3', {
            ...step1Data,
            amhLevel: amhLevel === '' ? null : amhLevel,
            previousIVF,
            eggsRetrieved,
            priorSAB: priorSAB === '' ? 0 : priorSAB,
            freshD3CellCount,
            freshD3Fragmentation,
            calculatedVelocity
        });
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
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { width: '66.66%' }]} />
                </View>
                <Text style={styles.stepText}>Step 2 of 3</Text>
            </View>
            <Text style={styles.headerTitle}>Medical History</Text>
            <Text style={styles.headerSubtitle}>Precision clinical data entry</Text>
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
                <Text style={styles.introIcon}>🏥</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.introTitle}>Clinical Markers</Text>
                <Text style={styles.introText}>Enter your medical profile data for high-accuracy outcome simulation.</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderBox}>
             <Text style={styles.sectionHeader}>Ovarian Reserve</Text>
             <View style={styles.sectionLine} />
          </View>

          <View style={styles.glassCard}>
            <InputGroup 
              label="AMH Level" 
              unit="ng/mL"
              value={amhLevel} 
              onChangeText={(t) => { setAmhLevel(t); if(errors.amh) setErrors({...errors, amh: ''}); }} 
              placeholder="Ex. 5.5" 
              helperText="Anti-Müllerian Hormone level from your lab report."
              error={errors.amh}
            />
          </View>

          <View style={styles.sectionHeaderBox}>
             <Text style={styles.sectionHeader}>Embryo Data</Text>
             <View style={styles.sectionLine} />
          </View>

          <View style={styles.glassCard}>
            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <InputGroup label="Prior SAB" value={priorSAB} onChangeText={(t) => { setPriorSAB(t); if(errors.sab) setErrors({...errors, sab: ''}); }} placeholder="0" error={errors.sab} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputGroup label="D3 Cell Count" value={freshD3CellCount} onChangeText={(t) => { setFreshD3CellCount(t); if(errors.cells) setErrors({...errors, cells: ''}); }} placeholder="8" error={errors.cells} />
                </View>
            </View>
            <GradeSelector 
              label="D3 Fragmentation Grade" 
              selectedGrade={freshD3Fragmentation} 
              onSelect={(g) => { setFreshD3Fragmentation(g); if(errors.frag) setErrors({...errors, frag: ''}); }} 
              error={errors.frag}
            />
          </View>

          <View style={styles.sectionHeaderBox}>
             <Text style={styles.sectionHeader}>Hormone Velocity</Text>
             <View style={styles.sectionLine} />
          </View>

          <View style={styles.glassCard}>
             <View style={styles.row}>
                 <View style={{ flex: 1, marginRight: 8 }}>
                    <InputGroup label="Day 2 E2" value={day2E2} onChangeText={(t) => { setDay2E2(t); if(errors.d2e2) setErrors({...errors, d2e2: ''}); }} placeholder="40" error={errors.d2e2} />
                 </View>
                 <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputGroup label="Trigger E2" value={triggerDayE2} onChangeText={(t) => { setTriggerDayE2(t); if(errors.trigE2) setErrors({...errors, trigE2: ''}); }} placeholder="2000" error={errors.trigE2} />
                 </View>
             </View>
             <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <InputGroup label="Stim. Days" value={stimulationDays} onChangeText={(t) => { setStimulationDays(t); if(errors.stimDays) setErrors({...errors, stimDays: ''}); }} placeholder="10" error={errors.stimDays} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Calculated Velocity</Text>
                    <View style={styles.velocityBox}>
                        <Text style={styles.velocityValue}>{calculatedVelocity}</Text>
                    </View>
                </View>
             </View>
          </View>

          <View style={styles.sectionHeaderBox}>
             <Text style={styles.sectionHeader}>Past Experience</Text>
             <View style={styles.sectionLine} />
          </View>

          <View style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
                <Text style={[styles.label, { marginBottom: 2 }]}>Previous IVF Cycles</Text>
                <Text style={styles.helperText}>Have you undergone IVF before?</Text>
            </View>
            <Switch
                trackColor={{ false: "#E2E8F0", true: theme.colors.primary }} 
                thumbColor={"#FFFFFF"}
                onValueChange={setPreviousIVF}
                value={previousIVF}
            />
          </View>

          {previousIVF && (
            <View style={[styles.glassCard, { marginTop: -16 }]}>
                <InputGroup 
                    label="Eggs Retrieved" 
                    value={eggsRetrieved} 
                    onChangeText={(t) => { setEggsRetrieved(t); setErrors({...errors, eggs: ''}); }} 
                    placeholder="Ex. 5" 
                    helperText="Total eggs retrieved in your most recent cycle."
                    error={errors.eggs}
                />
            </View>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient
              colors={['#0D9488', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.nextButtonText}>Continue to Review</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
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
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...theme.shadows.soft,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#475569',
    marginBottom: 8,
  },
  unitText: {
    fontWeight: '400',
    fontSize: 10,
    color: '#94A3B8',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_400Regular_Italic',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
  },
  velocityBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  velocityValue: {
    color: '#0D9488',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
  },
  gradeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gradeButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  gradeButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDFA',
    transform: [{ scale: 1.05 }],
  },
  gradeButtonError: {
    borderColor: '#EF4444',
  },
  gradeLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#64748B',
  },
  gradeLabelSelected: {
    color: theme.colors.primary,
  },
  gradeSub: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#94A3B8',
    marginTop: 2,
  },
  gradeSubSelected: {
    color: '#0D9488',
  },
  nextButton: {
    marginTop: 10,
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
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
  }
});
