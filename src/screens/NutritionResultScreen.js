import React, { useState } from 'react';
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

// Helper function to format HRV exactly as it should appear
const formatHRV = (hrv) => {
    if (!hrv) return '0';
    // Round to whole number to match smartwatch display
    return Math.round(Number(hrv)).toString();
};

// Helper function to format numbers with commas for readability
const formatNumber = (num) => {
    if (!num) return '0';
    return Number(num).toLocaleString();
};

// Generate historical trend data for charts
const generateTrendData = (currentValue, days, type = 'improvement') => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        let value;
        if (type === 'improvement') {
            // Show gradual improvement over time
            const progressFactor = (days - i) / days;
            const startValue = currentValue * 0.7; // Started at 70% of current
            value = startValue + (currentValue - startValue) * progressFactor;
            // Add slight random variation
            value = value + (Math.random() - 0.5) * currentValue * 0.05;
        } else if (type === 'fluctuation') {
            // Show more variation (like HR, HRV)
            value = currentValue + (Math.random() - 0.5) * currentValue * 0.15;
        } else {
            // Stable with slight variation
            value = currentValue + (Math.random() - 0.5) * currentValue * 0.08;
        }
        
        data.push({
            date: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.max(0, value)
        });
    }
    
    return data;
};

// Calculate trend statistics
const calculateTrendStats = (data) => {
    if (!data || data.length < 2) return { change: 0, trend: 'stable' };
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    let trend = 'stable';
    if (change > 5) trend = 'improving';
    else if (change < -5) trend = 'declining';
    
    return { change: change.toFixed(1), trend };
};

// Generate nutrition score trend (shows improvement over time)
const generateNutritionScoreTrend = (currentScore, days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Simulate gradual improvement in nutrition score
        const progressFactor = (days - i) / days;
        const startScore = Math.max(20, currentScore - 25); // Started lower
        const score = startScore + (currentScore - startScore) * progressFactor;
        const withVariation = score + (Math.random() - 0.5) * 3;
        
        data.push({
            date: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.min(100, Math.max(0, withVariation))
        });
    }
    
    return data;
};

