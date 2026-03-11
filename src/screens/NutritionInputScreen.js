import React, { useState, useRef } from 'react';
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
    Platform,
    Animated,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function NutritionInputScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

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
            const payload = {};
            Object.keys(formData).forEach(key => {
                payload[key] = parseFloat(formData[key]) || 0;
            });

            console.log("Sending Premium Payload:", payload);

            const response = await fetch('http://127.0.0.1:8000/api/predict/nutrition_full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
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
            Alert.alert("Connection Error", "Could not connect to the AI Backend.");
        } finally {
            setLoading(false);
        }
    };

    const InputGroup = ({ label, name, placeholder, unit, keyboardType = 'numeric', icon }) => {
        const [isFocused, setIsFocused] = useState(false);
        
        return (
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
                <View style={[
                    styles.inputWrapper, 
                    isFocused && styles.inputWrapperFocused
                ]}>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#94A3B8"
                        keyboardType={keyboardType}
                        value={formData[name]}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChangeText={(val) => updateField(name, val)}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0D9488', '#0F766E']}
                style={styles.headerBackground}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>✕</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Nutrition AI</Text>
                            <Text style={styles.headerSubtitle}>Precision Simulation Engine</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    ref={scrollRef}
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    {/* PROGRESS INFO */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIconBox}>
                            <Text style={styles.infoIcon}>🧬</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>Deep Biomarker Analysis</Text>
                            <Text style={styles.infoText}>We use 24 unique data points to simulate your personalized nutrition impact.</Text>
                        </View>
                    </View>

                    {/* SECTION 1: CLINICAL */}
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionHeader}>Clinical Vitals</Text>
                        <View style={styles.sectionLine} />
                    </View>
                    
                    <View style={styles.glassCard}>
                        <View style={styles.row}>
                            <View style={{ flex: 1.2, marginRight: 10 }}>
                                <InputGroup label="Age" name="age" placeholder="34" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="Sleep" name="sleep" unit="hrs" placeholder="7.5" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, formData.gender === '2' && styles.toggleBtnActive]}
                                        onPress={() => updateField('gender', '2')}
                                    >
                                        <Text style={[styles.toggleText, formData.gender === '2' && styles.toggleTextActive]}>F</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, formData.gender === '1' && styles.toggleBtnActive]}
                                        onPress={() => updateField('gender', '1')}
                                    >
                                        <Text style={[styles.toggleText, formData.gender === '1' && styles.toggleTextActive]}>M</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.label}>Smoking</Text>
                                <TouchableOpacity
                                    style={[styles.miniToggle, formData.smoke === '2' && styles.miniToggleActive]}
                                    onPress={() => updateField('smoke', formData.smoke === '2' ? '1' : '2')}
                                >
                                    <Text style={[styles.miniToggleText, formData.smoke === '2' && styles.miniToggleTextActive]}>
                                        {formData.smoke === '2' ? 'Non-Smoker' : 'Smoker'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <InputGroup label="Systolic" name="sbp" placeholder="118" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="Diastolic" name="dbp" placeholder="76" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <InputGroup label="Cholesterol" name="chol" placeholder="185" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="BMI Cat" name="bmi_cat" placeholder="2" />
                            </View>
                        </View>
                    </View>

                    {/* SECTION 2: DIETARY INTAKE */}
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionHeader}>Dietary Markers</Text>
                        <View style={styles.sectionLine} />
                    </View>

                    {/* DAY 1 */}
                    <Text style={styles.dayLabel}>Protocol Day 01</Text>
                    <View style={styles.glassCard}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Calories" name="calories" unit="kcal" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Protein" name="protein" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Carbs" name="carbs" unit="g" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Fat" name="fat" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Folate D1" name="folate_d1" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Zinc D1" name="zinc_d1" unit="mg" /></View>
                        </View>
                    </View>

                    {/* DAY 2 */}
                    <Text style={styles.dayLabel}>Protocol Day 02</Text>
                    <View style={styles.glassCard}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Calories" name="calories_d2" unit="kcal" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Protein" name="protein_d2" unit="g" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Folate D2" name="folate_d2" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Zinc D2" name="zinc_d2" unit="mg" /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Vit D" name="vit_d_d2" unit="mcg" /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Vit B12" name="vit_b12_d2" unit="mcg" /></View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.calculateButton, loading && { opacity: 0.8 }]}
                        onPress={handleCalculate}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#0D9488', '#14B8A6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.calculateButtonText}>Run Prediction Engine</Text>
                                    <Text style={styles.calculateButtonArrow}>→</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
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
    headerBackground: {
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...theme.shadows.premium,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '200',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.xl,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        ...theme.shadows.soft,
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F0FDFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoIcon: {
        fontSize: 24,
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    infoText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: theme.colors.textLight,
        lineHeight: 18,
    },
    sectionHeaderBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    sectionHeader: {
        fontSize: 14,
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
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        ...theme.shadows.soft,
    },
    dayLabel: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#64748B',
        marginBottom: 10,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    inputGroup: {
        flex: 1,
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
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: '#FFFFFF',
        ...theme.shadows.soft,
    },
    toggleText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#94A3B8',
    },
    toggleTextActive: {
        color: theme.colors.primary,
    },
    miniToggle: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    miniToggleActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    miniToggleText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#64748B',
    },
    miniToggleTextActive: {
        color: '#059669',
    },
    calculateButton: {
        marginTop: 10,
        borderRadius: 18,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    gradientButton: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    calculateButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 0.5,
    },
    calculateButtonArrow: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '300',
    }
});
