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
import DatePicker from '@/components/ui/DatePicker';
import { useFinance } from '@/contexts/FinanceContext';
import { X, Plus, Minus, Calendar, Tag, FileText, DollarSign, CheckCircle, CreditCard as Edit3, Trash2, AlertTriangle } from 'lucide-react-native';
import { Transaction } from '@/types';

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionUpdated?: () => void;
  transaction: Transaction | null;
}

export default function EditTransactionModal({
  visible,
  onClose,
  onTransactionUpdated,
  transaction,
}: EditTransactionModalProps) {
  const { categories, updateTransaction, deleteTransaction, refreshTransactions } = useFinance();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: string;
    amount: string;
    description: string;
    action: 'modified' | 'deleted';
  } | null>(null);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    category?: string;
  }>({});

  // Initialiser les données du formulaire avec la transaction à modifier
  useEffect(() => {
    if (transaction && visible) {
      setTransactionType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setSelectedCategory(transaction.category);
      setDate(transaction.date.toISOString().split('T')[0]);
      setErrors({});
      setShowSuccess(false);
      setShowDeleteConfirmation(false);
      setSuccessData(null);
    }
  }, [transaction, visible]);

  const filteredCategories = categories.filter(
    (category) => category.type === transactionType
  );

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
    setTransactionType('expense');
    setShowSuccess(false);
    setShowDeleteConfirmation(false);
    setSuccessData(null);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Veuillez entrer un montant valide';
    }
    if (!description.trim()) {
      newErrors.description = 'Veuillez entrer une description';
    }
    if (!selectedCategory) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!transaction || !validateForm()) return;
    
    setIsLoading(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        type: transactionType,
        category: selectedCategory,
        description: description.trim(),
        date: new Date(date),
      });

      // Sauvegarder les données pour l'affichage de succès
      setSuccessData({
        type: transactionType === 'expense' ? 'Dépense' : 'Revenu',
        amount: parseFloat(amount).toLocaleString() + ' FCFA',
        description: description.trim(),
        action: 'modified',
      });

      // Actualiser les transactions
      await refreshTransactions();
      
      // Notifier le parent de la modification
      if (onTransactionUpdated) {
        onTransactionUpdated();
      }

      // Afficher l'écran de succès
      setShowSuccess(true);

    } catch (error) {
      console.error('Erreur lors de la modification de la transaction:', error);
      Alert.alert(
        'Erreur', 
        "Impossible de modifier la transaction. Veuillez réessayer.",
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    setIsDeleting(true);
    try {
      // Sauvegarder les données pour l'affichage de succès
      const currentCategory = categories.find(c => c.id === transaction.category);
      setSuccessData({
        type: transaction.type === 'expense' ? 'Dépense' : 'Revenu',
        amount: transaction.amount.toLocaleString() + ' FCFA',
        description: transaction.description || 'Sans description',
        action: 'deleted',
      });

      await deleteTransaction(transaction.id);

      // Actualiser les transactions
      await refreshTransactions();
      
      // Notifier le parent de la suppression
      if (onTransactionUpdated) {
        onTransactionUpdated();
      }

      // Fermer la confirmation et afficher le succès
      setShowDeleteConfirmation(false);
      setShowSuccess(true);

    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error);
      Alert.alert(
        'Erreur', 
        "Impossible de supprimer la transaction. Veuillez réessayer.",
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccessClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setSelectedCategory('');
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Modal de confirmation de suppression
  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteConfirmation}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirmation(false)}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalHeader}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={32} color={Colors.error[500]} />
            </View>
            <Text style={styles.deleteModalTitle}>Supprimer la transaction</Text>
          </View>

          <Text style={styles.deleteModalMessage}>
            Êtes-vous sûr de vouloir supprimer cette transaction ?
          </Text>

          <View style={styles.deleteModalDetails}>
            <Text style={styles.deleteModalDetailText}>
              <Text style={styles.deleteModalDetailLabel}>Type: </Text>
              {transaction?.type === 'expense' ? 'Dépense' : 'Revenu'}
            </Text>
            <Text style={styles.deleteModalDetailText}>
              <Text style={styles.deleteModalDetailLabel}>Montant: </Text>
              {transaction?.amount.toLocaleString()} FCFA
            </Text>
            <Text style={styles.deleteModalDetailText}>
              <Text style={styles.deleteModalDetailLabel}>Description: </Text>
              {transaction?.description || 'Sans description'}
            </Text>
          </View>

          <Text style={styles.deleteModalWarning}>
            Cette action est irréversible et supprimera définitivement cette transaction.
          </Text>

          <View style={styles.deleteModalButtons}>
            <Button
              title="Annuler"
              onPress={() => setShowDeleteConfirmation(false)}
              variant="outline"
              style={styles.deleteModalButton}
            />
            <Button
              title="Supprimer"
              onPress={handleDelete}
              style={[styles.deleteModalButton, styles.deleteButton]}
              loading={isDeleting}
              leftIcon={<Trash2 size={16} color={Colors.white} />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Écran de succès
  if (showSuccess && successData) {
    const isDeleted = successData.action === 'deleted';
    
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={80} color={Colors.success[500]} />
            </View>
            
            <Text style={styles.successTitle}>
              {isDeleted ? 'Transaction supprimée !' : 'Transaction modifiée !'}
            </Text>
            
            <Text style={styles.successMessage}>
              Votre {successData.type.toLowerCase()} a été {isDeleted ? 'supprimée' : 'mise à jour'} avec succès.
            </Text>

            <View style={styles.successDetails}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Type :</Text>
                <Text style={[
                  styles.successDetailValue,
                  { color: transactionType === 'expense' ? Colors.error[500] : Colors.success[500] }
                ]}>
                  {successData.type}
                </Text>
              </View>
              
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Montant :</Text>
                <Text style={styles.successDetailValue}>{successData.amount}</Text>
              </View>
              
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Description :</Text>
                <Text style={styles.successDetailValue}>{successData.description}</Text>
              </View>
            </View>

            <Button
              title="Terminé"
              onPress={handleSuccessClose}
              style={styles.successButton}
            />
          </View>
        </View>
      </Modal>
    );
  }

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header avec icône poubelle corrigée */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier la transaction</Text>
          <TouchableOpacity 
            onPress={() => setShowDeleteConfirmation(true)} 
            style={styles.deleteHeaderButton}
            disabled={isDeleting}
          >
            <Trash2 size={22} color={Colors.error[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de transaction</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => handleTypeChange('expense')}
              >
                <Minus
                  size={20}
                  color={
                    transactionType === 'expense' ? Colors.white : Colors.error[500]
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Dépense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => handleTypeChange('income')}
              >
                <Plus
                  size={20}
                  color={
                    transactionType === 'income' ? Colors.white : Colors.success[500]
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Revenu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Montant */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <DollarSign size={16} color={Colors.gray[600]} />
              <Text style={styles.sectionTitleText}>Montant (FCFA)</Text>
            </View>
            <TextInput
              style={[styles.amountInput, errors.amount && styles.inputError]}
              value={amount}
              onChangeText={(text) => {
                const formatted = formatAmount(text);
                setAmount(formatted);
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <FileText size={16} color={Colors.gray[600]} />
              <Text style={styles.sectionTitleText}>Description</Text>
            </View>
            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder={`Description de ${
                transactionType === 'expense' ? 'la dépense' : 'du revenu'
              }`}
              placeholderTextColor={Colors.gray[400]}
              maxLength={100}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Catégorie */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Tag size={16} color={Colors.gray[600]} />
              <Text style={styles.sectionTitleText}>Catégorie</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    if (errors.category) {
                      setErrors((prev) => ({ ...prev, category: undefined }));
                    }
                  }}
                >
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.id &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={16} color={Colors.gray[600]} />
              <Text style={styles.sectionTitleText}>Date</Text>
            </View>
            <DatePicker
              value={date}
              onDateChange={setDate}
              placeholder="Sélectionner une date"
            />
          </View>

          {/* Résumé des modifications */}
          {amount.trim() !== '' && description.trim() !== '' && selectedCategory && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Résumé des modifications</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type :</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color:
                          transactionType === 'expense'
                            ? Colors.error[500]
                            : Colors.success[500],
                      },
                    ]}
                  >
                    {transactionType === 'expense' ? 'Dépense' : 'Revenu'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Montant :</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(amount || '0').toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Catégorie :</Text>
                  <Text style={styles.summaryValue}>
                    {
                      filteredCategories.find((c) => c.id === selectedCategory)
                        ?.name
                    }
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date :</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Annuler"
            onPress={handleClose}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title="Modifier"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.footerButton}
            leftIcon={<Edit3 size={20} color={Colors.white} />}
          />
        </View>

        {/* Modal de confirmation de suppression */}
        <DeleteConfirmationModal />
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
  // 🗑️ ICÔNE POUBELLE CORRIGÉE - Style amélioré
  deleteHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error[200],
    shadowColor: Colors.error[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginLeft: Layout.spacing.xs,
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
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  amountInput: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.l,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.gray[800],
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
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
  inputError: {
    borderColor: Colors.error[500],
  },
  errorText: {
    color: Colors.error[500],
    fontSize: 12,
    marginTop: Layout.spacing.xs,
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
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Layout.spacing.s,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.gray[700],
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  summarySection: {
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
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
  // Styles pour l'écran de succès
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
    backgroundColor: Colors.white,
  },
  successIconContainer: {
    marginBottom: Layout.spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.m,
  },
  successDetails: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.s,
  },
  successDetailLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  successDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  successButton: {
    width: '100%',
    paddingVertical: Layout.spacing.m,
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
    marginBottom: Layout.spacing.l,
  },
  deleteModalDetails: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  deleteModalDetailText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: Layout.spacing.xs,
  },
  deleteModalDetailLabel: {
    fontWeight: '600',
    color: Colors.gray[800],
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