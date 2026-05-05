import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity, StatusBar, Platform, Animated, ActivityIndicator, Alert, Image } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient as SvgGradient, Stop, Shadow } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');
const API_URL = 'http://127.0.0.1:8000';

// Circular Progress Component
const SuccessRing = ({ percentage = 68 }) => {
    const radius = 90;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={styles.ringContainer}>
            <View style={styles.ringGlow} />
            <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                <Defs>
                    <SvgGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#2DD4BF" />
                        <Stop offset="100%" stopColor="#0D9488" />
                    </SvgGradient>
                </Defs>
                <G rotation="-90" origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}>
                    <Circle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke="rgba(241, 245, 249, 0.5)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke="url(#ringGradient)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            <View style={styles.ringTextContainer}>
                <Text style={styles.ringPercentage}>
                    {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}%
                </Text>
                <Text style={styles.ringLabel}>Confidence</Text>
            </View>
        </View>
    );
};

// Horizontal Bar Chart Component
const FactorBar = ({ label, value, color }) => (
    <View style={styles.factorRow}>
        <View style={styles.factorLabelWrapper}>
            <Text style={styles.factorLabel}>{label}</Text>
            <Text style={styles.factorValueText}>{value}</Text>
        </View>
        <View style={styles.factorBarBg}>
            <LinearGradient
                colors={[color, color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.factorBarFill, { width: value }]}
            />
        </View>
    </View>
);

// Journey Step Component
const JourneyStep = ({ label, isCompleted, isCurrent, isLast }) => (
    <View style={styles.journeyStep}>
        <View style={styles.journeyLeft}>
            <View style={[
                styles.journeyNode, 
                isCompleted && styles.nodeCompleted,
                isCurrent && styles.nodeCurrent
            ]}>
                {isCompleted ? (
                    <Text style={styles.nodeIcon}>✓</Text>
                ) : isCurrent ? (
                    <View style={styles.nodeCurrentInner} />
                ) : (
                    <View style={styles.nodePendingInner} />
                )}
            </View>
            {!isLast && <View style={[styles.journeyLine, isCompleted && styles.lineCompleted]} />}
        </View>
        <View style={styles.journeyContent}>
            <Text style={[
                styles.journeyLabel, 
                (isCompleted || isCurrent) ? styles.labelActive : styles.labelPending
            ]}>{label}</Text>
            {isCurrent && <Text style={styles.currentTag}>In Progress</Text>}
        </View>
    </View>
);

