import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../theme';

export default function NutritionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🥗</Text>
        <Text style={styles.title}>Nutrition Plan</Text>
        <Text style={styles.subtitle}>Your personalized diet recommendations will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24,
  },
  emoji: {
      fontSize: 64,
      marginBottom: 16,
  },
  title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
  },
  subtitle: {
      fontSize: 16,
      color: theme.colors.textLight,
      textAlign: 'center',
  }
});
