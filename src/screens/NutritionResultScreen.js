import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function NutritionResultScreen({ navigation, route }) {
    const params = route.params || {};
    const {
        predictionSuccess = 0,
        optimizedProbability = 0,
        impactScore = 0,
        recommendation = '',
        detailedRecommendations = []
    } = params;

    // DEBUG: Log received recommendations
    console.log('=== NUTRITION RESULT SCREEN ===');
    console.log('Total recommendations received:', detailedRecommendations.length);
    console.log('Recommendations:', detailedRecommendations.map(r => r.nutrient).join(', '));
    const bpRec = detailedRecommendations.find(r => r.nutrient === 'Blood Pressure');
    if (bpRec) {
        console.log('✓ BP FOUND:', bpRec.current, '→', bpRec.target, 'Impact:', bpRec.impact + '%');
    } else {
        console.log('✗ NO Blood Pressure recommendation found');
    }

    const getStatusColor = (status) => {
        if (status === 'deficient' || status === 'low') return '#EF4444';
        if (status === 'elevated' || status === 'high') return '#F59E0B';
        return '#94A3B8';
    };

    const getStatusLabel = (status) => {
        if (status === 'deficient') return 'Below Target';
        if (status === 'elevated') return 'Above Target';
        if (status === 'low') return 'Too Low';
        if (status === 'high') return 'Too High';
        return 'Needs Attention';
    };

    const getBMICategoryName = (catNum) => {
        const catMap = {
            1: 'Underweight',
            2: 'Normal',
            3: 'Overweight',
            4: 'Obese'
        };
        return catMap[catNum] || catNum.toString();
    };

    const formatValue = (rec) => {
        // Special formatting for BMI categories
        if (rec.nutrient === 'Body Mass Index' && rec.unit === 'category') {
            return {
                current: getBMICategoryName(rec.current),
                target: getBMICategoryName(rec.target)
            };
        }
        // Special formatting for Blood Pressure (already includes unit in value)
        if (rec.nutrient === 'Blood Pressure' && typeof rec.current === 'string' && rec.current.includes('/')) {
            return {
                current: `${rec.current} ${rec.unit}`,
                target: `${rec.target} ${rec.unit}`
            };
        }
        return {
            current: `${rec.current} ${rec.unit}`,
            target: `${rec.target} ${rec.unit}`
        };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient
                colors={['#0D9488', '#0F766E']}
                style={styles.headerPanel}
            >
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerLabel}>Analysis Results</Text>
                    </View>
                    <View style={styles.headerTextWrapper}>
                        <Text style={styles.headerTitle}>AI Simulation Report</Text>
                        <Text style={styles.headerSubtitle}>Personalized Nutri-Genomic Impact Analysis</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >

                {/* Premium Optimization Hub */}
                <View style={styles.optimizationHub}>
                    <View style={styles.hubHeader}>
                        <View style={styles.hubBadge}>
                            <Text style={styles.hubBadgeText}>OPTIMIZATION ENGINE</Text>
                        </View>
                        <Text style={styles.hubStatus}>ACTIVE SIMULATION</Text>
                    </View>
                    
                    <View style={styles.hubMain}>
                        <View style={styles.hubTextContent}>
                            <Text style={styles.hubMainTitle}>Potential Gain</Text>
                            <Text style={styles.hubMainDesc}>
                                Projected increase in success probability through genomic-aligned nutrition.
                            </Text>
                        </View>
                        
                        <View style={styles.hubScoreContainer}>
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.hubScoreCircle}
                            >
                                <Text style={styles.hubScoreValue}>+{impactScore.toFixed(1)}%</Text>
                            </LinearGradient>
                            <View style={styles.hubScoreGlow} />
                        </View>
                    </View>
                </View>

                {/* Summary */}
                {recommendation ? (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryIcon}>🎯</Text>
                        <Text style={styles.summaryText}>{recommendation}</Text>
                    </View>
                ) : null}

                {/* Dynamic Recommendations */}
                {detailedRecommendations.length > 0 && (
                    <>
                        <View style={styles.sectionHeaderBox}>
                            <Text style={styles.sectionHeader}>Personalized Interventions</Text>
                        </View>

                        {detailedRecommendations.map((rec, index) => {
                            const formattedValues = formatValue(rec);
                            return (
                            <View key={index} style={styles.recommendationCard}>
                                <View style={styles.recHeader}>
                                    <View style={styles.iconCircle}>
                                        <Text style={styles.recIcon}>{rec.icon}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.recTitle}>{rec.nutrient}</Text>
                                        <View style={styles.statusRow}>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(rec.status) }]} />
                                            <Text style={[styles.recSub, { color: getStatusColor(rec.status) }]}>
                                                {getStatusLabel(rec.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.impactChip}>
                                        <Text style={styles.impactChipText}>
                                            {rec.impact > 0 ? '+' : ''}{rec.impact}%
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.recBodyBox}>
                                    <View style={styles.valuesRow}>
                                        <View style={styles.valueBox}>
                                            <Text style={styles.valueLabel}>Current</Text>
                                            <Text style={[styles.valueNum, { color: '#EF4444' }]}>{formattedValues.current}</Text>
                                        </View>
                                        <Text style={styles.arrow}>→</Text>
                                        <View style={styles.valueBox}>
                                            <Text style={styles.valueLabel}>Target</Text>
                                            <Text style={[styles.valueNum, { color: '#10B981' }]}>{formattedValues.target}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.foodTipBox}>
                                    <Text style={styles.foodTipIcon}>🍽️</Text>
                                    <Text style={styles.foodTipText}>{rec.food_tip}</Text>
                                </View>
                            </View>
                        )})}
                    </>
                )}

                {detailedRecommendations.length === 0 && (
                    <View style={styles.recommendationCard}>
                        <View style={styles.recHeader}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.recIcon}>✅</Text>
                            </View>
                            <View>
                                <Text style={styles.recTitle}>Excellent Profile</Text>
                                <Text style={styles.recSub}>All markers within optimal range</Text>
                            </View>
                        </View>
                        <View style={styles.recBodyBox}>
                            <Text style={styles.recBody}>
                                Your nutritional profile is well-optimized. Maintain your current diet and lifestyle for the best outcomes.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Technical Insight */}
                <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightText}>
                        Results synthesized from a <Text style={{fontWeight: '700'}}>24-feature Neural Ensemble</Text> trained on clinical cohorts. Each recommendation is individually simulated against your profile.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.primaryButtonText}>Modify Input Data</Text>
                </TouchableOpacity>

                <View style={{ height: 60 }} />
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
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        ...theme.shadows.premium,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: Platform.OS === 'ios' ? 10 : 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '300',
    },
    headerLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerTextWrapper: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        ...theme.shadows.premium,
        marginBottom: 24,
    },
    optimizationHub: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 4,
        ...theme.shadows.premium,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        marginBottom: 24,
    },
    hubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    hubBadge: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    hubBadgeText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#0D9488',
        letterSpacing: 0.5,
    },
    hubStatus: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    hubMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hubTextContent: {
        flex: 1,
        paddingRight: 16,
    },
    hubMainTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#0F172A',
        marginBottom: 4,
    },
    hubMainDesc: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
        lineHeight: 18,
    },
    hubScoreContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hubScoreCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        ...theme.shadows.medium,
    },
    hubScoreValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
    },
    hubScoreGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        zIndex: 1,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#F0FDFA',
        borderRadius: 18,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    summaryIcon: {
        fontSize: 22,
        marginRight: 14,
    },
    summaryText: {
        flex: 1,
        fontSize: 14,
        color: '#0F766E',
        lineHeight: 22,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    sectionHeaderBox: {
        marginBottom: 16,
        paddingLeft: 4,
    },
    sectionHeader: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    recommendationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        ...theme.shadows.soft,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    recHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    recIcon: {
        fontSize: 22,
    },
    recTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F172A',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 6,
    },
    recSub: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    impactChip: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    impactChipText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#059669',
    },
    recBodyBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    recBody: {
        fontSize: 14,
        lineHeight: 22,
        color: '#334155',
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    valuesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    valueBox: {
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    valueNum: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
    },
    arrow: {
        fontSize: 22,
        color: '#CBD5E1',
        fontWeight: '300',
        marginHorizontal: 12,
    },
    foodTipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    foodTipIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    foodTipText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        marginTop: 10,
        alignItems: 'center',
    },
    insightIcon: {
        fontSize: 20,
        marginRight: 16,
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    primaryButton: {
        backgroundColor: '#0F172A',
        paddingVertical: 20,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 12,
        ...theme.shadows.soft,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
    }
});

