import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, TrendingDown, TrendingUp } from 'lucide-react-native';

interface Category {
  id: string;
  name: string;
  color: string;
  is_expense: boolean;
  parent_id: string | null;
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onGoalAdded: () => void;
}

export default function AddGoalModal({ visible, onClose, onGoalAdded }: AddGoalModalProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCategories();
      resetForm();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null) // Seulement les catégories parents
        .neq('id', 'a1d1237c-249b-49b4-aa11-34bcc14f3fb5') // Exclure cette catégorie spécifique
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setSelectedType('expense');
    setSelectedCategory('');
    setTargetAmount('');
  };

  const getFilteredCategories = (type: 'expense' | 'income') => {
    return categories.filter(category => category.is_expense === (type === 'expense'));
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !targetAmount || !user) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCat = categories.find(c => c.id === selectedCategory);
      
      // 🔧 MODIFICATION PRINCIPALE : Durée de 10 ans au lieu de 12 mois
      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() + 10); // +10 ans au lieu de +12 mois
      
      const { error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          name: `Objectif - ${selectedCat?.name}`,
          target_amount: amount,
          current_amount: 0,
          category_id: selectedCategory,
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('Succès', 'Objectif créé avec succès !');
      onGoalAdded();
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'objectif');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Nouvel Objectif</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sélecteur de type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type d'objectif</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setSelectedType('expense');
                  setSelectedCategory('');
                }}
              >
                <TrendingDown 
                  size={20} 
                  color={selectedType === 'expense' ? Colors.white : Colors.error[500]} 
                />
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'expense' && styles.typeButtonTextActive,
                ]}>
                  Réduire les dépenses
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setSelectedType('income');
                  setSelectedCategory('');
                }}
              >
                <TrendingUp 
                  size={20} 
                  color={selectedType === 'income' ? Colors.white : Colors.success[500]} 
                />
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'income' && styles.typeButtonTextActive,
                ]}>
                  Augmenter les revenus
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sélection de catégorie */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {getFilteredCategories(selectedType).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View 
                    style={[
                      styles.categoryColor,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextSelected,
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Montant cible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedType === 'expense' ? 'Montant maximum (FCFA)' : 'Montant cible (FCFA)'}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors.gray[400]}
            />
          </View>

          {/* 🔧 NOUVELLE SECTION : Information sur la durée */}
          <View style={styles.durationInfoSection}>
            <Text style={styles.durationInfoTitle}>📅 Durée de l'objectif</Text>
            <View style={styles.durationInfoCard}>
              <Text style={styles.durationInfoText}>
                Cet objectif sera défini pour une durée de 1 an partir d'aujourd'hui. 
              </Text>
              <Text style={styles.durationInfoSubtext}>
                Vous pourrez suivre vos progrès mensuels et ajuster votre objectif à tout moment.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer avec boutons */}
        <View style={styles.footer}>
          <Button
            title="Annuler"
            onPress={onClose}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title="Ajouter"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.footerButton}
            disabled={!selectedCategory || !targetAmount}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'ios' ? Layout.spacing.xl : Layout.spacing.l,
    paddingBottom: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
  },
  section: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.s,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  categoriesScroll: {
    marginTop: Layout.spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    marginRight: Layout.spacing.s,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Layout.spacing.xs,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.gray[700],
  },
  categoryChipTextSelected: {
    color: Colors.primary[700],
    fontWeight: '500',
  },
  amountInput: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.m,
    fontSize: 16,
    color: Colors.gray[800],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationInfoSection: {
    marginBottom: Layout.spacing.l,
  },
  durationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  durationInfoCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  durationInfoText: {
    fontSize: 14,
    color: Colors.primary[700],
    lineHeight: 20,
    marginBottom: Layout.spacing.xs,
  },
  durationHighlight: {
    fontWeight: '700',
    color: Colors.primary[800],
  },
  durationInfoSubtext: {
    fontSize: 12,
    color: Colors.primary[600],
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    gap: Layout.spacing.m,
  },
  footerButton: {
    flex: 1,
  },
});