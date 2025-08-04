import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  color: string;
  is_expense: boolean;
  icon_name: string;
}

interface CategoryWithAmount extends Category {
  targetAmount: string;
}

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { goalType, phone, plan, needsPayment } = useLocalSearchParams();
  const [categories, setCategories] = useState<CategoryWithAmount[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [goalType]);

  const fetchCategories = async () => {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .is('parent_id', null) // Seulement les catégories parents
        .neq('id', 'a1d1237c-249b-49b4-aa11-34bcc14f3fb5'); // Exclure cette catégorie spécifique
      
      if (goalType === 'reduce_expenses') {
        query = query.eq('is_expense', true);
      } else if (goalType === 'increase_income') {
        query = query.eq('is_expense', false);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setCategories(data.map(cat => ({
        ...cat,
        targetAmount: '',
      })));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) {
        return prev.filter(catId => catId !== id);
      }
      return [...prev, id];
    });
  };

  const updateTargetAmount = (id: string, amount: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, targetAmount: amount } : cat
      )
    );
  };

  const handleNext = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    const selectedWithAmounts = categories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => ({
        user_id: user.id,
        name: `Objectif - ${cat.name}`,
        target_amount: parseFloat(cat.targetAmount) || 0,
        current_amount: 0,
        is_active: true,
        category_id: cat.id,
      }));

    if (selectedWithAmounts.some(goal => goal.target_amount === 0)) {
      Alert.alert('Erreur', 'Veuillez entrer un montant pour toutes les catégories sélectionnées');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('financial_goals')
        .insert(selectedWithAmounts);

      if (error) throw error;

      router.push({
        pathname: '/complete',
        params: { 
          phone,
          plan,
          needsPayment
        }
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer vos objectifs');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategorySection = (title: string, isExpense: boolean) => {
    const sectionCategories = categories.filter(cat => cat.is_expense === isExpense);
    
    if (sectionCategories.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sectionCategories.map(category => (
          <View
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategories.includes(category.id) && styles.selectedCategoryCard
            ]}
          >
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>

            {selectedCategories.includes(category.id) && (
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>
                  {category.is_expense ? 'Montant maximum (FCFA)' : 'Montant cible (FCFA)'}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={category.targetAmount}
                  onChangeText={(text) => updateTargetAmount(category.id, text)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={Colors.gray[700]} />
      </TouchableOpacity>

      <Text style={styles.title}>
        {goalType === 'reduce_expenses' 
          ? 'Définir vos limites de dépenses'
          : goalType === 'increase_income'
          ? 'Définir vos objectifs de revenus'
          : 'Définir vos objectifs financiers'}
      </Text>
      
      <Text style={styles.subtitle}>
        Sélectionnez les catégories et définissez vos objectifs mensuels
      </Text>

      <ScrollView style={styles.categoriesList}>
        {goalType === 'both' ? (
          <>
            {renderCategorySection('Catégories de dépenses', true)}
            {renderCategorySection('Catégories de revenus', false)}
          </>
        ) : (
          renderCategorySection(
            goalType === 'reduce_expenses' ? 'Catégories de dépenses' : 'Catégories de revenus',
            goalType === 'reduce_expenses'
          )
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={selectedCategories.length === 0}
          loading={isLoading}
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
    color: Colors.gray[600],
    marginBottom: Layout.spacing.l,
  },
  categoriesList: {
    flex: 1,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.m,
  },
  categoryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedCategoryCard: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Layout.spacing.m,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  amountContainer: {
    marginTop: Layout.spacing.m,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  amountInput: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    fontSize: 16,
    color: Colors.gray[800],
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  footer: {
    marginTop: Layout.spacing.l,
  },
});