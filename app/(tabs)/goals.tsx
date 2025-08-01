import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  SafeAreaView,
  RefreshControl,
  Modal,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import AddGoalModal from '@/components/goals/AddGoalModal';

interface Category {
  id: string;
  name: string;
  color: string;
  is_expense: boolean;
  parent_id: string | null;
}

interface FinancialGoal {
  id: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  is_active: boolean;
  category_id: string;
  category?: Category;
}

export default function GoalsScreen() {
  const { user } = useAuth();
  const { refreshData, isLoading } = useFinance();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // État pour la confirmation de suppression personnalisée
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    goalId: string;
    goalName: string;
  }>({
    visible: false,
    goalId: '',
    goalName: '',
  });

  // Rafraîchissement automatique quand la vue devient active
  useFocusRefresh({
    onRefresh: async () => {
      await Promise.all([fetchGoals(), fetchCategories()]);
    },
    refreshInterval: 30000, // 30 secondes
    enabled: true,
  });

  useEffect(() => {
    fetchGoals();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    }
  };

  // Fonction unifiée pour obtenir toutes les catégories de la famille
  const getCategoryFamilyIds = (categoryId: string, allCategories: Category[]): string[] => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return [categoryId];

    const familyIds = new Set<string>();
    
    // Déterminer la catégorie racine (parent)
    let rootCategoryId: string;
    
    if (category.parent_id === null) {
      // C'est déjà une catégorie parent
      rootCategoryId = categoryId;
    } else {
      // C'est une sous-catégorie, trouver le parent
      rootCategoryId = category.parent_id;
    }
    
    // Ajouter la catégorie parent
    familyIds.add(rootCategoryId);
    
    // Ajouter toutes les sous-catégories de ce parent
    const children = allCategories.filter(c => c.parent_id === rootCategoryId);
    children.forEach(child => familyIds.add(child.id));

    return Array.from(familyIds);
  };

  const fetchGoals = async () => {
    try {
      // D'abord récupérer toutes les catégories pour la hiérarchie
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Ensuite récupérer tous les objectifs avec leurs catégories
      const { data: goalsData, error: goalsError } = await supabase
        .from('financial_goals')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      console.log('Goals data fetched:', goalsData?.length || 0, 'goals');
      console.log('Categories data fetched:', categoriesData?.length || 0, 'categories');

      // Pour chaque objectif, calculer le montant actuel en tenant compte de la famille de catégories
      const goalsWithAmounts = await Promise.all(
        (goalsData || []).map(async (goal) => {
          // Obtenir toutes les catégories de la famille (parent + enfants)
          const familyCategoryIds = getCategoryFamilyIds(goal.category_id, categoriesData || []);
          
          console.log(`\n=== Goal for category ${goal.category?.name} ===`);
          console.log('Goal category ID:', goal.category_id);
          console.log('Goal category is_expense:', goal.category?.is_expense);
          console.log('Category family IDs:', familyCategoryIds);
          console.log('Goal period:', {
            start: goal.start_date,
            end: goal.target_date
          });

          // MODIFICATION IMPORTANTE: Calculer pour la période actuelle (mois en cours)
          // au lieu de la période de l'objectif pour avoir un reporting en temps réel
          const now = new Date();
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

          console.log('Calculating for current month:', {
            start: currentMonthStart.toISOString(),
            end: currentMonthEnd.toISOString()
          });

          // Calculer la somme des transactions pour toute la famille de catégories
          // POUR LE MOIS EN COURS (pas seulement depuis la création de l'objectif)
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('amount, category_id, transaction_date, description, is_expense')
            .eq('user_id', user?.id)
            .in('category_id', familyCategoryIds)
            .gte('transaction_date', currentMonthStart.toISOString())
            .lte('transaction_date', currentMonthEnd.toISOString());

          if (transactionsError) {
            console.error('Error fetching transactions for goal:', transactionsError);
            throw transactionsError;
          }

          console.log('All transactions found for current month:', transactionsData?.length || 0);
          
          // Filtrer les transactions selon le type de catégorie de l'objectif
          const filteredTransactions = transactionsData?.filter(t => 
            t.is_expense === goal.category?.is_expense
          ) || [];

          console.log('Filtered transactions (matching goal category type):', filteredTransactions.length);
          console.log('Goal category is_expense:', goal.category?.is_expense);
          console.log('Transaction details:', filteredTransactions.map(t => ({
            amount: t.amount,
            description: t.description,
            date: t.transaction_date,
            category_id: t.category_id,
            is_expense: t.is_expense
          })));

          const currentAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

          console.log('Calculated current amount for current month:', currentAmount);
          console.log('Target amount:', goal.target_amount);
          console.log('Goal type:', goal.category?.is_expense ? 'EXPENSE (Dépense)' : 'INCOME (Revenu)');
          console.log('=== End Goal Calculation ===\n');

          return {
            ...goal,
            current_amount: currentAmount
          };
        })
      );

      console.log('Final goals with calculated amounts:', goalsWithAmounts.map(g => ({
        name: g.category?.name,
        type: g.category?.is_expense ? 'Dépense' : 'Revenu',
        current: g.current_amount,
        target: g.target_amount,
        percentage: ((g.current_amount / g.target_amount) * 100).toFixed(1)
      })));

      setGoals(goalsWithAmounts || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Erreur', 'Impossible de charger les objectifs');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !editTargetAmount) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    try {
      const { error } = await supabase
        .from('financial_goals')
        .update({
          target_amount: parseFloat(editTargetAmount),
        })
        .eq('id', editingGoal.id);

      if (error) throw error;
      
      setEditingGoal(null);
      setEditTargetAmount('');
      fetchGoals();
      Alert.alert('Succès', 'Objectif mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', "Impossible de mettre à jour l'objectif");
    }
  };

  // Fonction pour ouvrir la confirmation de suppression
  const showDeleteConfirmation = (goalId: string) => {
    // Prévenir les doubles clics
    if (isDeleting === goalId) {
      console.log('🚫 Delete already in progress for goal:', goalId);
      return;
    }

    console.log('🗑️ Showing delete confirmation for goal:', goalId);
    
    // Trouver l'objectif pour afficher son nom dans la confirmation
    const goalToDelete = goals.find(g => g.id === goalId);
    const goalName = goalToDelete?.category?.name || 'cet objectif';

    setDeleteConfirmation({
      visible: true,
      goalId,
      goalName,
    });
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = async () => {
    const { goalId, goalName } = deleteConfirmation;
    
    try {
      // Marquer comme en cours de suppression
      setIsDeleting(goalId);
      console.log('🔄 Proceeding with deletion...');

      // Fermer le modal de confirmation
      setDeleteConfirmation({ visible: false, goalId: '', goalName: '' });

      // Effectuer la suppression
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw error;
      }

      console.log('✅ Goal deleted successfully from database');
      
      // Mettre à jour l'état local immédiatement pour un feedback rapide
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      
      // Rafraîchir depuis la base de données pour s'assurer de la cohérence
      await fetchGoals();
      
      console.log('✅ Goals list refreshed');
      
      // Afficher le message de succès
      if (Platform.OS === 'web') {
        // Pour le web, utiliser une notification personnalisée ou console
        console.log(`✅ L'objectif "${goalName}" a été supprimé avec succès.`);
      } else {
        Alert.alert('Succès', `L'objectif "${goalName}" a été supprimé avec succès.`);
      }
      
    } catch (error) {
      console.error('💥 Error during goal deletion:', error);
      
      if (Platform.OS === 'web') {
        console.error(`❌ Impossible de supprimer l'objectif "${goalName}".`);
      } else {
        Alert.alert(
          'Erreur', 
          `Impossible de supprimer l'objectif "${goalName}". Veuillez vérifier votre connexion et réessayer.`
        );
      }
    } finally {
      // Réinitialiser l'état de suppression
      setIsDeleting(null);
      console.log('🏁 Delete process completed');
    }
  };

  // Fonction pour annuler la suppression
  const cancelDelete = () => {
    console.log('❌ User cancelled deletion');
    setDeleteConfirmation({ visible: false, goalId: '', goalName: '' });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleRefresh = async () => {
    await Promise.all([fetchGoals(), fetchCategories(), refreshData()]);
  };

  const handleGoalAdded = () => {
    fetchGoals();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Objectifs Financiers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {/* Indicateur de période */}
        <View style={styles.periodIndicator}>
          <Text style={styles.periodText}>
            📅 Objectifs pour {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.periodSubtext}>
            Les montants incluent toutes les transactions du mois en cours
          </Text>
        </View>

        {goals.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.categoryContainer}>
                <View 
                  style={[
                    styles.categoryDot,
                    { backgroundColor: goal.category?.color || Colors.gray[300] }
                  ]} 
                />
                <View>
                  <Text style={styles.goalName}>{goal.category?.name}</Text>
                  <View style={styles.goalTypeContainer}>
                    {goal.category?.is_expense ? (
                      <TrendingDown size={14} color={Colors.error[500]} />
                    ) : (
                      <TrendingUp size={14} color={Colors.success[500]} />
                    )}
                    <Text style={[
                      styles.goalType,
                      { color: goal.category?.is_expense ? Colors.error[500] : Colors.success[500] }
                    ]}>
                      {goal.category?.is_expense ? 'Dépense' : 'Revenu'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    console.log('✏️ Edit button pressed for goal:', goal.id);
                    setEditingGoal(goal);
                    setEditTargetAmount(goal.target_amount.toString());
                  }}
                >
                  <Pencil size={20} color={Colors.primary[500]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    isDeleting === goal.id && styles.iconButtonDisabled
                  ]}
                  onPress={() => {
                    console.log('🗑️ Delete button pressed for goal:', goal.id, goal.category?.name);
                    showDeleteConfirmation(goal.id);
                  }}
                  disabled={isDeleting === goal.id}
                >
                  <Trash2 
                    size={20} 
                    color={isDeleting === goal.id ? Colors.gray[400] : Colors.error[500]} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { 
                      width: `${calculateProgress(goal.current_amount, goal.target_amount)}%`,
                      backgroundColor: goal.category?.is_expense ? Colors.error[500] : Colors.success[500]
                    },
                  ]}
                />
              </View>
              <View style={styles.amountContainer}>
                <Text style={[
                  styles.currentAmount,
                  { color: goal.category?.is_expense ? Colors.error[500] : Colors.success[500] }
                ]}>
                  {goal.current_amount.toLocaleString()} FCFA
                </Text>
                <Text style={styles.targetAmount}>
                  / {goal.target_amount.toLocaleString()} FCFA
                </Text>
              </View>
              <Text style={styles.progressPercentage}>
                {calculateProgress(goal.current_amount, goal.target_amount).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}

        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Vous n'avez pas encore d'objectifs financiers.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Créez votre premier objectif pour suivre vos dépenses ou revenus mensuels.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal d'ajout */}
      <AddGoalModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onGoalAdded={handleGoalAdded}
      />

      {/* Modal de confirmation de suppression personnalisé */}
      <Modal
        visible={deleteConfirmation.visible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <View style={styles.warningIconContainer}>
                <AlertTriangle size={32} color={Colors.error[500]} />
              </View>
              <Text style={styles.deleteModalTitle}>Supprimer l'objectif</Text>
            </View>

            <Text style={styles.deleteModalMessage}>
              Êtes-vous sûr de vouloir supprimer l'objectif{' '}
              <Text style={styles.deleteModalGoalName}>"{deleteConfirmation.goalName}"</Text> ?
            </Text>

            <Text style={styles.deleteModalWarning}>
              Cette action est irréversible et supprimera définitivement cet objectif.
            </Text>

            <View style={styles.deleteModalButtons}>
              <Button
                title="Annuler"
                onPress={cancelDelete}
                variant="outline"
                style={styles.deleteModalButton}
              />
              <Button
                title="Supprimer"
                onPress={confirmDelete}
                style={[styles.deleteModalButton, styles.deleteButton]}
                loading={isDeleting === deleteConfirmation.goalId}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de modification */}
      {editingGoal && (
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Modifier l'objectif</Text>

            {/* Afficher seulement la catégorie sélectionnée */}
            <View style={styles.selectedCategoryContainer}>
              <Text style={styles.sectionTitle}>Catégorie</Text>
              <View style={styles.selectedCategoryCard}>
                <View 
                  style={[
                    styles.categoryDot,
                    { backgroundColor: editingGoal.category?.color || Colors.gray[300] }
                  ]} 
                />
                <Text style={styles.selectedCategoryText}>
                  {editingGoal.category?.name}
                </Text>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Montant cible (FCFA)</Text>
              <TextInput
                style={styles.input}
                value={editTargetAmount}
                onChangeText={setEditTargetAmount}
                keyboardType="numeric"
                placeholder="Montant cible"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Annuler"
                onPress={() => {
                  setEditingGoal(null);
                  setEditTargetAmount('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Mettre à jour"
                onPress={handleUpdateGoal}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Layout.spacing.m,
  },
  periodIndicator: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.xs,
  },
  periodSubtext: {
    fontSize: 12,
    color: Colors.primary[600],
  },
  goalCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Layout.spacing.s,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  goalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: Layout.spacing.xs,
  },
  goalType: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: Layout.spacing.xs,
    marginLeft: Layout.spacing.s,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  progressContainer: {
    marginTop: Layout.spacing.s,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Layout.spacing.xs,
  },
  currentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetAmount: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  progressPercentage: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: Layout.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray[400],
    textAlign: 'center',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.l,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.l,
    textAlign: 'center',
  },
  selectedCategoryContainer: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  selectedCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  selectedCategoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary[700],
  },
  inputSection: {
    marginBottom: Layout.spacing.l,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.m,
  },
  modalButton: {
    flex: 1,
  },
  // Styles pour le modal de confirmation de suppression
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  deleteModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: Colors.gray[700],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.m,
  },
  deleteModalGoalName: {
    fontWeight: '600',
    color: Colors.error[600],
  },
  deleteModalWarning: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Layout.spacing.xl,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  deleteModalButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: Colors.error[500],
  },
});