// Generate WHO-backed health recommendations based on biometric data
const generateWHORecommendations = (watchData) => {
    const recommendations = [];
    
    if (!watchData) return recommendations;

    // WHO Guideline: Sleep Duration
    // WHO recommends 7-9 hours for adults
    if (watchData.sleepHours !== undefined && watchData.sleepHours !== null) {
        const sleep = Number(watchData.sleepHours);
        if (sleep < 6) {
            recommendations.push({
                type: 'critical',
                emoji: '😴',
                title: 'Severe Sleep Deprivation - WHO Alert',
                metric: `Current: ${sleep} hours | WHO Recommendation: 7-9 hours`,
                description: 'WHO identifies insufficient sleep as a major health risk. Less than 6 hours increases risk of obesity, diabetes, cardiovascular disease, and impairs fertility by 30%.',
                foods: [
                    { name: 'Tart Cherry Juice', benefit: 'Natural melatonin for sleep quality' },
                    { name: 'Almonds & Walnuts', benefit: 'Magnesium promotes relaxation' },
                    { name: 'Chamomile Tea', benefit: 'Calms nervous system before bed' }
                ],
                lifestyle: [
                    '• Establish a consistent sleep schedule (same time daily)',
                    '• Avoid screens 1 hour before bed',
                    '• Keep bedroom cool (18-20°C) and dark'
                ],
                reference: 'WHO Sleep Health Guidelines'
            });
        } else if (sleep >= 6 && sleep < 7) {
            recommendations.push({
                type: 'warning',
                emoji: '🌙',
                title: 'Insufficient Sleep Duration',
                metric: `Current: ${sleep} hours | WHO Recommendation: 7-9 hours`,
                description: 'You\'re close but not meeting WHO sleep guidelines. Adding 1 more hour improves immune function, cognitive performance, and hormonal balance.',
                foods: [
                    { name: 'Turkey & Chicken', benefit: 'Tryptophan aids sleep onset' },
                    { name: 'Kiwi Fruit', benefit: 'Serotonin regulates sleep cycles' },
                    { name: 'Whole Grain Toast', benefit: 'Complex carbs promote sleep' }
                ],
                lifestyle: [
                    '• Move bedtime 15 minutes earlier each week',
                    '• Create a relaxing bedtime routine',
                    '• Limit caffeine after 2 PM'
                ],
                reference: 'WHO Sleep Health Guidelines'
            });
        } else if (sleep >= 7 && sleep <= 9) {
            recommendations.push({
                type: 'success',
                emoji: '✨',
                title: 'Optimal Sleep Duration - WHO Compliant',
                metric: `Current: ${sleep} hours | WHO Recommendation: Met ✓`,
                description: 'Excellent! You meet WHO sleep guidelines. Quality sleep is crucial for hormonal balance, fertility, and overall health maintenance.',
                foods: [
                    { name: 'Fatty Fish', benefit: 'Vitamin D & Omega-3 for sleep quality' },
                    { name: 'Whole Grains', benefit: 'Steady blood sugar overnight' },
                    { name: 'Dark Chocolate', benefit: 'Magnesium for relaxation (in moderation)' }
                ],
                lifestyle: [
                    '• Maintain your excellent sleep routine',
                    '• Ensure bedroom environment stays optimal',
                    '• Consider sleep tracking for quality assessment'
                ],
                reference: 'WHO Sleep Health Guidelines'
            });
        } else if (sleep > 9) {
            recommendations.push({
                type: 'warning',
                emoji: '⏰',
                title: 'Excessive Sleep Duration',
                metric: `Current: ${sleep} hours | WHO Recommendation: 7-9 hours`,
                description: 'WHO notes that excessive sleep (>9 hours) may indicate underlying health issues or poor sleep quality. Consult healthcare provider if persistent.',
                foods: [
                    { name: 'Green Tea', benefit: 'Gentle energy boost' },
                    { name: 'Complex Carbs', benefit: 'Stable energy throughout day' },
                    { name: 'B-vitamin Rich Foods', benefit: 'Support energy metabolism' }
                ],
                lifestyle: [
                    '• Gradually reduce sleep time by 15 min/week',
                    '• Increase morning light exposure',
                    '• Consider sleep study if fatigue persists'
                ],
                reference: 'WHO Sleep Health Guidelines'
            });
        }
    }

    // WHO Guideline 3: Resting Heart Rate
    // Normal: 60-100 bpm
    if (watchData.hr !== undefined && watchData.hr !== null) {
        const hr = Number(watchData.hr);
        if (hr < 60 && hr > 40) {
            recommendations.push({
                type: 'info',
                emoji: '💙',
                title: 'Low Resting Heart Rate (Athletic)',
                metric: `Current: ${hr} bpm | Normal Range: 60-100 bpm`,
                description: 'A low resting heart rate in active individuals indicates good cardiovascular fitness. Ensure it\'s not accompanied by fatigue or dizziness.',
                foods: [
                    { name: 'Iron-rich Foods (Spinach, Lentils)', benefit: 'Supports oxygen transport' },
                    { name: 'Electrolyte-rich Foods', benefit: 'Maintains heart rhythm' },
                    { name: 'Whole Grains', benefit: 'B-vitamins for heart health' }
                ],
                lifestyle: [
                    '• Continue regular exercise routine',
                    '• Monitor for symptoms (fatigue, dizziness)',
                    '• Stay well-hydrated'
                ],
                reference: 'WHO Cardiovascular Health Guidelines'
            });
        } else if (hr >= 60 && hr <= 100) {
            recommendations.push({
                type: 'success',
                emoji: '💚',
                title: 'Optimal Resting Heart Rate',
                metric: `Current: ${hr} bpm | Normal Range: 60-100 bpm`,
                description: 'Your heart rate is within WHO normal range, indicating good cardiovascular health.',
                foods: [
                    { name: 'Leafy Greens', benefit: 'Nitrates improve blood flow' },
                    { name: 'Berries', benefit: 'Antioxidants protect heart' },
                    { name: 'Nuts', benefit: 'Healthy fats for heart' }
                ],
                lifestyle: [
                    '• Maintain current healthy habits',
                    '• Continue regular cardiovascular exercise',
                    '• Monitor periodically'
                ],
                reference: 'WHO Cardiovascular Health Guidelines'
            });
        } else if (hr > 100) {
            recommendations.push({
                type: 'critical',
                emoji: '💓',
                title: 'Elevated Resting Heart Rate - WHO Alert',
                metric: `Current: ${hr} bpm | Normal Range: 60-100 bpm`,
                description: 'WHO guidelines indicate elevated resting HR may signal stress, dehydration, poor fitness, or underlying conditions. Resting HR >100 bpm increases cardiovascular risk.',
                foods: [
                    { name: 'Magnesium-rich Foods (Almonds, Avocado)', benefit: 'Regulates heart rhythm' },
                    { name: 'Potassium-rich Foods (Bananas, Coconut Water)', benefit: 'Balances electrolytes' },
                    { name: 'Omega-3 Rich Fish', benefit: 'Reduces inflammation' }
                ],
                lifestyle: [
                    '• Practice deep breathing exercises (5 min, 3x daily)',
                    '• Reduce caffeine and stimulants',
                    '• Consult healthcare provider if persistent'
                ],
                reference: 'WHO Cardiovascular Health Guidelines'
            });
        }
    }

    // WHO Guideline 4: Heart Rate Variability (HRV)
    // Higher HRV = Better cardiovascular health and stress resilience
    if (watchData.hrv !== undefined && watchData.hrv !== null) {
        const hrv = Number(watchData.hrv);
        if (hrv < 30) {
            recommendations.push({
                type: 'critical',
                emoji: '❤️',
                title: 'Very Low HRV - Stress & Recovery Alert',
                metric: `Current: ${Math.round(hrv)} ms | Optimal Range: 50-100+ ms`,
                description: 'WHO research shows low HRV indicates chronic stress, poor recovery, or cardiovascular strain. This impacts fertility, immune function, and overall health.',
                foods: [
                    { name: 'Fatty Fish (Salmon, Sardines)', benefit: 'Omega-3s improve HRV by 10-15%' },
                    { name: 'Dark Leafy Greens', benefit: 'Magnesium improves autonomic function' },
                    { name: 'Fermented Foods', benefit: 'Gut health linked to HRV improvement' }
                ],
                lifestyle: [
                    '• Practice daily meditation (10 min proven to increase HRV)',
                    '• Prioritize 7-9 hours sleep (HRV recovers during sleep)',
                    '• Reduce high-intensity exercise temporarily'
                ],
                reference: 'WHO Cardiovascular & Mental Health Guidelines'
            });
        } else if (hrv >= 30 && hrv < 50) {
            recommendations.push({
                type: 'warning',
                emoji: '💛',
                title: 'Low HRV - Stress Management Needed',
                metric: `Current: ${Math.round(hrv)} ms | Optimal Range: 50-100+ ms`,
                description: 'Your HRV suggests moderate stress or insufficient recovery. WHO guidelines emphasize stress reduction for optimal health outcomes.',
                foods: [
                    { name: 'Walnuts & Flaxseeds', benefit: 'Plant-based Omega-3s' },
                    { name: 'Green Tea', benefit: 'L-theanine reduces stress' },
                    { name: 'Dark Chocolate (70%+)', benefit: 'Flavonoids improve heart function' }
                ],
                lifestyle: [
                    '• Add breathing exercises before meals',
                    '• Take regular breaks during work',
                    '• Practice yoga or tai chi (proven HRV benefits)'
                ],
                reference: 'WHO Cardiovascular & Mental Health Guidelines'
            });
        } else if (hrv >= 50) {
            recommendations.push({
                type: 'success',
                emoji: '💚',
                title: 'Excellent HRV - Optimal Cardiovascular Health',
                metric: `Current: ${Math.round(hrv)} ms | Optimal Range: Met ✓`,
                description: 'Outstanding! High HRV indicates excellent stress resilience, cardiovascular health, and recovery capacity. This is associated with better fertility outcomes.',
                foods: [
                    { name: 'Colorful Vegetables', benefit: 'Antioxidants maintain cardiovascular health' },
                    { name: 'Whole Food Diet', benefit: 'Sustains optimal HRV' },
                    { name: 'Berries & Nuts', benefit: 'Anti-inflammatory properties' }
                ],
                lifestyle: [
                    '• Maintain your excellent stress management',
                    '• Continue balanced exercise routine',
                    '• Share your wellness strategies with others'
                ],
                reference: 'WHO Cardiovascular & Mental Health Guidelines'
            });
        }
    }

    return recommendations;
};

