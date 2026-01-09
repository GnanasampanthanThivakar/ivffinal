import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  SafeAreaView 
} from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../theme';

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('160');
  const [weight, setWeight] = useState('55');





  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '33%' }]} />
         </View>
         <Text style={styles.stepIndicator}>Step 1 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About You</Text>
        <Text style={styles.subtitle}>Help us understand your personal profile.</Text>

        <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>What's your name?</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex. Sarah"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex. 32" 
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            {/* Height & Weight Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('ProfileSetupStep2', {
            name,
            age,
            height,
            weight
          })}
          activeOpacity={0.8}
        >
            <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

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
  title: {
    ...theme.typography.heading,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.subheading,
    marginBottom: theme.spacing.xl,
    color: theme.colors.textLight,
  },
  formContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      ...theme.shadows.soft,
      marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.l,
  },
  label: {
    ...theme.typography.label,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: 'transparent', // Cleaner look, only transparent unless focused (could add focus state logic later)
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  nextButtonText: {
    ...theme.typography.button,
    fontSize: 18,
  }
});
