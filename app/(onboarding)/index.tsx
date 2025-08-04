import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react-native';

type GoalType = 'reduce_expenses' | 'increase_income' | 'both' | null;

export default function OnboardingGoalScreen() {
  const { phone, plan, needsPayment } = useLocalSearchParams();
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(null);

  const handleNext = () => {
    if (selectedGoal) {
      router.push({
        pathname: '/categories',
        params: { 
          goalType: selectedGoal,
          phone,
          plan,
          needsPayment
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quel est votre objectif ?</Text>
      <Text style={styles.subtitle}>
        Choisissez votre objectif principal pour personnaliser votre expérience
      </Text>

      <View style={styles.goalsContainer}>
        <TouchableOpacity
          style={[
            styles.goalCard,
            selectedGoal === 'reduce_expenses' && styles.selectedGoalCard
          ]}
          onPress={() => setSelectedGoal('reduce_expenses')}
        >
          <TrendingDown
            size={32}
            color={selectedGoal === 'reduce_expenses' ? Colors.primary[500] : Colors.gray[600]}
          />
          <Text style={[
            styles.goalTitle,
            selectedGoal === 'reduce_expenses' && styles.selectedGoalTitle
          ]}>
            Réduire mes dépenses
          </Text>
          <Text style={styles.goalDescription}>
            Optimiser vos dépenses et économiser plus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.goalCard,
            selectedGoal === 'increase_income' && styles.selectedGoalCard
          ]}
          onPress={() => setSelectedGoal('increase_income')}
        >
          <TrendingUp
            size={32}
            color={selectedGoal === 'increase_income' ? Colors.primary[500] : Colors.gray[600]}
          />
          <Text style={[
            styles.goalTitle,
            selectedGoal === 'increase_income' && styles.selectedGoalTitle
          ]}>
            Augmenter mes revenus
          </Text>
          <Text style={styles.goalDescription}>
            Développer vos sources de revenus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.goalCard,
            selectedGoal === 'both' && styles.selectedGoalCard
          ]}
          onPress={() => setSelectedGoal('both')}
        >
          <View style={styles.bothIconsContainer}>
            <TrendingDown
              size={24}
              color={selectedGoal === 'both' ? Colors.primary[500] : Colors.gray[600]}
            />
            <TrendingUp
              size={24}
              color={selectedGoal === 'both' ? Colors.primary[500] : Colors.gray[600]}
            />
          </View>
          <Text style={[
            styles.goalTitle,
            selectedGoal === 'both' && styles.selectedGoalTitle
          ]}>
            Les deux
          </Text>
          <Text style={styles.goalDescription}>
            Optimiser dépenses et revenus
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={!selectedGoal}
          rightIcon={<ArrowRight size={20} color={Colors.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xl,
  },
  goalsContainer: {
    flex: 1,
    gap: Layout.spacing.l,
  },
  goalCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.l,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedGoalCard: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.xs,
  },
  selectedGoalTitle: {
    color: Colors.primary[700],
  },
  goalDescription: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  bothIconsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.s,
  },
  footer: {
    marginTop: Layout.spacing.xl,
  },
});