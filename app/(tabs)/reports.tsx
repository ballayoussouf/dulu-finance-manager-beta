import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useFinance } from '@/contexts/FinanceContext';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import SpendingByCategory from '@/components/reports/SpendingByCategory';
import MonthlyOverview from '@/components/reports/MonthlyOverview';
import DatePicker from '@/components/ui/DatePicker';
import { ChevronDown, Download, X, Calendar, FileText, File } from 'lucide-react-native';
import Button from '@/components/ui/Button';

export default function ReportsScreen() {
  const { 
    transactions, 
    categories, 
    refreshTransactions, 
    refreshCategories,
    refreshData,
    isLoading,
    lastUpdated 
  } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('Ce mois');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États pour l'export personnalisé avec DatePicker
  const [exportStartDate, setExportStartDate] = useState<string | null>(null);
  const [exportEndDate, setExportEndDate] = useState<string | null>(null);

  // Rafraîchissement automatique quand la vue devient active
  useFocusRefresh({
    onRefresh: async () => {
      await Promise.all([refreshTransactions(), refreshCategories()]);
    },
    refreshInterval: 30000, // 30 secondes
    enabled: true,
  });

  // Options simplifiées comme demandé
  const periods = [
    'Cette semaine',
    'Ce mois',
    'Mois dernier',
  ];

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    return lastUpdated.toLocaleDateString('fr-FR');
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    setShowPeriodPicker(false);
  };

  // Fonction pour filtrer les transactions selon la période sélectionnée
  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (selectedPeriod) {
      case 'Cette semaine':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = début de semaine
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'Ce mois':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
        
      case 'Mois dernier':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
        
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Calculer les insights dynamiques basés sur les données filtrées
  const generateDynamicInsights = (filteredTransactions: any[]) => {
    if (filteredTransactions.length === 0) {
      return [
        '📊 Aucune transaction pour cette période',
        '💡 Commencez à enregistrer vos transactions pour voir des analyses',
        '🎯 Définissez des objectifs financiers pour suivre vos progrès'
      ];
    }

    const insights = [];
    
    // Analyser les dépenses par catégorie
    const expensesByCategory: Record<string, number> = {};
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const category = categories.find(c => c.id === t.category);
        const categoryName = category?.name || 'Non catégorisé';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + t.amount;
        return sum + t.amount;
      }, 0);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Catégorie de dépenses la plus élevée
    const topCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && totalExpenses > 0) {
      const percentage = ((topCategory[1] / totalExpenses) * 100).toFixed(0);
      insights.push(`💡 Votre catégorie de dépenses la plus élevée est ${topCategory[0]} (${percentage}% des dépenses)`);
    }

    // Taux d'épargne
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100);
      if (savingsRate > 0) {
        insights.push(`💰 Vous avez épargné ${savingsRate.toFixed(0)}% de vos revenus pour cette période`);
      } else {
        insights.push(`⚠️ Vos dépenses dépassent vos revenus de ${Math.abs(savingsRate).toFixed(0)}%`);
      }
    }

    // Comparaison avec la période précédente (si possible)
    const previousPeriodTransactions = getPreviousPeriodTransactions();
    if (previousPeriodTransactions.length > 0) {
      const previousExpenses = previousPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (previousExpenses > 0) {
        const changePercentage = ((totalExpenses - previousExpenses) / previousExpenses * 100);
        if (changePercentage > 0) {
          insights.push(`📈 Vos dépenses ont augmenté de ${changePercentage.toFixed(0)}% par rapport à la période précédente`);
        } else {
          insights.push(`📉 Vos dépenses ont diminué de ${Math.abs(changePercentage).toFixed(0)}% par rapport à la période précédente`);
        }
      }
    }

    // Ajouter des insights par défaut si pas assez de données
    while (insights.length < 3) {
      const defaultInsights = [
        '🎯 Définissez des objectifs financiers pour mieux suivre vos progrès',
        '📱 Utilisez l\'assistant DULU pour obtenir des conseils personnalisés',
        '📊 Consultez régulièrement vos rapports pour optimiser vos finances'
      ];
      
      for (const insight of defaultInsights) {
        if (!insights.includes(insight) && insights.length < 3) {
          insights.push(insight);
        }
      }
    }

    return insights.slice(0, 3);
  };

  // Fonction pour obtenir les transactions de la période précédente
  const getPreviousPeriodTransactions = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'Cette semaine':
        // Semaine précédente
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        endDate = new Date(now);
        endDate.setDate(now.getDate() - daysToMonday - 1);
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        break;
        
      case 'Ce mois':
        // Mois précédent
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      case 'Mois dernier':
        // Deux mois avant
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
        
      default:
        return [];
    }

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // 🔧 NOUVELLE FONCTION pour obtenir le mois précis selon la période
  const getPreciseMonthInfo = (period: string) => {
    const now = new Date();
    
    switch (period) {
      case 'Ce mois':
        return {
          monthName: now.toLocaleDateString('fr-FR', { month: 'long' }),
          year: now.getFullYear()
        };
        
      case 'Mois dernier':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          monthName: lastMonth.toLocaleDateString('fr-FR', { month: 'long' }),
          year: lastMonth.getFullYear()
        };
        
      case 'Cette semaine':
        return {
          monthName: now.toLocaleDateString('fr-FR', { month: 'long' }),
          year: now.getFullYear()
        };
        
      default:
        return {
          monthName: now.toLocaleDateString('fr-FR', { month: 'long' }),
          year: now.getFullYear()
        };
    }
  };

  // Fonctions d'export pour les rapports
  const generateReportCSV = (filteredTransactions: any[], startDate?: string, endDate?: string) => {
    const headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant (FCFA)'];
    
    // Calculer les totaux
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Période avec mois précis
    let periodText: string;
    if (startDate && endDate) {
      periodText = `${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`;
    } else {
      const monthInfo = getPreciseMonthInfo(selectedPeriod);
      periodText = `${selectedPeriod} (${monthInfo.monthName} ${monthInfo.year})`;
    }

    const csvContent = [
      `# Rapport Financier DULU - ${periodText}`,
      `# Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      '# RÉSUMÉ',
      `Total Revenus,${totalIncome.toLocaleString()} FCFA`,
      `Total Dépenses,${totalExpenses.toLocaleString()} FCFA`,
      `Solde,${balance.toLocaleString()} FCFA`,
      `Nombre de transactions,${filteredTransactions.length}`,
      '',
      '# DÉTAIL DES TRANSACTIONS',
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

  const generateReportPDF = (filteredTransactions: any[], startDate?: string, endDate?: string) => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // 🔧 AMÉLIORATION : Période avec mois précis entre parenthèses
    let periodText: string;
    if (startDate && endDate) {
      periodText = `${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`;
    } else {
      const monthInfo = getPreciseMonthInfo(selectedPeriod);
      periodText = `${selectedPeriod} (${monthInfo.monthName} ${monthInfo.year})`;
    }

    // Analyser les dépenses par catégorie
    const expensesByCategory: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category);
        const categoryName = category?.name || 'Non catégorisé';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + transaction.amount;
      });

    const topCategories = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport Financier DULU - ${periodText}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #8A2BE2;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #8A2BE2;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 16px;
          }
          .summary { 
            background: linear-gradient(135deg, #8A2BE2 0%, #9370DB 100%);
            color: white;
            padding: 25px; 
            margin-bottom: 30px; 
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
          }
          .summary h3 {
            margin-top: 0;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item { 
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .summary-item strong { 
            display: block;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .summary-item span {
            font-size: 14px;
            opacity: 0.9;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h3 {
            color: #8A2BE2;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th, td { 
            padding: 12px 15px; 
            text-align: left; 
            border-bottom: 1px solid #eee;
          }
          th { 
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          .income { color: #10B981; font-weight: 600; }
          .expense { color: #EF4444; font-weight: 600; }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }
          .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .category-item:last-child {
            border-bottom: none;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Rapport Financier DULU</h1>
            <p>Période: ${periodText}</p>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          
          <div class="summary">
            <h3>📈 Résumé Financier</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>${totalIncome.toLocaleString()}</strong>
                <span>Revenus (FCFA)</span>
              </div>
              <div class="summary-item">
                <strong>${totalExpenses.toLocaleString()}</strong>
                <span>Dépenses (FCFA)</span>
              </div>
              <div class="summary-item">
                <strong class="${balance >= 0 ? 'positive' : 'negative'}">${Math.abs(balance).toLocaleString()}</strong>
                <span>${balance >= 0 ? 'Épargne' : 'Déficit'} (FCFA)</span>
              </div>
              <div class="summary-item">
                <strong>${filteredTransactions.length}</strong>
                <span>Transactions</span>
              </div>
            </div>
          </div>

          ${topCategories.length > 0 ? `
          <div class="section">
            <h3>🏷️ Top 5 Catégories de Dépenses</h3>
            ${topCategories.map(([category, amount]) => `
              <div class="category-item">
                <span>${category}</span>
                <span class="expense">${amount.toLocaleString()} FCFA</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="section">
            <h3>📋 Détail des Transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions.map(t => {
                  const category = categories.find(c => c.id === t.category);
                  return `
                    <tr>
                      <td>${t.date.toLocaleDateString('fr-FR')}</td>
                      <td class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</td>
                      <td>${category?.name || 'Non catégorisé'}</td>
                      <td>${t.description || ''}</td>
                      <td class="${t.type === 'income' ? 'income' : 'expense'}">${t.amount.toLocaleString()} FCFA</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Rapport généré par DULU Finance Manager</p>
            <p>Votre assistant financier personnel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
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
      // Pour mobile, utiliser expo-file-system et expo-sharing
      downloadFileOnMobile(content, filename, mimeType);
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
          dialogTitle: 'Exporter le rapport',
          UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.html',
        });
        
        Alert.alert('Succès', 'Le rapport a été exporté et peut être partagé !');
      } else {
        Alert.alert('Erreur', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export mobile:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport. Veuillez réessayer.');
    }
  };

  const exportCurrentPeriodToCSV = () => {
    try {
      const filteredTransactions = getFilteredTransactions();
      const csvContent = generateReportCSV(filteredTransactions);
      const monthInfo = getPreciseMonthInfo(selectedPeriod);
      const filename = `rapport_${selectedPeriod.toLowerCase().replace(/\s+/g, '_')}_${monthInfo.monthName}_${monthInfo.year}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      Alert.alert('Succès', 'Le rapport a été exporté en CSV avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport en CSV. Veuillez réessayer.');
    }
  };

  const exportCurrentPeriodToPDF = () => {
    try {
      const filteredTransactions = getFilteredTransactions();
      const htmlContent = generateReportPDF(filteredTransactions);
      const monthInfo = getPreciseMonthInfo(selectedPeriod);
      const filename = `rapport_${selectedPeriod.toLowerCase().replace(/\s+/g, '_')}_${monthInfo.monthName}_${monthInfo.year}_${new Date().toISOString().split('T')[0]}.html`;
      downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
      Alert.alert('Succès', 'Le rapport a été exporté en HTML avec succès ! Vous pouvez l\'imprimer en PDF depuis votre navigateur.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport en PDF. Veuillez réessayer.');
    }
  };

  const exportCustomPeriodToCSV = () => {
    if (!exportStartDate || !exportEndDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période de début et de fin.');
      return;
    }

    try {
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      
      if (startDate > endDate) {
        Alert.alert('Erreur', 'La date de début doit être antérieure à la date de fin.');
        return;
      }

      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      const csvContent = generateReportCSV(
        filteredTransactions, 
        exportStartDate, 
        exportEndDate
      );
      const filename = `rapport_personnalise_${exportStartDate}_${exportEndDate}.csv`;
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      setShowExportModal(false);
      setExportStartDate(null);
      setExportEndDate(null);
      Alert.alert('Succès', 'Le rapport personnalisé a été exporté en CSV avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport personnalisé. Veuillez réessayer.');
    }
  };

  const exportCustomPeriodToPDF = () => {
    if (!exportStartDate || !exportEndDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une période de début et de fin.');
      return;
    }

    try {
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      
      if (startDate > endDate) {
        Alert.alert('Erreur', 'La date de début doit être antérieure à la date de fin.');
        return;
      }

      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      const htmlContent = generateReportPDF(
        filteredTransactions, 
        exportStartDate, 
        exportEndDate
      );
      const filename = `rapport_personnalise_${exportStartDate}_${exportEndDate}.html`;
      downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
      setShowExportModal(false);
      setExportStartDate(null);
      setExportEndDate(null);
      Alert.alert('Succès', 'Le rapport personnalisé a été exporté en HTML avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport personnalisé. Veuillez réessayer.');
    }
  };

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
          <Text style={styles.modalTitle}>Télécharger un rapport</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.exportContent} showsVerticalScrollIndicator={false}>
          {/* Export de la période actuelle */}
          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>📊 Rapport de la période actuelle</Text>
            <Text style={styles.exportSectionSubtitle}>
              Télécharger le rapport pour: {selectedPeriod} ({getPreciseMonthInfo(selectedPeriod).monthName} {getPreciseMonthInfo(selectedPeriod).year})
            </Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity style={styles.exportOption} onPress={exportCurrentPeriodToCSV}>
                <View style={styles.exportOptionIcon}>
                  <File size={32} color={Colors.success[500]} />
                </View>
                <Text style={styles.exportOptionTitle}>CSV</Text>
                <Text style={styles.exportOptionDescription}>
                  Format Excel pour analyse
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportOption} onPress={exportCurrentPeriodToPDF}>
                <View style={styles.exportOptionIcon}>
                  <FileText size={32} color={Colors.error[500]} />
                </View>
                <Text style={styles.exportOptionTitle}>PDF</Text>
                <Text style={styles.exportOptionDescription}>
                  Document formaté pour impression
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Export personnalisé */}
          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>🗓️ Rapport personnalisé</Text>
            <Text style={styles.exportSectionSubtitle}>
              Choisissez votre propre période
            </Text>

            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>📅 Date de début</Text>
                <DatePicker
                  value={exportStartDate}
                  onDateChange={setExportStartDate}
                  placeholder="Sélectionner la date de début"
                />
              </View>

              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>📅 Date de fin</Text>
                <DatePicker
                  value={exportEndDate}
                  onDateChange={setExportEndDate}
                  placeholder="Sélectionner la date de fin"
                />
              </View>
            </View>

            <View style={styles.customExportButtons}>
              <Button
                title="Télécharger CSV"
                onPress={exportCustomPeriodToCSV}
                style={styles.customExportButton}
                leftIcon={<File size={20} color={Colors.white} />}
              />
              <Button
                title="Télécharger PDF"
                onPress={exportCustomPeriodToPDF}
                style={styles.customExportButton}
                leftIcon={<FileText size={20} color={Colors.white} />}
              />
            </View>
          </View>

          <View style={styles.exportNote}>
            <Text style={styles.exportNoteText}>
              💡 Les rapports incluent un résumé financier détaillé avec les totaux par catégorie et toutes vos transactions pour la période sélectionnée.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const filteredTransactions = getFilteredTransactions();
  const dynamicInsights = generateDynamicInsights(filteredTransactions);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rapports Financiers</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Mis à jour {formatLastUpdated()}
            </Text>
          )}
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={() => setShowExportModal(true)}
          >
            <Download size={20} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.periodSelectorContainer}>
            <TouchableOpacity
              style={styles.periodSelector}
              onPress={() => setShowPeriodPicker(!showPeriodPicker)}
            >
              <Text style={styles.periodText}>{selectedPeriod}</Text>
              <ChevronDown 
                size={16} 
                color={Colors.gray[700]} 
                style={[
                  styles.chevronIcon,
                  showPeriodPicker && styles.chevronIconRotated
                ]}
              />
            </TouchableOpacity>
            
            {showPeriodPicker && (
              <>
                <TouchableOpacity 
                  style={styles.overlay}
                  onPress={() => setShowPeriodPicker(false)}
                  activeOpacity={1}
                />
                
                <View style={styles.periodDropdown}>
                  {periods.map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodOption,
                        selectedPeriod === period && styles.selectedPeriodOption,
                      ]}
                      onPress={() => handlePeriodSelect(period)}
                    >
                      <Text 
                        style={[
                          styles.periodOptionText,
                          selectedPeriod === period && styles.selectedPeriodOptionText,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        <MonthlyOverview 
          transactions={filteredTransactions} 
          selectedPeriod={selectedPeriod}
        />
        
        <SpendingByCategory
          transactions={filteredTransactions}
          categories={categories}
        />
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Aperçus</Text>
          {dynamicInsights.map((insight, index) => (
            <Text key={index} style={styles.insightItem}>
              {insight}
            </Text>
          ))}
        </View>
      </ScrollView>

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
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  periodSelectorContainer: {
    position: 'relative',
    zIndex: 1001,
    elevation: 1001,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.medium,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  periodText: {
    fontSize: 14,
    color: Colors.gray[800],
    marginRight: Layout.spacing.xs,
  },
  chevronIcon: {
    transition: 'transform 0.2s ease',
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
    elevation: 999,
  },
  periodDropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1002,
    minWidth: 150,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    overflow: 'visible',
  },
  periodOption: {
    paddingVertical: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  selectedPeriodOption: {
    backgroundColor: Colors.primary[50],
  },
  periodOptionText: {
    fontSize: 14,
    color: Colors.gray[800],
    textAlign: 'left',
  },
  selectedPeriodOptionText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.m,
    paddingTop: Layout.spacing.m,
    paddingBottom: Layout.spacing.xl,
  },
  summaryCard: {
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
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  insightItem: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: Layout.spacing.m,
    lineHeight: 20,
  },
  // Styles pour le modal d'export
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
  placeholder: {
    width: 24,
  },
  exportContent: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
  },
  exportSection: {
    marginBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.l,
  },
  exportSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  exportSectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.l,
  },
  exportOptions: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  exportOption: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  exportOptionDescription: {
    fontSize: 12,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 16,
  },
  dateInputsContainer: {
    gap: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
  },
  dateInputGroup: {
    gap: Layout.spacing.s,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  customExportButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  customExportButton: {
    flex: 1,
  },
  exportNote: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    marginBottom: Layout.spacing.xl,
  },
  exportNoteText: {
    fontSize: 14,
    color: Colors.primary[700],
    lineHeight: 20,
  },
});