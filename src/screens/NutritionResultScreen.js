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
        impactScore = 0
    } = params;

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

                {/* Recommendations Section */}
                <View style={styles.sectionHeaderBox}>
                    <Text style={styles.sectionHeader}>Precision Interventions</Text>
                </View>

                <View style={styles.recommendationCard}>
                    <View style={styles.recHeader}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.recIcon}>💊</Text>
                        </View>
                        <View>
                            <Text style={styles.recTitle}>Micronutrient Upscaling</Text>
                            <Text style={styles.recSub}>Suggested biochemical adjustment</Text>
                        </View>
                    </View>
                    
                    <View style={styles.recBodyBox}>
                        <Text style={styles.recBody}>
                            Based on your 24-marker profile, a <Text style={styles.highlight}>+20% strategic increase</Text> in Folate and Zinc is identified as the optimal intervention path.
                        </Text>
                        <Text style={styles.recBodySecondary}>
                            This biological shift is predicted to expand your implantation window and enhance cellular receptivity.
                        </Text>
                    </View>

                    <View style={styles.tagsRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>High Impact Folate</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Bio-available Zinc</Text>
                        </View>
                    </View>
                </View>

                {/* Technical Insight */}
                <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightText}>
                        Results synthesized from a <Text style={{fontWeight: '700'}}>24-feature Neural Ensemble</Text> trained on clinical cohorts for high-precision IVF outcome prediction.
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
        marginBottom: 32,
    },
    scoreCard: {
        alignItems: 'center',
        marginTop: -50, // Floating effect
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
        padding: 24,
        ...theme.shadows.soft,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    recHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    recIcon: {
        fontSize: 26,
    },
    recTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F172A',
    },
    recSub: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    recBodyBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    recBody: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
        marginBottom: 12,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    recBodySecondary: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    highlight: {
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.primary,
    },
    tagsRow: {
        flexDirection: 'row',
    },
    tag: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tagText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#475569',
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
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