// Composite Score Integration Card — Matches existing teal/white design
const CompositeScoreCard = ({ compositeData, navigation, nutritionActive, wellnessActive }) => {
    if (!compositeData) return null;

    const { compositeScore, baselineScore, components, completedCount, totalComponents, integrationLevel } = compositeData;
    const delta = compositeScore - baselineScore;

    return (
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            {/* Teal Header Strip */}
            <LinearGradient
                colors={['#0F766E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.compositeHeaderStrip}
            >
                <View style={styles.compositeHeaderInner}>
                    <View>
                        <Text style={styles.compositeTitle}>Composite IVF Score</Text>
                        <Text style={styles.compositeSubtitle}>Multi-Model Prediction Engine</Text>
                    </View>
                    <View style={styles.compositeModuleBadge}>
                        <Text style={styles.compositeModuleBadgeText}>{completedCount}/{totalComponents}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={{ padding: 24 }}>
                {/* Score Display */}
                <View style={styles.compositeScoreRow}>
                    <View style={styles.compositeScoreMain}>
                        <Text style={styles.compositeScoreValue}>
                            {compositeScore.toFixed(1)}
                            <Text style={styles.compositeScorePercent}>%</Text>
                        </Text>
                        {delta !== 0 && (
                            <View style={[styles.compositeDelta, delta > 0 ? styles.compositeDeltaPositive : styles.compositeDeltaNegative]}>
                                <Text style={[styles.compositeDeltaText, delta > 0 ? { color: '#0D9488' } : { color: '#EF4444' }]}>
                                    {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.compositeScoreLabel}>Adjusted Success Probability</Text>
                </View>

                <View style={styles.divider} />

                {/* Component Breakdown */}
                <Text style={[styles.sectionHeaderSub, { marginBottom: 12 }]}>Module Breakdown</Text>
                <View style={styles.compositeBreakdown}>
                    {components.map((comp, idx) => (
                        <View key={idx} style={[
                            styles.compositeCompRow,
                            idx === components.length - 1 && { borderBottomWidth: 0 }
                        ]}>
                            <View style={styles.compositeCompLeft}>
                                <View style={[styles.compositeCompIconBox, {
                                    backgroundColor: comp.status === 'completed' ? '#F0FDFA' : '#F8FAFC'
                                }]}>
                                    <Text style={styles.compositeCompIcon}>{comp.icon}</Text>
                                </View>
                                <View>
                                    <Text style={styles.compositeCompName}>{comp.name}</Text>
                                    <Text style={styles.compositeCompStatusText}>
                                        {comp.status === 'completed' ? 'Analysis Complete' : 'Awaiting Input'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.compositeCompRight}>
                                {comp.status === 'completed' ? (
                                    <View style={styles.compositeCompScoreBox}>
                                        <Text style={[
                                            styles.compositeCompScore,
                                            { color: comp.name === 'Clinical IVF' ? '#0D9488' 
                                                   : comp.score > 0 ? '#10B981' 
                                                   : comp.score < 0 ? '#EF4444' 
                                                   : '#94A3B8' }
                                        ]}>
                                            {comp.name === 'Clinical IVF' 
                                                ? `${comp.score.toFixed(1)}%` 
                                                : `${comp.score > 0 ? '+' : ''}${comp.score.toFixed(1)}%`}
                                        </Text>
                                        <View style={styles.compositeCheckmark}>
                                            <Text style={styles.compositeCheckmarkText}>✓</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.compositePendingBtn}
                                        onPress={() => {
                                            if (comp.name === 'Nutrition') {
                                                navigation.navigate('Nutrition');
                                            } else if (comp.name === 'Wellness') {
                                                navigation.navigate('Wellness');
                                            }
                                        }}
                                    >
                                        <Text style={styles.compositePendingText}>Setup →</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Data Flow Pipeline */}
                <View style={styles.dataFlowContainer}>
                    <View style={styles.dataFlowRow}>
                        <View style={[styles.dataFlowDot, { backgroundColor: '#0D9488' }]} />
                        <View style={[styles.dataFlowLine, { backgroundColor: nutritionActive ? '#0D9488' : '#E2E8F0' }]} />
                        <View style={[styles.dataFlowDot, { backgroundColor: nutritionActive ? '#F59E0B' : '#E2E8F0' }]} />
                        <View style={[styles.dataFlowLine, { backgroundColor: wellnessActive ? '#0D9488' : '#E2E8F0' }]} />
                        <View style={[styles.dataFlowDot, { backgroundColor: wellnessActive ? '#8B5CF6' : '#E2E8F0' }]} />
                    </View>
                    <View style={styles.dataFlowLabels}>
                        <Text style={[styles.dataFlowLabel, { color: '#0D9488' }]}>Clinical</Text>
                        <Text style={[styles.dataFlowLabel, { color: nutritionActive ? '#F59E0B' : '#94A3B8' }]}>Nutrition</Text>
                        <Text style={[styles.dataFlowLabel, { color: wellnessActive ? '#8B5CF6' : '#94A3B8' }]}>Wellness</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function ResultScreen({ navigation, route }) {
    const params = route.params || {};
    console.log('ResultScreen received params:', params);

    const getVal = (val, defaultValue) => {
        if (val === undefined || val === null || val === '') return defaultValue;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? defaultValue : parsed;
    };

    const currentAge = getVal(params.age, 34);
    const ageFactor = Math.max(10, Math.min(95, ((50 - currentAge) / 32) * 100));

    const currentAmh = getVal(params.amh_level || params.amhLevel, 2.0);
    const amhFactor = Math.max(10, Math.min(95, (currentAmh / 5) * 100));

    const currentBmi = getVal(params.bmi, 22.0);
    const bmiFactor = Math.max(10, Math.min(95, (1 - Math.abs(22 - currentBmi) / 20) * 100));

    const currentFrag = getVal(params.d3_fragmentation || params.freshD3Fragmentation, 10);
    const fragFactor = Math.max(10, Math.min(95, ((30 - currentFrag) / 30) * 100));

    const successRate = params.predictionSuccess !== undefined ? parseFloat(params.predictionSuccess) : 48.0;

    const [doctorAdvice, setDoctorAdvice] = useState(null);
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    // Cross-component integration: get data from all 3 modules
    const { clinicalScore, nutritionScore, wellnessData, getCompositeScore, setClinicalScore } = useAppContext();
    
    // Fallback: if clinicalScore wasn't set in context (e.g. hot reload), set it from params
    React.useEffect(() => {
        if (!clinicalScore && successRate > 0) {
            setClinicalScore({
                score: successRate,
                status: successRate >= 50 ? 'Success' : 'Failure',
                params: params
            });
        }
    }, [clinicalScore, successRate]);

    const compositeData = getCompositeScore();
    const nutritionActive = !!nutritionScore;
    const wellnessActive = !!wellnessData;

    const fetchDoctorRecommendation = async () => {
        setLoadingAdvice(true);
        setDoctorAdvice(null);
        try {
            const response = await fetch(`${API_URL}/api/recommend_clinical`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseline_probability: successRate,
                    age: parseFloat(params.age) || 30,
                    amh_level: parseFloat(params.amh_level || params.amhLevel) || 2.0,
                    bmi: parseFloat(params.bmi) || 22.0,
                    prior_sab: parseInt(params.prior_sab || params.priorSAB) || 0,
                    cell_quality: parseFloat(params.d3_fragmentation || params.freshD3Fragmentation) || 10.0
                })
            });
            const result = await response.json();
            setDoctorAdvice(result.recommendation);
        } catch (error) {
            Alert.alert('Connection Error', 'Make sure Ollama is running locally with medllama2 model.');
            setDoctorAdvice('Could not connect to the medical AI. Please ensure Ollama is running.');
        } finally {
            setLoadingAdvice(false);
        }
    };
    
    // Helper function to render AI advice with structure
    const renderAdviceContent = (text) => {
        if (!text) return null;
        
        // Split by double newlines or single newlines that look like list starts
        const sections = text.split(/\n\n|\n(?=[•\-\*\d\.])/);
        
        return sections.map((section, idx) => {
            const trimmed = section.trim();
            if (!trimmed) return null;
            
            // Check if it's a list (starts with •, -, *, or 1.)
            const isBullet = /^[•\-\*\d]/.test(trimmed);
            
            if (isBullet) {
                // Split internal lines if it's a block of bullets
                const items = trimmed.split('\n');
                return (
                    <View key={`section-${idx}`} style={styles.adviceList}>
                        {items.map((item, i) => {
                            const cleanItem = item.replace(/^[•\-\*\s\d\.]+/, '').trim();
                            if (!cleanItem) return null;
                            return (
                                <View key={`item-${i}`} style={styles.adviceBulletWrapper}>
                                    <View style={styles.adviceBulletDot} />
                                    <Text style={styles.adviceBulletText}>{cleanItem}</Text>
                                </View>
                            );
                        })}
                    </View>
                );
            }
            
            // Render regular paragraph
            return (
                <Text key={`section-${idx}`} style={styles.adviceParagraph}>
                    {trimmed}
                </Text>
            );
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Immersive Background */}
            <LinearGradient
                colors={['#0F766E', '#0D9488', '#0F766E']}
                style={styles.headerBackground}
            />

            {/* Decorative Glassmorphism Circles */}
            <View style={[styles.bgCircle, { top: -40, right: -40, width: 220, height: 220, opacity: 0.1 }]} />
            <View style={[styles.bgCircle, { top: 100, left: -60, width: 180, height: 180, opacity: 0.05 }]} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Assessment Report</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.introSection}>
                        <Text style={styles.headerTitle}>Your Personalized Results</Text>
                        <Text style={styles.headerSubtitle}>Based on your unique profile, {params.name || 'User'}</Text>
                    </View>

                    {/* Main Results — Unified Card */}
                    <View style={[styles.card, styles.resultCard]}>
                        <View style={styles.cardHeader}>
                             <View style={styles.tag}>
                                 <Text style={styles.tagText}>Clinical AI Analysis</Text>
                             </View>
                             <Text style={styles.sectionHeader}>IVF Success Probability</Text>
                        </View>

                        <SuccessRing percentage={compositeData ? compositeData.compositeScore : successRate} />
                        
                        {/* Show delta if composite differs from baseline */}
                        {compositeData && compositeData.compositeScore !== compositeData.baselineScore && (
                            <View style={styles.compositeDeltaRow}>
                                <Text style={styles.baselineLabel}>
                                    Clinical Baseline: {compositeData.baselineScore.toFixed(1)}%
                                </Text>
                                <View style={[styles.compositeDelta, styles.compositeDeltaPositive]}>
                                    <Text style={[styles.compositeDeltaText, { color: '#0D9488' }]}>
                                        ▲ {(compositeData.compositeScore - compositeData.baselineScore).toFixed(1)}% adjusted
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />
                        
                        <View style={styles.cardHeader}>
                            <Text style={styles.sectionHeaderSub}>Key Influencing Factors</Text>
                            <Text style={styles.impactLabel}>Overall Impact</Text>
                        </View>
                        <View style={styles.factorsContainer}>
                            <FactorBar label="Age" value={`${ageFactor.toFixed(0)}%`} color="#0D9488" />
                            <FactorBar label="AMH Level" value={`${amhFactor.toFixed(0)}%`} color="#F97316" />
                            <FactorBar label="BMI Index" value={`${bmiFactor.toFixed(0)}%`} color="#8B5CF6" />
                            <FactorBar label="Cell Quality" value={`${fragFactor.toFixed(0)}%`} color="#10B981" />
                        </View>

                        {/* Module Integration Section — inside same card */}
                        {compositeData && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.cardHeader}>
                                    <Text style={styles.sectionHeaderSub}>Module Integration</Text>
                                    <View style={styles.compositeModuleBadgeSmall}>
                                        <Text style={styles.compositeModuleBadgeSmallText}>
                                            {compositeData.completedCount}/{compositeData.totalComponents}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.compositeBreakdown}>
                                    {compositeData.components.map((comp, idx) => (
                                        <View key={idx} style={[
                                            styles.compositeCompRow,
                                            idx === compositeData.components.length - 1 && { borderBottomWidth: 0 }
                                        ]}>
                                            <View style={styles.compositeCompLeft}>
                                                <View style={[styles.compositeCompIconBox, {
                                                    backgroundColor: comp.status === 'completed' ? '#F0FDFA' : '#F8FAFC'
                                                }]}>
                                                    <Text style={styles.compositeCompIcon}>{comp.icon}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.compositeCompName}>{comp.name}</Text>
                                                    <Text style={styles.compositeCompStatusText}>
                                                        {comp.status === 'completed' ? 'Analysis Complete' : 'Awaiting Input'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.compositeCompRight}>
                                                {comp.status === 'completed' ? (
                                                    <View style={styles.compositeCompScoreBox}>
                                                        <Text style={[
                                                            styles.compositeCompScore,
                                                            { color: comp.name === 'Clinical IVF' ? '#0D9488' 
                                                                   : comp.score > 0 ? '#10B981' 
                                                                   : comp.score < 0 ? '#EF4444' 
                                                                   : '#94A3B8' }
                                                        ]}>
                                                            {comp.name === 'Clinical IVF' 
                                                                ? `${comp.score.toFixed(1)}%` 
                                                                : `${comp.score > 0 ? '+' : ''}${comp.score.toFixed(1)}%`}
                                                        </Text>
                                                        <View style={styles.compositeCheckmark}>
                                                            <Text style={styles.compositeCheckmarkText}>✓</Text>
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity 
                                                        style={styles.compositePendingBtn}
                                                        onPress={() => {
                                                            if (comp.name === 'Nutrition') {
                                                                navigation.navigate('Nutrition');
                                                            } else if (comp.name === 'Wellness') {
                                                                navigation.navigate('Wellness');
                                                            }
                                                        }}
                                                    >
                                                        <Text style={styles.compositePendingText}>Setup →</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Data Flow Pipeline */}
                                <View style={styles.dataFlowContainer}>
                                    <View style={styles.dataFlowRow}>
                                        <View style={[styles.dataFlowDot, { backgroundColor: '#0D9488' }]} />
                                        <View style={[styles.dataFlowLine, { backgroundColor: nutritionActive ? '#0D9488' : '#E2E8F0' }]} />
                                        <View style={[styles.dataFlowDot, { backgroundColor: nutritionActive ? '#F59E0B' : '#E2E8F0' }]} />
                                        <View style={[styles.dataFlowLine, { backgroundColor: wellnessActive ? '#0D9488' : '#E2E8F0' }]} />
                                        <View style={[styles.dataFlowDot, { backgroundColor: wellnessActive ? '#8B5CF6' : '#E2E8F0' }]} />
                                    </View>
                                    <View style={styles.dataFlowLabels}>
                                        <Text style={[styles.dataFlowLabel, { color: '#0D9488' }]}>Clinical</Text>
                                        <Text style={[styles.dataFlowLabel, { color: nutritionActive ? '#F59E0B' : '#94A3B8' }]}>Nutrition</Text>
                                        <Text style={[styles.dataFlowLabel, { color: wellnessActive ? '#8B5CF6' : '#94A3B8' }]}>Wellness</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>



                {/* Journey Section */}
                <View style={[styles.card, styles.journeyCard]}>
                    <Text style={styles.sectionHeaderSub}>Your IVF Journey</Text>
                    <View style={styles.journeyContainer}>
                        <JourneyStep label="Initial Consultation" isCompleted />
                        <JourneyStep label="Stimulation Phase" isCompleted />
                        <JourneyStep label="Post-Lab Analysis" isCurrent />
                        <JourneyStep label="Pre-Transfer" isLast />
                    </View>
                </View>

                {/* Patient Profile Section */}
                <View style={styles.card}>
                    <Text style={[styles.sectionHeaderSub, { marginBottom: 16 }]}>Clinical Profile Summary</Text>
                    <View style={styles.profileGrid}>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>Age</Text>
                            <Text style={styles.profileValue}>{currentAge} yrs</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>AMH</Text>
                            <Text style={styles.profileValue}>{currentAmh.toFixed(1)} ng/mL</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>BMI</Text>
                            <Text style={styles.profileValue}>{currentBmi.toFixed(1)}</Text>
                        </View>
                        <View style={styles.profileItem}>
                            <Text style={styles.profileLabel}>Prior SAB</Text>
                            <Text style={styles.profileValue}>{getVal(params.prior_sab || params.priorSAB, 0)}</Text>
                        </View>
                    </View>
                </View>

                {/* New Premium Doctor Consultation Card */}
                <View style={styles.ctaCardWrapper}>
                    <LinearGradient
                        colors={['#0F766E', '#0D9488']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaCard}
                    >
                        <View style={styles.ctaLeft}>
                            <Text style={styles.ctaTitle}>Get Clinical{"\n"}Recommendation</Text>
                            <Text style={styles.ctaSubtitle}>Personalized AI medical insights</Text>
                            
                            <TouchableOpacity
                                style={styles.ctaButton}
                                onPress={fetchDoctorRecommendation}
                                disabled={loadingAdvice}
                            >
                                <View style={styles.ctaButtonInner}>
                                    {loadingAdvice ? (
                                        <ActivityIndicator color="#0D9488" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.ctaButtonIcon}>🩺</Text>
                                            <Text style={styles.ctaButtonText}>Get Now</Text>
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.ctaImageContainer}>
                            <Image 
                                source={require('../../assets/ai_doctor.png')} 
                                style={styles.ctaImage}
                                resizeMode="contain"
                            />
                        </View>
                    </LinearGradient>
                </View>

                {/* Doctor Advice Response */}
                {doctorAdvice && (
                    <View style={styles.doctorCard}>
                        <View style={styles.doctorCardHeader}>
                            <Image 
                                source={require('../../assets/ai_doctor.png')} 
                                style={styles.doctorAvatarSmall} 
                            />
                            <View>
                                <Text style={styles.doctorName}>MedLLaMA2 AI Doctor</Text>
                                <Text style={styles.doctorSubtitleSmall}>Personalized Medical Advice</Text>
                            </View>
                        </View>
                        <View style={styles.doctorDivider} />
                        <View style={styles.adviceContentContainer}>
                            {renderAdviceContent(doctorAdvice)}
                        </View>
                        <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerText}>⚠️ This is AI-generated advice. Always consult a qualified healthcare professional before making medical decisions.</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.45,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    bgCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 999,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 22,
        color: '#FFFFFF',
    },
    navTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    introSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        paddingHorizontal: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'PlusJakartaSans_500Medium',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    scrollContainer: {
        flex: 1,
        zIndex: 10,
        elevation: 5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        ...theme.shadows.premium,
        marginBottom: 24,
    },
    resultCard: {
        alignItems: 'center',
        padding: 24,
        marginTop: -10, // Slight overlap for the card specifically
    },
    cardHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    tag: {
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 10,
    },
    tagText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    sectionHeaderSub: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
        alignSelf: 'flex-start',
    },
    impactLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#94A3B8',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    ringTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    ringGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(13, 148, 136, 0.08)',
    },
    ringPercentage: {
        fontSize: 56,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#0D9488',
        letterSpacing: -2,
    },
    ringLabel: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: 'PlusJakartaSans_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: -4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        width: '100%',
        marginVertical: 24,
    },
    factorsContainer: {
        width: '100%',
    },
    factorRow: {
        marginBottom: 20,
    },
    factorLabelWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    factorLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#475569',
    },
    factorValueText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F172A',
    },
    factorBarBg: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    factorBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    journeyCard: {
        paddingTop: 24,
    },
    journeyContainer: {
        paddingLeft: 4,
    },
    journeyStep: {
        flexDirection: 'row',
        minHeight: 60,
    },
    journeyLeft: {
        alignItems: 'center',
        marginRight: 20,
        width: 24,
    },
    journeyNode: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    nodeCompleted: {
        backgroundColor: '#0D9488',
    },
    nodeCurrent: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#0D9488',
    },
    nodeIcon: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    nodeCurrentInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0D9488',
    },
    nodePendingInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CBD5E1',
    },
    journeyLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: -2,
    },
    lineCompleted: {
        backgroundColor: '#0D9488',
    },
    journeyContent: {
        flex: 1,
        paddingBottom: 30,
        paddingTop: 2,
    },
    journeyLabel: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    labelActive: {
        color: '#0F172A',
    },
    labelPending: {
        color: '#94A3B8',
    },
    currentTag: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
        textTransform: 'uppercase',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    profileItem: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    profileLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 6,
        fontFamily: 'PlusJakartaSans_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    profileValue: {
        fontSize: 15,
        color: '#0F172A',
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    ctaCardWrapper: {
        marginBottom: 24,
        borderRadius: 28,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    ctaCard: {
        flexDirection: 'row',
        padding: 24,
        minHeight: 240, // Increased to provide more head room
        alignItems: 'center',
    },
    ctaLeft: {
        flex: 1.2,
        zIndex: 2,
    },
    ctaTitle: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#FFFFFF',
        lineHeight: 28,
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 20,
    },
    ctaButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        ...theme.shadows.soft,
    },
    ctaButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaButtonIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    ctaButtonText: {
        color: '#0D9488',
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    ctaImageContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: -20,
        width: '60%',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    ctaImage: {
        width: '100%',
        height: '100%',
    },
    doctorAvatarSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        backgroundColor: '#F1F5F9',
    },
    doctorSubtitleSmall: {
        fontSize: 12,
        color: '#0D9488',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    doctorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9D5FF',
        ...theme.shadows.soft,
    },
    doctorCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    doctorAvatar: {
        fontSize: 32,
        marginRight: 14,
    },
    doctorName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#5B21B6',
    },
    doctorSubtitle: {
        fontSize: 12,
        color: '#7C3AED',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    doctorDivider: {
        height: 1,
        backgroundColor: '#F3E8FF',
        marginBottom: 16,
    },
    adviceContentContainer: {
        marginBottom: 16,
    },
    adviceParagraph: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
        fontFamily: 'PlusJakartaSans_400Regular',
        marginBottom: 12,
    },
    adviceList: {
        marginBottom: 12,
        paddingLeft: 4,
    },
    adviceBulletWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    adviceBulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0D9488',
        marginTop: 9,
        marginRight: 12,
    },
    adviceBulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    disclaimerBox: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
    },
    disclaimerText: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 16,
        fontFamily: 'PlusJakartaSans_500Medium',
    },

    // === COMPOSITE SCORE CARD STYLES ===
    compositeDeltaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 4,
        gap: 10,
    },
    baselineLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#94A3B8',
    },
    compositeModuleBadgeSmall: {
        backgroundColor: '#F0FDFA',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    compositeModuleBadgeSmallText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
    },
    compositeHeaderStrip: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    compositeHeaderInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    compositeModuleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    compositeModuleBadgeText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
    },
    compositeTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    compositeSubtitle: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    compositeScoreRow: {
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    compositeScoreMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compositeScoreValue: {
        fontSize: 44,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F766E',
        letterSpacing: -2,
    },
    compositeScorePercent: {
        fontSize: 24,
        color: '#94A3B8',
    },
    compositeScoreLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
        marginTop: 4,
    },
    compositeDelta: {
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    compositeDeltaPositive: {
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    compositeDeltaNegative: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    compositeDeltaText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    sectionHeaderSub: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    compositeBreakdown: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    compositeCompRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    compositeCompLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compositeCompIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    compositeCompIcon: {
        fontSize: 18,
    },
    compositeCompName: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
    },
    compositeCompStatusText: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#94A3B8',
        marginTop: 1,
    },
    compositeCompRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compositeCompScoreBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compositeCompScore: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
        marginRight: 8,
    },
    compositeCheckmark: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#99F6E4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    compositeCheckmarkText: {
        color: '#0D9488',
        fontSize: 11,
        fontWeight: '800',
    },
    compositePendingBtn: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    compositePendingText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0D9488',
    },
    dataFlowContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    dataFlowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    dataFlowDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    dataFlowLine: {
        width: 50,
        height: 3,
        borderRadius: 2,
        marginHorizontal: 4,
    },
    dataFlowLabels: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    dataFlowLabel: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
