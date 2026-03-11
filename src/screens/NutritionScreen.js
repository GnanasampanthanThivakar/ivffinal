import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export default function NutritionScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.headerPanel}>
                <Text style={styles.headerTitle}>Personalized Nutrition</Text>
                <Text style={styles.headerSubtitle}>Proactive IVF Success Optimization</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Dietary Impact Score Card */}
                <View style={styles.impactCard}>
                    <Text style={styles.impactTitle}>Simulated Dietary Impact</Text>
                    <Text style={styles.impactDesc}>Based on increasing deficient micronutrients by 20%</Text>
                    
                    <View style={styles.scoreRow}>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreValue}>14.7%</Text>
                            <Text style={styles.scoreLabel}>Baseline Prediction</Text>
                        </View>
                        <Text style={styles.scoreArrow}>→</Text>
                        <View style={[styles.scoreBox, styles.scoreBoxActive]}>
                            <Text style={[styles.scoreValue, {color: theme.colors.surface}]}>32.8%</Text>
                            <Text style={[styles.scoreLabel, {color: 'rgba(255,255,255,0.8)'}]}>Optimized Implantation</Text>
                        </View>
                    </View>
                    
                    <View style={styles.impactHighlight}>
                        <Text style={styles.impactHighlightText}>+18.1% Increase in Implantation Probability</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Identified Deficiencies</Text>
                <View style={styles.deficiencyContainer}>
                    <View style={styles.deficiencyCard}>
                        <Text style={styles.deficiencyIcon}>🧬</Text>
                        <Text style={styles.deficiencyName}>Folate</Text>
                        <Text style={styles.deficiencyStatus}>Critical Low</Text>
                    </View>
                    <View style={styles.deficiencyCard}>
                        <Text style={styles.deficiencyIcon}>⚡</Text>
                        <Text style={styles.deficiencyName}>Zinc</Text>
                        <Text style={styles.deficiencyStatus}>Suboptimal</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Prescribed Foods</Text>
                <Text style={styles.sectionSubtitle}>Daily additions to achieve a 20% micronutrient increase safely.</Text>

                <View style={styles.foodCard}>
                    <View style={[styles.foodIconContainer, {backgroundColor: '#E8F5E9'}]}>
                        <Text style={styles.foodEmoji}>🥬</Text>
                    </View>
                    <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>Spinach & Lentils</Text>
                        <Text style={styles.foodReason}>Boosts Folate for epigenetic regulation and cell division during early embryogenesis.</Text>
                        <Text style={styles.foodAmount}>Target: +150mcg / day</Text>
                    </View>
                </View>

                <View style={styles.foodCard}>
                    <View style={[styles.foodIconContainer, {backgroundColor: '#FFF3E0'}]}>
                        <Text style={styles.foodEmoji}>🎃</Text>
                    </View>
                    <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>Pumpkin Seeds</Text>
                        <Text style={styles.foodReason}>Rich in Zinc for oocyte meiotic maturation and cumulus expansion.</Text>
                        <Text style={styles.foodAmount}>Target: +12mg / day</Text>
                    </View>
                </View>

                <View style={{height: 40}} />
            </ScrollView>
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
        paddingBottom: 40,
        paddingHorizontal: theme.spacing.l,
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30,
        ...theme.shadows.medium,
        marginBottom: 16,
    },
    headerTitle: {
        ...theme.typography.heading,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#FFFFFF',
        fontSize: 22,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        ...theme.typography.subheading,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.s,
    },
    impactCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: 24,
        ...theme.shadows.medium,
    },
    impactTitle: {
        ...theme.typography.heading,
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 18,
        marginBottom: 4,
        textAlign: 'center',
    },
    impactDesc: {
        ...theme.typography.subheading,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreBox: {
        backgroundColor: theme.colors.background,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        width: 115,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
    },
    scoreBoxActive: {
        backgroundColor: theme.colors.primary,
        borderWidth: 0,
        ...theme.shadows.soft,
    },
    scoreValue: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    scoreLabel: {
        fontSize: 11,
        color: theme.colors.textLight,
        fontFamily: 'PlusJakartaSans_700Bold',
        textAlign: 'center',
    },
    scoreArrow: {
        fontSize: 24,
        color: theme.colors.textLight,
        marginHorizontal: 12,
    },
    impactHighlight: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: theme.borderRadius.s,
        alignItems: 'center',
    },
    impactHighlightText: {
        color: '#2E7D32',
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 14,
    },
    sectionTitle: {
        ...theme.typography.heading,
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 18,
        marginBottom: 16,
        marginLeft: 4,
    },
    sectionSubtitle: {
        ...theme.typography.subheading,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        marginBottom: 16,
        marginLeft: 4,
        marginTop: -10,
    },
    deficiencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    deficiencyCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        ...theme.shadows.soft,
        borderTopWidth: 4,
        borderTopColor: '#FFAB91',
    },
    deficiencyIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    deficiencyName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    deficiencyStatus: {
        fontSize: 12,
        color: theme.colors.error,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    foodCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: 16,
        marginBottom: 16,
        ...theme.shadows.soft,
        alignItems: 'center',
    },
    foodIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    foodEmoji: {
        fontSize: 24,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    foodReason: {
        fontSize: 13,
        color: theme.colors.textLight,
        marginBottom: 8,
        lineHeight: 18,
        fontFamily: 'PlusJakartaSans_400Regular',
    },
    foodAmount: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_700Bold',
        color: theme.colors.primary,
    }
});
