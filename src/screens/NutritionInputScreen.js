import React, { useState, useRef, useCallback } from 'react';
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
    Dimensions,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

// InputGroup component moved outside to prevent recreation on every render
const InputGroup = React.memo(({ label, name, placeholder, unit, keyboardType = 'numeric', icon, value, updateField }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showError, setShowError] = useState(false);
    
    const handleChange = useCallback((text) => {
        // Check if input contains non-numeric characters
        const hasInvalidChars = /[^0-9.]/.test(text);
        
        if (hasInvalidChars) {
            setShowError(true);
            // Auto-hide error after 2 seconds
            setTimeout(() => setShowError(false), 2000);
        } else {
            setShowError(false);
        }
        
        // Allow only numeric values (including decimals)
        const numericValue = text.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        const parts = numericValue.split('.');
        const filteredValue = parts.length > 2 
            ? parts[0] + '.' + parts.slice(1).join('') 
            : numericValue;
        updateField(name, filteredValue);
    }, [name, updateField]);
    
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} {unit && <Text style={styles.unitText}>({unit})</Text>}</Text>
            <View style={[
                styles.inputWrapper, 
                isFocused && styles.inputWrapperFocused,
                showError && styles.inputWrapperError
            ]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={keyboardType}
                    value={value}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChangeText={handleChange}
                />
            </View>
            {showError && (
                <Text style={styles.errorText}>Allow numeric values only</Text>
            )}
        </View>
    );
});

