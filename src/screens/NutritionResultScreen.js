import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Dimensions,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');



export default function NutritionResultScreen({ navigation, route }) {
    const params = route.params || {};
    const {
        predictionSuccess = 15,
        optimizedProbability = 33,
        impactScore = 18
    } = params;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.headerPanel}>
                <TouchableOpacity
                    style={styles.backButtonTop}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonTopText}>← Return to Analysis</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Simulation Report</Text>
                <Text style={styles.headerSubtitle}>Personalized Nutri-Genomic Impact Analysis</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Impact Card - Focusing on Recommendation only */}
                <View style={[styles.card, styles.impactCard]}>
                    <Text style={styles.cardHeader}>Nutritional Simulation Result</Text>

                    <View style={styles.impactBadge}>
                        <Text style={styles.impactBadgeText}>📈 DIETARY IMPACT SCORE: +{impactScore.toFixed(1)}%</Text>
                    </View>

                    <Text style={styles.impactInfoText}>
                        Predicted success increase after Folate & Zinc intervention
                    </Text>
                </View>

                {/* Recommendations */}
                <Text style={styles.sectionTitle}>Precision Recommendations</Text>

                <View style={styles.recommendationCard}>
                    <View style={styles.recHeaderRow}>
                        <View style={styles.iconCircle}><Text style={{ fontSize: 20 }}>💊</Text></View>
                        <Text style={styles.recTitle}>Micronutrient Upscaling</Text>
                    </View>
                    <Text style={styles.recBody}>
                        Our Ensemble AI suggests a <Text style={{ fontWeight: '700', color: theme.colors.primary }}>+20% strategic increase</Text> in Folate and Zinc intake.
                        This biological adjustment is predicted to widen your implantation window by approximately <Text style={{ fontWeight: '700' }}>{impactScore.toFixed(1)}%</Text>.
                    </Text>
                    <View style={styles.nutrientDuo}>
                        <View style={styles.nutrientChip}><Text style={styles.chipText}>Increased Folate</Text></View>
                        <View style={styles.nutrientChip}><Text style={styles.chipText}>Increased Zinc</Text></View>
                    </View>
                </View>

                {/* Clinical Context */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        💡 These results are derived from a 24-feature Neural Ensemble model trained on NHANES clinical cohorts specifically for IVF outcome prediction.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('WellnessHome')}
                >
                    <Text style={styles.homeButtonText}>Save Report to Profile</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    headerPanel: {
        backgroundColor: theme.colors.primary,
        paddingTop: 50,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    backButtonTop: {
        marginBottom: 16,
    },
    backButtonTopText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    scrollContent: {
        paddingHorizontal: 20,
        marginTop: -30,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        ...theme.shadows.medium,
        marginBottom: 24,
    },
    impactCard: {
        alignItems: 'center',
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 24,
    },
    impactBadge: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#BEE3F8',
    },
    impactInfoText: {
        fontSize: 13,
        color: '#718096',
        marginTop: 16,
        fontWeight: '500',
    },
    impactBadgeText: {
        color: '#2B6CB0',
        fontWeight: '800',
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3748',
        marginBottom: 16,
        marginLeft: 4,
    },
    recommendationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderLeftWidth: 6,
        borderLeftColor: theme.colors.primary,
        ...theme.shadows.soft,
        marginBottom: 20,
    },
    recHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    recTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A202C',
    },
    recBody: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4A5568',
        marginBottom: 16,
    },
    nutrientDuo: {
        flexDirection: 'row',
    },
    nutrientChip: {
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#718096',
    },
    infoBox: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        marginBottom: 30,
    },
    infoText: {
        fontSize: 12,
        color: '#718096',
        lineHeight: 18,
    },
    homeButton: {
        backgroundColor: '#2D3748',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    homeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    }
});
