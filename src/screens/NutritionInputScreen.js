import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput
} from 'react-native';
import { theme } from '../theme';

export default function NutritionInputScreen({ navigation }) {
    const [systolicBP, setSystolicBP] = useState('');
    const [diastolicBP, setDiastolicBP] = useState('');
    const [fastingGlucose, setFastingGlucose] = useState('');
    const [totalCholesterol, setTotalCholesterol] = useState('');
    const [dailyCalories, setDailyCalories] = useState('');
    const [folate, setFolate] = useState('');
    const [zinc, setZinc] = useState('');
    const [vitaminB12, setVitaminB12] = useState('');

    const handleCalculate = () => {
        // You could pass the inputs as params if NutritionScreen dynamically renders them
        // For now, it just navigates to the NutritionScreen
        navigation.navigate('Nutrition');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerPanel}>
                <TouchableOpacity 
                    style={styles.backButtonTop}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonTopText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Metabolic Profile</Text>
                <Text style={styles.headerSubtitle}>Input your clinical data for dietary impact simulation</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Physical Exam Data */}
                <Text style={styles.sectionHeader}>Physical Exam Data</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Blood Pressure (mmHg)</Text>
                    <View style={[styles.row, { width: '100%' }]}>
                        <TextInput 
                            style={[styles.input, { flex: 1, marginRight: 8, minWidth: 0, paddingHorizontal: 12 }]} 
                            placeholder="Systolic (e.g. 120)" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={systolicBP}
                            onChangeText={setSystolicBP}
                        />
                        <Text style={{alignSelf: 'center', fontSize: 20, color: theme.colors.textLight}}>/</Text>
                        <TextInput 
                            style={[styles.input, { flex: 1, marginLeft: 8, minWidth: 0, paddingHorizontal: 12 }]} 
                            placeholder="Diastolic (e.g. 80)" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={diastolicBP}
                            onChangeText={setDiastolicBP}
                        />
                    </View>
                </View>

                {/* Lab Data */}
                <Text style={styles.sectionHeader}>Lab Data (Blood Test)</Text>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fasting Glucose (mg/dL)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 90" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={fastingGlucose}
                            onChangeText={setFastingGlucose}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Cholesterol (mg/dL)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 180" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={totalCholesterol}
                            onChangeText={setTotalCholesterol}
                        />
                    </View>
                </View>

                {/* Dietary Intake */}
                <Text style={styles.sectionHeader}>Daily Dietary Intake</Text>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Calories (kcal/day)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 2000" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={dailyCalories}
                            onChangeText={setDailyCalories}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Folate Intake (mcg/day)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 400" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={folate}
                            onChangeText={setFolate}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Zinc Intake (mg/day)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 8" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={zinc}
                            onChangeText={setZinc}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vitamin B12 Intake (mcg/day)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Ex. 2.4" 
                            placeholderTextColor="#A0A0A0"
                            keyboardType="numeric"
                            value={vitaminB12}
                            onChangeText={setVitaminB12}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.calculateButton}
                    onPress={handleCalculate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.calculateButtonText}>Calculate Dietary Impact</Text>
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
    headerPanel: {
        backgroundColor: theme.colors.primary,
        paddingTop: theme.spacing.xl,
        paddingBottom: 30,
        paddingHorizontal: theme.spacing.l,
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30,
        ...theme.shadows.medium,
        marginBottom: 16,
    },
    backButtonTop: {
        marginBottom: 16,
    },
    backButtonTopText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        ...theme.typography.heading,
        color: '#FFFFFF',
        fontSize: 22,
        marginBottom: 8,
    },
    headerSubtitle: {
        ...theme.typography.subheading,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.s,
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
    formContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        ...theme.shadows.soft,
        marginBottom: theme.spacing.l,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        ...theme.typography.label,
        marginBottom: 8,
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calculateButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
        ...theme.shadows.medium,
        marginTop: 8,
    },
    calculateButtonText: {
        ...theme.typography.button,
        fontSize: 16,
    }
});
