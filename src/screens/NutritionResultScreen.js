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

    const getStatusColor = (status) => {
        return status === 'deficient' ? '#EF4444' : '#F59E0B';
    };

    const getStatusLabel = (status) => {
        return status === 'deficient' ? 'Below Target' : 'Above Target';
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

                {/* Score Overview Card */}
                <View style={[styles.card, styles.scoreCard]}>
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>Current</Text>
                            <Text style={styles.scoreValue}>{predictionSuccess.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>Optimized</Text>
                            <Text style={[styles.scoreValue, { color: '#10B981' }]}>{optimizedProbability.toFixed(1)}%</Text>
                        </View>
                    </View>
                    <View style={styles.impactBadgeWrapper}>
                        <LinearGradient
                            colors={impactScore > 0 ? ['#10B981', '#059669'] : ['#64748B', '#475569']}
                            style={styles.impactBadge}
                        >
                            <Text style={styles.impactBadgeText}>
                                {impactScore > 0 ? `+${impactScore.toFixed(1)}% Potential Improvement` : 'Profile Already Optimized'}
                            </Text>
                        </LinearGradient>
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

                        {detailedRecommendations.map((rec, index) => (
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
                                        <Text style={styles.impactChipText}>+{rec.impact}%</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.recBodyBox}>
                                    <View style={styles.valuesRow}>
                                        <View style={styles.valueBox}>
                                            <Text style={styles.valueLabel}>Current</Text>
                                            <Text style={[styles.valueNum, { color: '#EF4444' }]}>{rec.current} {rec.unit}</Text>
                                        </View>
                                        <Text style={styles.arrow}>→</Text>
                                        <View style={styles.valueBox}>
                                            <Text style={styles.valueLabel}>Target</Text>
                                            <Text style={[styles.valueNum, { color: '#10B981' }]}>{rec.target} {rec.unit}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.foodTipBox}>
                                    <Text style={styles.foodTipIcon}>🍽️</Text>
                                    <Text style={styles.foodTipText}>{rec.food_tip}</Text>
                                </View>
                            </View>
                        ))}
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
                    onPress={() => navigation.navigate('WellnessHome')}
                >
                    <Text style={styles.primaryButtonText}>Sync to Health Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.secondaryButtonText}>Modify Input Data</Text>
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
    scoreCard: {
        alignItems: 'center',
        marginTop: -50,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 24,
    },
    scoreItem: {
        alignItems: 'center',
        flex: 1,
    },
    scoreDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
    },
    scoreLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    scoreValue: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#0F172A',
    },
    impactBadgeWrapper: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    impactBadge: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    impactBadgeText: {
        color: '#FFFFFF',
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        letterSpacing: 0.5,
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