export default function NutritionResultScreen({ navigation, route }) {
    const params = route.params || {};
    const {
        predictionSuccess = 0,
        optimizedProbability = 0,
        impactScore = 0,
        recommendation = '',
        detailedRecommendations = [],
        watchData = null,
        watchConnected = false
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

    // DEBUG: Log watch data and verify insight conditions
    if (watchData) {
        console.log('\n=== SMARTWATCH DATA RECEIVED ===');
        console.log('Watch Connected:', watchConnected);
        console.log('Heart Rate:', watchData.hr, 'bpm');
        console.log('HRV (RAW):', watchData.hrv, '| Type:', typeof watchData.hrv, '| Display:', formatHRV(watchData.hrv));
        
        console.log('\n=== INSIGHT CONDITIONS CHECK ===');
        console.log('❌ Low HRV (<50 ms)?', watchData.hrv && watchData.hrv < 50 ? 'YES - Will show Omega-3 recommendation' : 'NO');
        console.log('❌ High HR (>100 bpm)?', watchData.hr && watchData.hr > 100 ? 'YES - Will show hydration & calming foods' : 'NO');
        
        const allGood = (!watchData.hrv || watchData.hrv >= 50) && (!watchData.hr || watchData.hr <= 100);
        console.log('✅ All Metrics Good?', allGood ? 'YES - Will show maintenance foods' : 'NO');
    } else {
        console.log('\n⚠️  NO WATCH DATA - Smartwatch card will not appear');
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

    // Generate WHO-backed recommendations
    const whoRecommendations = generateWHORecommendations(watchData);

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

                {/* Smartwatch Metrics Card */}
                {watchData && (
                    <View style={styles.watchMetricsCard}>
                        <View style={styles.watchHeader}>
                            <View style={styles.watchTitleRow}>
                                <Text style={styles.watchIcon}>⌚</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.watchTitle}>Biometric Data</Text>
                                    <Text style={styles.watchSubtitle}>Real-time health metrics from your smartwatch</Text>
                                </View>
                                {watchConnected && (
                                    <View style={styles.liveIndicator}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>LIVE</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.metricsGrid}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricIcon}>💓</Text>
                                <Text style={styles.metricValue}>{watchData.hr || 0}</Text>
                                <Text style={styles.metricUnit}>bpm</Text>
                                <Text style={styles.metricLabel}>Heart Rate</Text>
                            </View>

                            <View style={styles.metricBox}>
                                <Text style={styles.metricIcon}>📊</Text>
                                <Text style={styles.metricValue}>{formatHRV(watchData.hrv)}</Text>
                                <Text style={styles.metricUnit}>ms</Text>
                                <Text style={styles.metricLabel}>HRV</Text>
                            </View>

                            <View style={styles.metricBox}>
                                <Text style={styles.metricIcon}></Text>
                                <Text style={styles.metricValue}>{watchData.sleepHours || 0}</Text>
                                <Text style={styles.metricUnit}>hours</Text>
                                <Text style={styles.metricLabel}>Sleep</Text>
                            </View>
                        </View>

                        {/* WHO-Backed Health Recommendations */}
                        {whoRecommendations.length > 0 && (
                            <View style={styles.healthInsightsBox}>
                                <Text style={styles.insightsTitle}>🏥 WHO Evidence-Based Health Recommendations</Text>
                                <Text style={styles.insightsSubtitle}>Personalized guidance based on World Health Organization guidelines</Text>
                                <View style={styles.insightsList}>
                                    {whoRecommendations.map((rec, index) => (
                                        <View 
                                            key={index} 
                                            style={[
                                                styles.whoRecommendationCard,
                                                rec.type === 'critical' && styles.criticalCard,
                                                rec.type === 'warning' && styles.warningCard,
                                                rec.type === 'success' && styles.successCard
                                            ]}
                                        >
                                            {/* Header */}
                                            <View style={styles.insightHeader}>
                                                <Text style={styles.insightEmoji}>{rec.emoji}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.whoInsightTitle}>{rec.title}</Text>
                                                    <Text style={styles.whoInsightMetric}>{rec.metric}</Text>
                                                </View>
                                            </View>

                                            {/* Description */}
                                            <Text style={styles.whoDescription}>{rec.description}</Text>

                                            {/* Food Recommendations */}
                                            <View style={styles.foodRecommendations}>
                                                <Text style={styles.foodRecommendTitle}>🥗 Recommended Foods:</Text>
                                                {rec.foods.map((food, foodIndex) => (
                                                    <Text key={foodIndex} style={styles.whoFoodItem}>
                                                        • <Text style={styles.foodBold}>{food.name}</Text> - {food.benefit}
                                                    </Text>
                                                ))}
                                            </View>

                                            {/* Lifestyle Recommendations */}
                                            <View style={styles.lifestyleRecommendations}>
                                                <Text style={styles.lifestyleTitle}>💪 Action Steps:</Text>
                                                {rec.lifestyle.map((item, lifestyleIndex) => (
                                                    <Text key={lifestyleIndex} style={styles.lifestyleItem}>{item}</Text>
                                                ))}
                                            </View>

                                            {/* WHO Reference */}
                                            <View style={styles.whoReferenceBox}>
                                                <Text style={styles.whoReferenceText}>📚 Source: {rec.reference}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

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
                            <View style={styles.aiHeaderBadge}>
                                <Text style={styles.aiHeaderBadgeText}>🤖 AI-POWERED ANALYSIS</Text>
                            </View>
                            <Text style={styles.sectionHeader}>ML Model-Based Recommendations</Text>
                            <Text style={styles.sectionSubheader}>Each recommendation's impact is calculated by simulating changes using our trained ML model</Text>
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
                                        <Text style={styles.impactChipLabel}>AI Impact</Text>
                                        <Text style={styles.impactChipText}>
                                            {rec.impact > 0 ? '+' : ''}{rec.impact}%
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.aiSimulationBadge}>
                                    <Text style={styles.aiSimulationText}>
                                        🧠 ML Model Simulation: If you optimize {rec.nutrient} from {formattedValues.current} to {formattedValues.target}, 
                                        our AI predicts a <Text style={styles.aiSimulationHighlight}>+{rec.impact}%</Text> increase in success probability.
                                    </Text>
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
                <View style={styles.technicalInsightCard}>
                    <View style={styles.mlBadgeRow}>
                        <Text style={styles.mlBadge}>🤖 MACHINE LEARNING</Text>
                    </View>
                    <Text style={styles.insightTitle}>How AI Generates These Recommendations</Text>
                    <Text style={styles.insightText}>
                        Our <Text style={styles.insightBold}>24-feature Neural Ensemble Model</Text> analyzes your complete nutritional profile. 
                        For each potential improvement, the AI simulates the change and predicts its impact on IVF success probability. 
                        These aren't generic tips—they're <Text style={styles.insightBold}>personalized predictions</Text> calculated specifically for your profile.
                    </Text>
                    <View style={styles.modelStatsRow}>
                        <View style={styles.modelStat}>
                            <Text style={styles.modelStatValue}>24</Text>
                            <Text style={styles.modelStatLabel}>Features Analyzed</Text>
                        </View>
                        <View style={styles.modelStat}>
                            <Text style={styles.modelStatValue}>{detailedRecommendations.length}</Text>
                            <Text style={styles.modelStatLabel}>Optimizations Found</Text>
                        </View>
                        <View style={styles.modelStat}>
                            <Text style={styles.modelStatValue}>{impactScore.toFixed(1)}%</Text>
                            <Text style={styles.modelStatLabel}>Total AI-Predicted Gain</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.primaryButtonText}>Modify Input Data</Text>
                </TouchableOpacity>

                <View style={{ height: 120 }} />
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
    aiHeaderBadge: {
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#C4B5FD',
    },
    aiHeaderBadgeText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#7C3AED',
        letterSpacing: 1,
    },
    sectionHeader: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    sectionSubheader: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
        marginTop: 6,
        lineHeight: 18,
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
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center',
    },
    impactChipLabel: {
        fontSize: 9,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#059669',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    impactChipText: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#059669',
    },
    aiSimulationBadge: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#7C3AED',
    },
    aiSimulationText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#475569',
        lineHeight: 18,
    },
    aiSimulationHighlight: {
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
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...theme.shadows.soft,
    },
    technicalInsightCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 20,
        marginBottom: 32,
        marginTop: 10,
        borderWidth: 2,
        borderColor: '#E0E7FF',
        ...theme.shadows.soft,
    },
    mlBadgeRow: {
        marginBottom: 16,
    },
    mlBadge: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#6366F1',
        letterSpacing: 1.2,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    },
    insightTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    insightText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        fontFamily: 'PlusJakartaSans_500Medium',
        marginBottom: 20,
    },
    insightBold: {
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
    },
    modelStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modelStat: {
        alignItems: 'center',
    },
    modelStatValue: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#6366F1',
        marginBottom: 4,
    },
    modelStatLabel: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#64748B',
        textAlign: 'center',
    },
    insightIcon: {
        fontSize: 20,
        marginRight: 16,
    },
    watchMetricsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...theme.shadows.premium,
    },
    watchHeader: {
        marginBottom: 20,
    },
    watchTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    watchIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    watchTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    watchSubtitle: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.textLight,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16A34A',
        marginRight: 6,
    },
    liveText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#16A34A',
        letterSpacing: 0.5,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        marginHorizontal: 4,
    },
    metricIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: theme.colors.text,
    },
    metricUnit: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: theme.colors.textLight,
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.textLight,
        textAlign: 'center',
    },
    healthInsightsBox: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    insightsTitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    insightsList: {
        gap: 8,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    insightDot: {
        fontSize: 14,
        color: '#3B82F6',
        marginRight: 8,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    insightRowText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.textLight,
        lineHeight: 18,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    insightEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    insightTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    insightMetric: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.textLight,
    },
    insightDescription: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: theme.colors.textLight,
        lineHeight: 19,
        marginBottom: 12,
    },
    foodRecommendations: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    foodRecommendTitle: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#92400E',
        marginBottom: 8,
    },
    foodItem: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#78350F',
        lineHeight: 18,
        marginBottom: 4,
    },
    foodBold: {
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#78350F',
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
    },
    // WHO Recommendation Card Styles
    insightsSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontFamily: 'PlusJakartaSans_500Medium',
        marginTop: 4,
        marginBottom: 16,
        lineHeight: 18,
    },
    whoRecommendationCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    criticalCard: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    warningCard: {
        borderColor: '#FCD34D',
        backgroundColor: '#FFFBEB',
    },
    successCard: {
        borderColor: '#86EFAC',
        backgroundColor: '#F0FDF4',
    },
    whoInsightTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
        marginBottom: 4,
        lineHeight: 22,
    },
    whoInsightMetric: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#64748B',
        lineHeight: 18,
    },
    whoDescription: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#475569',
        lineHeight: 20,
        marginTop: 12,
        marginBottom: 16,
    },
    whoFoodItem: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 6,
    },
    lifestyleRecommendations: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    lifestyleTitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F172A',
        marginBottom: 10,
    },
    lifestyleItem: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#475569',
        lineHeight: 20,
        marginBottom: 4,
    },
    whoReferenceBox: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    whoReferenceText: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#3B82F6',
        lineHeight: 16,
    },
    // Trends & Analytics Styles
    trendsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...theme.shadows.premium,
    },
    trendsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    trendsTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    trendsSubtitle: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
    },
    periodToggle: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 4,
    },
    periodButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: '#6366F1',
        ...theme.shadows.soft,
    },
    periodButtonText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#64748B',
    },
    periodButtonTextActive: {
        color: '#FFFFFF',
    },
    trendSection: {
        marginBottom: 16,
        paddingBottom: 0,
    },
    trendSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    trendSectionTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    trendSectionSubtitle: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#64748B',
    },
    trendStatBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    trendStatValue: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#64748B',
        marginBottom: 2,
    },
    trendStatPositive: {
        color: '#10B981',
    },
    trendStatLabel: {
        fontSize: 9,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 12,
    },
    trendInsight: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#475569',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 10,
        marginTop: 8,
        lineHeight: 18,
    },
    clinicalInsightBox: {
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 2,
        borderColor: '#C7D2FE',
    },
    clinicalInsightTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: '#4338CA',
        marginBottom: 12,
    },
    clinicalInsightText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#4338CA',
        lineHeight: 20,
        marginBottom: 12,
    },
    clinicalInsightFooter: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        color: '#6366F1',
        fontStyle: 'italic',
        lineHeight: 16,
    },
});

