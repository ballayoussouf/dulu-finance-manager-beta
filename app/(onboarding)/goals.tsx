import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Goal {
  id: string;
  title: string;
  description: string;
  defaultAmount: number;
}

const goals: Goal[] = [
  {
    id: 'savings',
    title: 'Épargner',
    description: 'Constituer une épargne et des fonds d\'urgence',
    defaultAmount: 5000,
  },
  {
    id: 'reduce_expenses',
    title: 'Réduire les dépenses',
    description: 'Réduire les dépenses inutiles',
    defaultAmount: 1000,
  },
  {
    id: 'debt_free',
    title: 'Rembourser les dettes',
    description: 'Éliminer les dettes de carte de crédit ou de prêt',
    defaultAmount: 10000,
  },
  {
    id: 'budget',
    title: 'Mieux budgétiser',
    description: 'Créer et respecter un budget mensuel',
    defaultAmount: 2000,
  },
  {
    id: 'increase_income',
    title: 'Augmenter les revenus',
    description: 'Trouver des moyens de gagner plus d\'argent',
    defaultAmount: 3000,
  },
  {
    id: 'invest',
    title: 'Investir pour l\'avenir',
    description: 'Commencer ou développer vos investissements',
    defaultAmount: 15000,
  },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleGoal = (id: string) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(goalId => goalId !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const handleNext = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setIsLoading(true);
    try {
      const goalsToInsert = selectedGoals.map(goalId => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) {
          throw new Error(`Goal with ID ${goalId} not found`);
        }
        return {
          user_id: user.id,
          name: goal.title,
          target_amount: goal.defaultAmount,
          current_amount: 0,
          is_active: true,
        };
      });

      const { error } = await supabase
        .from('financial_goals')
        .insert(goalsToInsert);

      if (error) throw error;

      router.push('/(onboarding)/categories');
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer vos objectifs. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Définissez vos objectifs</Text>
        <Text style={styles.subtitle}>Que souhaitez-vous accomplir avec DULU ?</Text>
        <Text style={styles.hint}>Sélectionnez tout ce qui s'applique</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.goalsContainer}
        showsVerticalScrollIndicator={false}
      >
        {goals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalCard,
              selectedGoals.includes(goal.id) && styles.selectedGoalCard,
            ]}
            onPress={() => toggleGoal(goal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.goalContent}>
              <Text style={[
                styles.goalTitle,
                selectedGoals.includes(goal.id) && styles.selectedGoalTitle,
              ]}>
                {goal.title}
              </Text>
              
              <Text style={[
                styles.goalDescription,
                selectedGoals.includes(goal.id) && styles.selectedGoalDescription,
              ]}>
                {goal.description}
              </Text>
            </View>
            
            {selectedGoals.includes(goal.id) && (
              <View style={styles.checkmark}>
                <Text style={styles.targetAmount}>
                  ${goal.defaultAmount.toLocaleString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleNext}
          rightIcon={<ArrowRight size={20} color={Colors.white} />}
          disabled={selectedGoals.length === 0}
          loading={isLoading}
        />
        
        <View style={styles.stepsIndicator}>
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.activeStepDot]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    marginBottom: Layout.spacing.l,
  },
  backButton: {
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  hint: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  goalsContainer: {
    paddingVertical: Layout.spacing.m,
  },
  goalCard: {
    flexDirection: 'row',
    padding: Layout.spacing.m,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.m,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedGoalCard: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  selectedGoalTitle: {
    color: Colors.primary[700],
  },
  goalDescription: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  selectedGoalDescription: {
    color: Colors.primary[600],
  },
  checkmark: {
    minWidth: 80,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Layout.spacing.s,
  },
  targetAmount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: Layout.spacing.l,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.l,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Layout.spacing.xs,
  },
  activeStepDot: {
    backgroundColor: Colors.primary[500],
    width: 24,
    borderRadius: 4,
  },
});