export default function NutritionInputScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
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

    const updateField = useCallback((name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const payload = {};
            Object.keys(formData).forEach(key => {
                payload[key] = parseFloat(formData[key]) || 0;
            });

            const response = await fetch('http://127.0.0.1:8000/api/predict/nutrition_full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                const parentNav = navigation.getParent();
                const nav = parentNav || navigation;
                nav.navigate('NutritionResult', {
                    name: 'Patient',
                    predictionSuccess: result.baseline_probability,
                    optimizedProbability: result.optimized_probability,
                    impactScore: result.impact_score,
                    recommendation: result.recommendation,
                    detailedRecommendations: result.detailed_recommendations
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
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Nutrition AI</Text>
                            <Text style={styles.headerSubtitle}>Precision Simulation Engine</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.helpButton}
                            onPress={() => setShowHelpModal(true)}
                        >
                            <Text style={styles.helpButtonText}>?</Text>
                        </TouchableOpacity>
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
                                <InputGroup label="Age" name="age" placeholder="34" value={formData.age} updateField={updateField} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="Sleep" name="sleep" unit="hrs" placeholder="7.5" value={formData.sleep} updateField={updateField} />
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
                            {/* <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.label}>Smoking</Text>
                                <TouchableOpacity
                                    style={[styles.miniToggle, formData.smoke === '2' && styles.miniToggleActive]}
                                    onPress={() => updateField('smoke', formData.smoke === '2' ? '1' : '2')}
                                >
                                    <Text style={[styles.miniToggleText, formData.smoke === '2' && styles.miniToggleTextActive]}>
                                        {formData.smoke === '2' ? 'Non-Smoker' : 'Smoker'}
                                    </Text>
                                </TouchableOpacity>
                            </View> */}
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <InputGroup label="Systolic" name="sbp" placeholder="118" value={formData.sbp} updateField={updateField} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="Diastolic" name="dbp" placeholder="76" value={formData.dbp} updateField={updateField} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <InputGroup label="Cholesterol" name="chol" placeholder="185" value={formData.chol} updateField={updateField} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <InputGroup label="BMI Cat" name="bmi_cat" placeholder="2" value={formData.bmi_cat} updateField={updateField} />
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
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Calories" name="calories" unit="kcal" value={formData.calories} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Protein" name="protein" unit="g" value={formData.protein} updateField={updateField} /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Carbs" name="carbs" unit="g" value={formData.carbs} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Fat" name="fat" unit="g" value={formData.fat} updateField={updateField} /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Folate D1" name="folate_d1" unit="mcg" value={formData.folate_d1} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Zinc D1" name="zinc_d1" unit="mg" value={formData.zinc_d1} updateField={updateField} /></View>
                        </View>
                    </View>

                    {/* DAY 2 */}
                    <Text style={styles.dayLabel}>Protocol Day 02</Text>
                    <View style={styles.glassCard}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Calories" name="calories_d2" unit="kcal" value={formData.calories_d2} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Protein" name="protein_d2" unit="g" value={formData.protein_d2} updateField={updateField} /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Folate D2" name="folate_d2" unit="mcg" value={formData.folate_d2} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Zinc D2" name="zinc_d2" unit="mg" value={formData.zinc_d2} updateField={updateField} /></View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}><InputGroup label="Vit D" name="vit_d_d2" unit="mcg" value={formData.vit_d_d2} updateField={updateField} /></View>
                            <View style={{ flex: 1, marginLeft: 10 }}><InputGroup label="Vit B12" name="vit_b12_d2" unit="mcg" value={formData.vit_b12_d2} updateField={updateField} /></View>
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

            {/* Nutritional Reference Chart Modal */}
            <Modal
                visible={showHelpModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📊 Nutritional Reference Guide</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowHelpModal(false)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalSubtitle}>Common Foods & Nutrient Content</Text>

                            {/* Protein Section */}
                            <View style={styles.nutrientSection}>
                                <View style={styles.nutrientHeader}>
                                    <Text style={styles.nutrientTitle}>🥩 Protein (per 100g)</Text>
                                    <Text style={styles.nutrientTarget}>Target: 75-80g/day</Text>
                                </View>
                                <View style={styles.foodList}>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Chicken Breast</Text>
                                        <Text style={styles.foodAmount}>31g</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Eggs (2 large)</Text>
                                        <Text style={styles.foodAmount}>13g</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Greek Yogurt</Text>
                                        <Text style={styles.foodAmount}>10g</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Lentils (cooked)</Text>
                                        <Text style={styles.foodAmount}>9g</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Salmon</Text>
                                        <Text style={styles.foodAmount}>25g</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Folate Section */}
                            <View style={styles.nutrientSection}>
                                <View style={styles.nutrientHeader}>
                                    <Text style={styles.nutrientTitle}>🥬 Folate (mcg)</Text>
                                    <Text style={styles.nutrientTarget}>Target: 300-400mcg/day</Text>
                                </View>
                                <View style={styles.foodList}>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Spinach (1 cup, cooked)</Text>
                                        <Text style={styles.foodAmount}>263mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Lentils (1 cup)</Text>
                                        <Text style={styles.foodAmount}>358mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Asparagus (6 spears)</Text>
                                        <Text style={styles.foodAmount}>134mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Avocado (1 medium)</Text>
                                        <Text style={styles.foodAmount}>163mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Broccoli (1 cup)</Text>
                                        <Text style={styles.foodAmount}>104mcg</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Zinc Section */}
                            <View style={styles.nutrientSection}>
                                <View style={styles.nutrientHeader}>
                                    <Text style={styles.nutrientTitle}>🦪 Zinc (mg)</Text>
                                    <Text style={styles.nutrientTarget}>Target: 8-11mg/day</Text>
                                </View>
                                <View style={styles.foodList}>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Oysters (6 medium)</Text>
                                        <Text style={styles.foodAmount}>32mg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Beef (100g)</Text>
                                        <Text style={styles.foodAmount}>4.8mg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Pumpkin Seeds (30g)</Text>
                                        <Text style={styles.foodAmount}>2.9mg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Chickpeas (1 cup)</Text>
                                        <Text style={styles.foodAmount}>2.5mg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Cashews (30g)</Text>
                                        <Text style={styles.foodAmount}>1.6mg</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Vitamin D Section */}
                            <View style={styles.nutrientSection}>
                                <View style={styles.nutrientHeader}>
                                    <Text style={styles.nutrientTitle}>☀️ Vitamin D (mcg)</Text>
                                    <Text style={styles.nutrientTarget}>Target: 10-15mcg/day</Text>
                                </View>
                                <View style={styles.foodList}>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Salmon (100g)</Text>
                                        <Text style={styles.foodAmount}>14mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Egg Yolks (2 large)</Text>
                                        <Text style={styles.foodAmount}>2.2mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Fortified Milk (1 cup)</Text>
                                        <Text style={styles.foodAmount}>2.9mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Mushrooms (1 cup)</Text>
                                        <Text style={styles.foodAmount}>9.2mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Tuna (100g)</Text>
                                        <Text style={styles.foodAmount}>4.9mcg</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Vitamin B12 Section */}
                            <View style={styles.nutrientSection}>
                                <View style={styles.nutrientHeader}>
                                    <Text style={styles.nutrientTitle}>💊 Vitamin B12 (mcg)</Text>
                                    <Text style={styles.nutrientTarget}>Target: 2.4-6mcg/day</Text>
                                </View>
                                <View style={styles.foodList}>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Clams (100g)</Text>
                                        <Text style={styles.foodAmount}>84mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Beef Liver (100g)</Text>
                                        <Text style={styles.foodAmount}>60mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Salmon (100g)</Text>
                                        <Text style={styles.foodAmount}>4.8mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Eggs (2 large)</Text>
                                        <Text style={styles.foodAmount}>1.6mcg</Text>
                                    </View>
                                    <View style={styles.foodItem}>
                                        <Text style={styles.foodName}>Greek Yogurt (1 cup)</Text>
                                        <Text style={styles.foodAmount}>1.3mcg</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalFooter}>
                                <Text style={styles.footerNote}>💡 Tip: Mix different food sources throughout the day for better absorption</Text>
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    inputWrapperError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        fontSize: 11,
        color: '#EF4444',
        fontFamily: 'PlusJakartaSans_600SemiBold',
        marginTop: 4,
        marginLeft: 4,
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
    },
    helpButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        paddingTop: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        flex: 1,
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 18,
        color: '#64748B',
        fontWeight: '300',
    },
    modalScroll: {
        paddingHorizontal: 24,
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    nutrientSection: {
        marginBottom: 24,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
    },
    nutrientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    nutrientTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
    },
    nutrientTarget: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    foodList: {
        gap: 8,
    },
    foodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    foodName: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.text,
        flex: 1,
    },
    foodAmount: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
    },
    modalFooter: {
        marginTop: 10,
        padding: 16,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    footerNote: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#92400E',
        lineHeight: 18,
        textAlign: 'center',
    }
});
