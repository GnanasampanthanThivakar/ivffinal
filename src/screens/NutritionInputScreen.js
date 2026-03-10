import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { theme } from '../theme';

export default function NutritionInputScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    // 24 Feature State Management
    const [formData, setFormData] = useState({
        age: '34', gender: '2', sbp: '118', dbp: '76',
        chol: '185', sleep: '7.5', smoke: '2', bmi_cat: '2',
        // Day 1
        calories: '1850', protein: '75', carbs: '220', fat: '65',
        vit_d: '12.5', vit_b12: '4.5', folate_d1: '330', zinc_d1: '9.5',
        // Day 2
        calories_d2: '1900', protein_d2: '80', carbs_d2: '230', fat_d2: '70',
        folate_d2: '310', zinc_d2: '8.5', vit_d_d2: '11.0', vit_b12_d2: '5.0'
    });

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            // Convert all values to floats for the API
            const payload = {};
            Object.keys(formData).forEach(key => {
                payload[key] = parseFloat(formData[key]) || 0;
            });

            console.log("Sending Payload:", payload);

            // Connect to our local FastAPI backend
            const response = await fetch('http://127.0.0.1:8000/api/predict/nutrition_full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Navigate to Dedicated Nutrition Result Screen
                navigation.navigate('NutritionResult', {
                    name: 'Patient',
                    predictionSuccess: result.baseline_probability,
                    optimizedProbability: result.optimized_probability,
                    impactScore: result.impact_score
                });
            } else {
                Alert.alert("Prediction Error", result.detail || "Unknown error occurred");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Connection Error", "Could not connect to the AI Backend. Ensure the FastAPI server is running.");
        } finally {
            setLoading(false);
        }
    };

    const InputGroup = ({ label, name, placeholder, unit, keyboardType = 'numeric' }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#A0A0A0"
                keyboardType={keyboardType}
                value={formData[name]}
                onChangeText={(val) => updateField(name, val)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.headerPanel}>
                    <TouchableOpacity
                        style={styles.backButtonTop}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonTopText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Advanced Nutrition AI</Text>
                    <Text style={styles.headerSubtitle}>Complete your 24-marker research profile</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* SECTION 1: CLINICAL VITALS */}
                    <Text style={styles.sectionHeader}>📋 Clinical Vitals & History</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <InputGroup label="Age" name="age" placeholder="34" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <InputGroup label="Sleep" name="sleep" unit="hrs" placeholder="7.5" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Gender</Text>
                                <TouchableOpacity
                                    style={[styles.miniToggle, formData.gender === '2' && styles.miniToggleActive]}
                                    onPress={() => updateField('gender', '2')}
                                >
                                    <Text style={[styles.miniToggleText, formData.gender === '2' && styles.miniToggleTextActive]}>Female</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.label}>Smoking</Text>
                                <TouchableOpacity
                                    style={[styles.miniToggle, formData.smoke === '2' && styles.miniToggleActive]}
                                    onPress={() => updateField('smoke', '2')}
                                >
                                    <Text style={[styles.miniToggleText, formData.smoke === '2' && styles.miniToggleTextActive]}>Non-Smoker</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <InputGroup label="Systolic BP" name="sbp" placeholder="118" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <InputGroup label="Diastolic BP" name="dbp" placeholder="76" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <InputGroup label="Cholesterol" name="chol" placeholder="185" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.label}>BMI Cat (1-4)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={formData.bmi_cat}
                                    onChangeText={(val) => updateField('bmi_cat', val)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* SECTION 2: DAY 1 NUTRITION */}
                    <Text style={styles.sectionHeader}>🥦 Day 1 Dietary Intake</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Calories" name="calories" unit="kcal" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Protein" name="protein" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Carbs" name="carbs" unit="g" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Total Fat" name="fat" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Folate D1" name="folate_d1" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Zinc D1" name="zinc_d1" unit="mg" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Vitamin D" name="vit_d" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Vitamin B12" name="vit_b12" unit="mcg" /></View>
                        </View>
                    </View>

                    {/* SECTION 3: DAY 2 NUTRITION */}
                    <Text style={styles.sectionHeader}>🍎 Day 2 Dietary Intake</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Calories" name="calories_d2" unit="kcal" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Protein" name="protein_d2" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Carbs" name="carbs_d2" unit="g" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Total Fat" name="fat_d2" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Folate D2" name="folate_d2" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Zinc D2" name="zinc_d2" unit="mg" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}><InputGroup label="Vitamin D" name="vit_d_d2" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 8 }}><InputGroup label="Vitamin B12" name="vit_b12_d2" unit="mcg" /></View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.calculateButton, loading && { opacity: 0.7 }]}
                        onPress={handleCalculate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.calculateButtonText}>Run Research Simulation 🚀</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 25,
        paddingHorizontal: theme.spacing.l,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.medium,
    },
    backButtonTop: {
        marginBottom: 12,
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
        marginBottom: 4,
    },
    headerSubtitle: {
        ...theme.typography.subheading,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.m,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 10,
        marginLeft: 4,
        marginTop: 10,
        textTransform: 'uppercase',
    },
    formContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        padding: 16,
        ...theme.shadows.soft,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textLight,
        marginBottom: 6,
    },
    unitText: {
        fontWeight: '400',
        fontSize: 10,
    },
    input: {
        backgroundColor: '#F5F7FA',
        borderWidth: 1,
        borderColor: '#E1E8ED',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: theme.colors.text,
    },
    miniToggle: {
        backgroundColor: '#F5F7FA',
        borderWidth: 1,
        borderColor: '#E1E8ED',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    miniToggleActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    miniToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textLight,
    },
    miniToggleTextActive: {
        color: '#FFF',
    },
    calculateButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        ...theme.shadows.medium,
        marginTop: 10,
    },
    calculateButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    }
});
