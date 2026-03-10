import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Dimensions,
    TouchableOpacity
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

// Circular Progress Component
const SuccessRing = ({ percentage = 68 }) => {
    const radius = 80;
    const strokeWidth = 15;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={styles.ringContainer}>
            <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                <G rotation="-90" origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}>
                    <Circle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke="#E0E0E0"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke={theme.colors.primary}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={styles.ringTextContainer}>
                <Text style={styles.ringPercentage}>{percentage}%</Text>
                <Text style={styles.ringLabel}>Success Rate</Text>
            </View>
        </View>
    );
};

// Horizontal Bar Chart Component
const FactorBar = ({ label, value, color }) => (
    <View style={styles.factorRow}>
        <Text style={styles.factorLabel}>{label}</Text>
        <View style={styles.factorBarBg}>
            <View style={[styles.factorBarFill, { width: value, backgroundColor: color }]} />
        </View>
    </View>
);

// Journey Step Component
const JourneyStep = ({ icon, label, isLast }) => (
    <View style={styles.journeyStep}>
        <View style={styles.journeyLeft}>
            <View style={[styles.journeyIconCircle, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFF' }}>✓</Text>
            </View>
            {!isLast && <View style={styles.journeyLine} />}
        </View>
        <View style={styles.journeyContent}>
            <Text style={styles.journeyLabel}>{label}</Text>
        </View>
    </View>
);

const JourneyStepPending = ({ icon, label, isLast }) => (
    <View style={styles.journeyStep}>
        <View style={styles.journeyLeft}>
            <View style={[styles.journeyIconCircle, { backgroundColor: '#FFCC80' }]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
            </View>
            {!isLast && <View style={[styles.journeyLine, { backgroundColor: '#E0E0E0' }]} />}
        </View>
        <View style={styles.journeyContent}>
            <Text style={styles.journeyLabel}>{label}</Text>
        </View>
    </View>
);

export default function ResultScreen({ navigation, route }) {
    const params = route.params || {};

    // Calculate visual factor widths based on real data ranges
    // Age: 18-50 (lower is better) -> (50-age)/(50-18) * 100
    const ageFactor = Math.max(10, Math.min(95, ((50 - (parseFloat(params.age) || 34)) / 32) * 100));

    // AMH: 0.1-5.0 (higher is better) -> amh/5.0 * 100
    const amhFactor = Math.max(10, Math.min(95, ((parseFloat(params.amh_level || params.amhLevel) || 2) / 5) * 100));

    // BMI Index (Visual representation)
    const bmiVal = parseFloat(params.bmi) || 22.0;
    const bmiFactor = Math.max(10, Math.min(95, (1 - Math.abs(22 - bmiVal) / 20) * 100));

    // Fragmentation (Visual representation)
    const fragVal = parseFloat(params.d3_fragmentation || params.freshD3Fragmentation) || 10;
    const fragFactor = Math.max(10, Math.min(95, ((30 - fragVal) / 30) * 100));

    const successRate = params.predictionSuccess !== undefined ? Math.round(params.predictionSuccess) : 59;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerPanel}>
                <Text style={styles.headerTitle}>Your Personalized Results</Text>
                <Text style={styles.headerSubtitle}>Based on your unique profile, {params.name || 'User'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.resultCard}>
                    <Text style={styles.sectionTitle}>IVF Success Probability</Text>
                    <SuccessRing percentage={successRate} />
                    <View style={styles.separator} />
                    <Text style={styles.sectionTitleAlignLeft}>Key Influencing Factors</Text>
                    <View style={styles.factorsContainer}>
                        <FactorBar label="Age" value={`${ageFactor.toFixed(0)}%`} color="#4DB6AC" />
                        <FactorBar label="AMH Level" value={`${amhFactor.toFixed(0)}%`} color="#FF8A65" />
                        <FactorBar label="BMI Index" value={`${bmiFactor.toFixed(0)}%`} color="#BA68C8" />
                        <FactorBar label="Cell Quality" value={`${fragFactor.toFixed(0)}%`} color="#81C784" />
                    </View>
                </View>
                <View style={styles.card}>
                    <Text style={[styles.sectionTitleAlignLeft, { marginBottom: 20 }]}>Your IVF Journey</Text>
                    <JourneyStep label="Initial Consultation" />
                    <JourneyStep label="Stimulation Phase" />
                    <JourneyStepPending label="Post-Lab Analysis" />
                    <JourneyStepPending label="Pre-Transfer" isLast />
                </View>

                {/* Patient Profile Section - To show "Original Data" */}
                <View style={styles.card}>
                    <Text style={[styles.sectionTitleAlignLeft, { marginBottom: 16 }]}>Clinical Profile Summary</Text>
                    <View style={styles.profileGrid}>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>Age</Text>
                            <Text style={styles.profileValue}>{params.age || '34'} yrs</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>AMH</Text>
                            <Text style={styles.profileValue}>{params.amh_level || params.amhLevel || '2.0'} ng/mL</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>BMI</Text>
                            <Text style={styles.profileValue}>{params.bmi || '22.0'}</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>Prior SAB</Text>
                            <Text style={styles.profileValue}>{params.prior_sab || params.priorSAB || '0'}</Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.heading}>Your Next Steps</Text>
                <Text style={styles.subHeading}>Now that you have your prediction, let's work together to optimize your fertility journey.</Text>
                <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Nutrition')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
                        <Text style={{ fontSize: 24 }}>🍃</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Improve Your Foundation</Text>
                        <Text style={styles.actionDesc}>Start Your Personalized Nutrition Plan</Text>
                    </View>
                    <Text style={{ color: theme.colors.primary, fontSize: 20 }}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                    <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                        <Text style={{ fontSize: 24 }}>🧠</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>Support Your Well-being</Text>
                        <Text style={styles.actionDesc}>Open Your Psychological Wellness Hub</Text>
                    </View>
                    <Text style={{ color: '#CE93D8', fontSize: 20 }}>→</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerPanel: {
        backgroundColor: theme.colors.primary,
        paddingTop: theme.spacing.xl,
        paddingBottom: 60,
        paddingHorizontal: theme.spacing.l,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: -40,
        zIndex: 0,
        ...theme.shadows.medium,
    },
    headerTitle: { ...theme.typography.heading, color: '#FFFFFF', fontSize: 22, marginBottom: 8, textAlign: 'center' },
    headerSubtitle: { ...theme.typography.subheading, color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
    scrollContent: { paddingHorizontal: theme.spacing.m, paddingTop: 0 },
    resultCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.l, marginBottom: 20, ...theme.shadows.medium, alignItems: 'center' },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: theme.spacing.l, marginBottom: 24, ...theme.shadows.soft },
    sectionTitle: { ...theme.typography.heading, fontSize: 18, marginBottom: 24 },
    sectionTitleAlignLeft: { ...theme.typography.heading, fontSize: 16, alignSelf: 'flex-start', marginBottom: 16 },
    ringContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    ringTextContainer: { position: 'absolute', alignItems: 'center' },
    ringPercentage: { fontSize: 56, fontWeight: '700', color: theme.colors.text, fontVariant: ['tabular-nums'] },
    ringLabel: { fontSize: 14, color: theme.colors.textLight, marginTop: 4 },
    separator: { height: 1, backgroundColor: theme.colors.inputBorder, width: '100%', marginBottom: 24 },
    factorsContainer: { width: '100%' },
    factorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    factorLabel: { width: 70, fontSize: 13, color: theme.colors.textLight, textAlign: 'right', marginRight: 12, fontWeight: '500' },
    factorBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.colors.inputBackground },
    factorBarFill: { height: '100%', borderRadius: 4 },
    journeyStep: { flexDirection: 'row', marginBottom: 0 },
    journeyLeft: { alignItems: 'center', marginRight: 16, width: 24 },
    journeyIconCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    journeyLine: { width: 2, flex: 1, backgroundColor: theme.colors.primary, minHeight: 30, marginVertical: -2 },
    journeyContent: { paddingBottom: 32, justifyContent: 'center', flex: 1 },
    journeyLabel: { fontSize: 15, color: theme.colors.text, fontWeight: '500', marginTop: -2 },
    heading: { ...theme.typography.heading, fontSize: 18, marginBottom: 8, marginLeft: 4 },
    subHeading: { ...theme.typography.subheading, fontSize: 14, marginBottom: 20, marginLeft: 4 },
    actionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.l, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', ...theme.shadows.soft },
    iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    actionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
    actionDesc: { fontSize: 12, color: theme.colors.textLight },
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    profileItem: {
        width: '48%',
        backgroundColor: '#F7F9FC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    profileLabel: {
        fontSize: 12,
        color: '#718096',
        marginBottom: 4,
        fontWeight: '600',
    },
    profileValue: {
        fontSize: 15,
        color: '#2D3748',
        fontWeight: '700',
    }
});
