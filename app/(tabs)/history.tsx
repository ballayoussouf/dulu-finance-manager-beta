import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useFinance } from '@/contexts/FinanceContext';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import TransactionList from '@/components/transactions/TransactionList';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import EditTransactionModal from '@/components/transactions/EditTransactionModal';
import { Search, ListFilter as Filter, Plus, X, Calendar, Tag, Download, FileText, File } from 'lucide-react-native';
import { Transaction } from '@/types';
import DatePicker from '@/components/ui/DatePicker';

export default function HistoryScreen() {
  const { 
    transactions, 
    categories, 
    refreshTransactions, 
    refreshCategories,
    refreshData,
    isLoading 
  } = useFinance();
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  
  // États pour les filtres
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [amountRange, setAmountRange] = useState<{
    min: string;
    max: string;
  }>({ min: '', max: '' });
  
  // Rafraîchissement automatique quand la vue devient active
  useFocusRefresh({
    onRefresh: async () => {
      await Promise.all([refreshTransactions(), refreshCategories()]);
    },
    refreshInterval: 30000, // 30 secondes
    enabled: true,
  });

  // Filtrer les transactions selon l'onglet actif et les filtres appliqués
  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filtre par type (onglet)
    if (activeTab !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === activeTab);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description?.toLowerCase().includes(query) ||
        categories.find(c => c.id === transaction.category)?.name.toLowerCase().includes(query)
      );
    }

    // Filtre par catégories sélectionnées
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(transaction => 
        selectedCategories.includes(transaction.category)
      );
    }

    // Filtre par montant
    if (amountRange.min || amountRange.max) {
      const min = parseFloat(amountRange.min) || 0;
      const max = parseFloat(amountRange.max) || Infinity;
      filtered = filtered.filter(transaction => 
        transaction.amount >= min && transaction.amount <= max
      );
    }

    // Filtre par date
    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
      
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  const handleTransactionPress = (transaction: Transaction) => {
    console.log('Transaction pressed:', transaction);
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  // Callback appelé après l'ajout réussi d'une transaction
  const handleTransactionAdded = async () => {
    console.log('Transaction ajoutée avec succès, actualisation de la liste...');
    // Actualiser les données
    await refreshData();
  };

  // Callback appelé après la modification réussie d'une transaction
  const handleTransactionUpdated = async () => {
    console.log('Transaction modifiée avec succès, actualisation de la liste...');
    // Actualiser les données
    await refreshData();
    // Fermer le modal de modification
    setShowEditModal(false);
    setSelectedTransaction(null);
  };

  // Fonctions pour la recherche
  const handleSearch = () => {
    setShowSearchModal(true);
  };

  const handleSearchSubmit = () => {
    setShowSearchModal(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchModal(false);
  };

  // Fonctions pour les filtres
  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDateRange({ start: null, end: null });
    setAmountRange({ min: '', max: '' });
    setShowFilterModal(false);
  };

  const hasActiveFilters = () => {
    return selectedCategories.length > 0 || 
           dateRange.start || 
           dateRange.end || 
           amountRange.min || 
           amountRange.max ||
           searchQuery.trim();
  };

  // Fonctions d'export
  const generateCSV = () => {
    const headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant (FCFA)'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => {
        const category = categories.find(c => c.id === transaction.category);
        return [
          transaction.date.toLocaleDateString('fr-FR'),
          transaction.type === 'income' ? 'Revenu' : 'Dépense',
          category?.name || 'Non catégorisé',
          `"${transaction.description?.replace(/"/g, '""') || ''}"`,
          transaction.amount.toString()
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const generatePDFContent = () => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    return {
      title: 'Historique des Transactions - DULU Finance',
      period: `Période: ${dateRange.start || 'Début'} - ${dateRange.end || 'Fin'}`,
      summary: {
        totalTransactions: filteredTransactions.length,
        totalIncome,
        totalExpenses,
        balance
      },
      transactions: filteredTransactions.map(transaction => {
        const category = categories.find(c => c.id === transaction.category);
        return {
          date: transaction.date.toLocaleDateString('fr-FR'),
          type: transaction.type === 'income' ? 'Revenu' : 'Dépense',
          category: category?.name || 'Non catégorisé',
          description: transaction.description || '',
          amount: transaction.amount
        };
      })
    };
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Pour mobile, on pourrait utiliser expo-sharing ou expo-file-system
      Alert.alert(
        'Export non disponible',
        'L\'export de fichiers n\'est pas encore disponible sur mobile. Cette fonctionnalité sera ajoutée prochainement.'
      );
    }
  };

  const downloadFileOnMobile = async (content: string, filename: string, mimeType: string) => {
    try {
      // Créer le fichier dans le répertoire de cache
      const fileUri = FileSystem.cacheDirectory + filename;
      
      // Écrire le contenu dans le fichier
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Partager le fichier
        await Sharing.shareAsync(fileUri, {
          mimeType: mimeType,
          dialogTitle: 'Exporter l\'historique',
          UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.html',
        });
        
        Alert.alert('Succès', 'Le fichier a été exporté et peut être partagé !');
      } else {
        Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export mobile:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le fichier. Veuillez réessayer.');
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = generateCSV();
      const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      setShowExportModal(false);
      Alert.alert('Succès', 'L\'historique a été exporté en CSV avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter en CSV. Veuillez réessayer.');
    }
  };

  const exportToPDF = () => {
    try {
      const pdfData = generatePDFContent();
      
      // Générer un contenu HTML simple pour le PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${pdfData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .summary-item { display: inline-block; margin: 10px 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .income { color: #10B981; }
            .expense { color: #EF4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${pdfData.title}</h1>
            <p>${pdfData.period}</p>
          </div>
          
          <div class="summary">
            <h3>Résumé</h3>
            <div class="summary-item"><strong>Transactions:</strong> ${pdfData.summary.totalTransactions}</div>
            <div class="summary-item"><strong>Revenus:</strong> ${pdfData.summary.totalIncome.toLocaleString()} FCFA</div>
            <div class="summary-item"><strong>Dépenses:</strong> ${pdfData.summary.totalExpenses.toLocaleString()} FCFA</div>
            <div class="summary-item"><strong>Solde:</strong> ${pdfData.summary.balance.toLocaleString()} FCFA</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              ${pdfData.transactions.map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td class="${t.type === 'Revenu' ? 'income' : 'expense'}">${t.type}</td>
                  <td>${t.category}</td>
                  <td>${t.description}</td>
                  <td class="${t.type === 'Revenu' ? 'income' : 'expense'}">${t.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const filename = `transactions_${new Date().toISOString().split('T')[0]}.html`;
      downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
      setShowExportModal(false);
      Alert.alert('Succès', 'L\'historique a été exporté en HTML avec succès ! Vous pouvez l\'imprimer en PDF depuis votre navigateur.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter en PDF. Veuillez réessayer.');
    }
  };

  // Modal de recherche
  const SearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSearchModal(false)}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Rechercher</Text>
          <TouchableOpacity onPress={clearSearch}>
            <Text style={styles.clearText}>Effacer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.gray[500]} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par description ou catégorie..."
            placeholderTextColor={Colors.gray[400]}
            autoFocus
          />
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchSubmit}
          >
            <Text style={styles.searchButtonText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal de filtres
  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtres</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Filtre par catégories */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Tag size={16} color={Colors.gray[600]} />
              <Text style={styles.filterSectionTitle}>Catégories</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilterChip,
                    selectedCategories.includes(category.id) && styles.categoryFilterChipSelected
                  ]}
                  onPress={() => toggleCategoryFilter(category.id)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategories.includes(category.id) && styles.categoryFilterTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtre par montant */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Montant (FCFA)</Text>
            <View style={styles.amountRangeContainer}>
              <TextInput
                style={styles.amountInput}
                value={amountRange.min}
                onChangeText={(text) => setAmountRange(prev => ({ ...prev, min: text }))}
                placeholder="Min"
                keyboardType="numeric"
                placeholderTextColor={Colors.gray[400]}
              />
              <Text style={styles.amountSeparator}>-</Text>
              <TextInput
                style={styles.amountInput}
                value={amountRange.max}
                onChangeText={(text) => setAmountRange(prev => ({ ...prev, max: text }))}
                placeholder="Max"
                keyboardType="numeric"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
          </View>

          {/* Filtre par date */}
          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Calendar size={16} color={Colors.gray[600]} />
              <Text style={styles.filterSectionTitle}>Période</Text>
            </View>
            <View style={styles.dateRangeContainer}>
              <DatePicker
                value={dateRange.start}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                placeholder="Date de début"
                label="Date de début"
              />
              <DatePicker
                value={dateRange.end}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                placeholder="Date de fin"
                label="Date de fin"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal d'export
  const ExportModal = () => (
    <Modal
      visible={showExportModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowExportModal(false)}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Exporter l'historique</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.exportContent}>
          <Text style={styles.exportDescription}>
            Exportez votre historique de transactions dans le format de votre choix.
          </Text>
          
          <Text style={styles.exportInfo}>
            {filteredTransactions.length} transaction(s) seront exportées
          </Text>

          <View style={styles.exportOptions}>
            <TouchableOpacity style={styles.exportOption} onPress={exportToCSV}>
              <View style={styles.exportOptionIcon}>
                <File size={32} color={Colors.success[500]} />
              </View>
              <Text style={styles.exportOptionTitle}>Format CSV</Text>
              <Text style={styles.exportOptionDescription}>
                Fichier Excel compatible, idéal pour l'analyse de données
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption} onPress={exportToPDF}>
              <View style={styles.exportOptionIcon}>
                <FileText size={32} color={Colors.error[500]} />
              </View>
              <Text style={styles.exportOptionTitle}>Format PDF</Text>
              <Text style={styles.exportOptionDescription}>
                Document formaté avec résumé, idéal pour l'impression
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exportNote}>
            <Text style={styles.exportNoteText}>
              💡 Les filtres et recherches appliqués seront pris en compte dans l'export
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique des transactions</Text>
      </View>
      
      <View style={styles.actionsBar}>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleAddTransaction}
          >
            <Plus size={20} color={Colors.primary[500]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowExportModal(true)}
          >
            <Download size={20} color={Colors.gray[700]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.iconButton,
              searchQuery.trim() && styles.iconButtonActive
            ]}
            onPress={handleSearch}
          >
            <Search size={20} color={searchQuery.trim() ? Colors.white : Colors.gray[700]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.iconButton,
              hasActiveFilters() && styles.iconButtonActive
            ]}
            onPress={handleFilter}
          >
            <Filter size={20} color={hasActiveFilters() ? Colors.white : Colors.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'all' && styles.activeTabText
            ]}
          >
            Tout ({transactions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'income' && styles.activeTabText
            ]}
          >
            Revenus ({transactions.filter(t => t.type === 'income').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'expense' && styles.activeTabText
            ]}
          >
            Dépenses ({transactions.filter(t => t.type === 'expense').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters() && (
        <View style={styles.activeFiltersIndicator}>
          <Text style={styles.activeFiltersText}>
            {filteredTransactions.length} résultat(s) trouvé(s)
          </Text>
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            clearFilters();
          }}>
            <Text style={styles.clearAllFiltersText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.listContainer}>
        <TransactionList
          transactions={filteredTransactions}
          categories={categories}
          onTransactionPress={handleTransactionPress}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
              tintColor={Colors.primary[500]}
            />
          }
        />
      </View>

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTransactionAdded={handleTransactionAdded}
        initialType={activeTab === 'income' ? 'income' : 'expense'}
      />

      <EditTransactionModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTransaction(null);
        }}
        onTransactionUpdated={handleTransactionUpdated}
        transaction={selectedTransaction}
      />

      <SearchModal />
      <FilterModal />
      <ExportModal />
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
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.s,
  },
  iconButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
  },
  tab: {
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    borderRadius: Layout.borderRadius.full,
    marginRight: Layout.spacing.s,
  },
  activeTab: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  activeTabText: {
    color: Colors.white,
  },
  activeFiltersIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.s,
    backgroundColor: Colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  clearAllFiltersText: {
    fontSize: 14,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  // Styles pour les modals
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'ios' ? Layout.spacing.xl : Layout.spacing.l,
    paddingBottom: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  clearText: {
    fontSize: 16,
    color: Colors.primary[500],
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  // Styles pour la recherche
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Layout.spacing.l,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: Layout.spacing.s,
    fontSize: 16,
    color: Colors.gray[800],
  },
  searchButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour les filtres
  filterContent: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
  },
  filterSection: {
    marginBottom: Layout.spacing.l,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginLeft: Layout.spacing.xs,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.s,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.full,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.s,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryFilterChipSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
  },
  categoryFilterText: {
    fontSize: 12,
    color: Colors.gray[700],
  },
  categoryFilterTextSelected: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  amountInput: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    fontSize: 16,
    color: Colors.gray[800],
  },
  amountSeparator: {
    fontSize: 16,
    color: Colors.gray[500],
  },
  dateRangeContainer: {
    gap: Layout.spacing.s,
  },
  dateInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    fontSize: 16,
    color: Colors.gray[800],
  },
  modalFooter: {
    padding: Layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  applyButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour l'export
  exportContent: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.l,
  },
  exportDescription: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    lineHeight: 24,
  },
  exportInfo: {
    fontSize: 14,
    color: Colors.primary[600],
    textAlign: 'center',
    backgroundColor: Colors.primary[50],
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.xl,
    fontWeight: '500',
  },
  exportOptions: {
    gap: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  exportOption: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportOptionIcon: {
    marginBottom: Layout.spacing.m,
  },
  exportOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  exportOptionDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  exportNote: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  exportNoteText: {
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
  },
});