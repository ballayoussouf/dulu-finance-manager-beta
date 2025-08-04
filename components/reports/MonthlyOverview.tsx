import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Transaction } from '@/types';
import Card from '../ui/Card';

interface MonthlyOverviewProps {
  transactions: Transaction[];
  selectedPeriod?: string;
}

export default function MonthlyOverview({ transactions, selectedPeriod = 'Ce mois' }: MonthlyOverviewProps) {
  // Calculer les totaux pour la période sélectionnée
  const periodIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const periodExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const periodSavings = periodIncome - periodExpenses;
  const savingsRate = periodIncome > 0 ? (periodSavings / periodIncome) * 100 : 0;

  // Générer les données pour le graphique selon la période
  const generatePeriodData = () => {
    const now = new Date();
    let days: number;
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'Cette semaine':
        days = 7;
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToMonday);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
        
      case 'Mois dernier':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        days = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
        startDate = lastMonth;
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      default: // 'Ce mois'
        days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Initialiser les données avec des tableaux pour revenus et dépenses
    const expenseData = Array(days).fill(0);
    const incomeData = Array(days).fill(0);
    
    // Remplir les données avec les transactions de la période
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // Vérifier si la transaction est dans la période
      if (transactionDate >= startDate && transactionDate <= endDate) {
        let dayIndex: number;
        
        if (selectedPeriod === 'Cette semaine') {
          // Pour la semaine, calculer l'index basé sur le jour de la semaine
          const dayOfWeek = transactionDate.getDay();
          dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0, Dimanche = 6
        } else {
          // Pour les mois, utiliser le jour du mois
          dayIndex = transactionDate.getDate() - 1;
        }
        
        if (dayIndex >= 0 && dayIndex < days) {
          if (transaction.type === 'expense') {
            expenseData[dayIndex] += transaction.amount;
          } else {
            incomeData[dayIndex] += transaction.amount;
          }
        }
      }
    });
    
    return { expenseData, incomeData, days, startDate, endDate };
  };
  
  const { expenseData, incomeData, days, startDate, endDate } = generatePeriodData();
  
  // 🔧 AMÉLIORATION DE L'ÉCHELLE - Calcul plus intelligent du maximum
  const allValues = [...expenseData, ...incomeData].filter(val => val > 0);
  const maxAmount = allValues.length > 0 ? Math.max(...allValues) : 1000; // Valeur par défaut si pas de données
  
  // 🎯 Hauteur minimale pour la visibilité (au moins 8% de la hauteur)
  const MIN_BAR_HEIGHT = 8;

  // Générer le titre dynamique selon la période
  const getPeriodTitle = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'Cette semaine':
        return `Aperçu de cette semaine`;
        
      case 'Mois dernier':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `Aperçu de ${lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        
      default: // 'Ce mois'
        return `Aperçu de ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    }
  };

  // Générer les labels pour l'axe X
  const generateLabels = () => {
    if (selectedPeriod === 'Cette semaine') {
      return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    } else {
      // Pour les mois, afficher tous les 5 jours
      const labels = [];
      for (let i = 0; i < days; i++) {
        if ((i + 1) % 5 === 0 || i === 0 || i === days - 1) {
          labels.push((i + 1).toString());
        } else {
          labels.push('');
        }
      }
      return labels;
    }
  };

  const labels = generateLabels();

  // 🎯 Fonction pour calculer la hauteur des barres avec une meilleure visibilité
  const calculateBarHeight = (value: number) => {
    if (value === 0) return 0;
    
    // Calculer le pourcentage normal
    const normalHeight = (value / maxAmount) * 100;
    
    // S'assurer qu'il y a une hauteur minimale pour la visibilité
    return Math.max(normalHeight, MIN_BAR_HEIGHT);
  };

  // 📊 Fonction pour formater les montants pour les tooltips
  const formatAmount = (amount: number) => {
    if (amount === 0) return '0';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
    return amount.toLocaleString();
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{getPeriodTitle()}</Text>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={styles.summaryValue}>{periodIncome.toLocaleString()} FCFA</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Dépenses</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>
            {periodExpenses.toLocaleString()} FCFA
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Épargne</Text>
          <Text style={[
            styles.summaryValue,
            periodSavings >= 0 ? styles.savingsPositive : styles.savingsNegative
          ]}>
            {Math.abs(periodSavings).toLocaleString()} FCFA
          </Text>
          <Text style={[
            styles.savingsRate,
            periodSavings >= 0 ? styles.savingsPositive : styles.savingsNegative
          ]}>
            {savingsRate.toFixed(1)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Dépenses Vs Revenus</Text>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.error[500] }]} />
            <Text style={styles.legendText}>Dépenses</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.success[500] }]} />
            <Text style={styles.legendText}>Revenus</Text>
          </View>
        </View>

        {/* 📊 Échelle des ordonnées améliorée */}
        <View style={styles.chartWithScale}>
          {/* Échelle Y (ordonnées) */}
          <View style={styles.yAxisContainer}>
            <Text style={styles.yAxisLabel}>{formatAmount(maxAmount)}</Text>
            <Text style={styles.yAxisLabel}>{formatAmount(maxAmount * 0.75)}</Text>
            <Text style={styles.yAxisLabel}>{formatAmount(maxAmount * 0.5)}</Text>
            <Text style={styles.yAxisLabel}>{formatAmount(maxAmount * 0.25)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>

          {/* Graphique principal */}
          <View style={styles.chart}>
            {/* Lignes de grille horizontales */}
            <View style={styles.gridLines}>
              <View style={[styles.gridLine, { top: '0%' }]} />
              <View style={[styles.gridLine, { top: '25%' }]} />
              <View style={[styles.gridLine, { top: '50%' }]} />
              <View style={[styles.gridLine, { top: '75%' }]} />
              <View style={[styles.gridLine, { top: '100%' }]} />
            </View>

            {/* Barres de données */}
            {Array.from({ length: days }, (_, index) => {
              const expenseHeight = calculateBarHeight(expenseData[index]);
              const incomeHeight = calculateBarHeight(incomeData[index]);
              const isToday = selectedPeriod === 'Ce mois' && index + 1 === new Date().getDate();
              const isCurrentDay = selectedPeriod === 'Cette semaine' && 
                index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barGroup}>
                    {/* Barre des dépenses (rouge) */}
                    <View 
                      style={[
                        styles.bar,
                        styles.expenseBar,
                        { height: `${expenseHeight}%` },
                        (isToday || isCurrentDay) && styles.currentDayBar,
                        expenseData[index] > 0 && styles.visibleBar
                      ]} 
                    />
                    {/* Barre des revenus (verte) */}
                    <View 
                      style={[
                        styles.bar,
                        styles.incomeBar,
                        { height: `${incomeHeight}%` },
                        (isToday || isCurrentDay) && styles.currentDayBar,
                        incomeData[index] > 0 && styles.visibleBar
                      ]} 
                    />
                  </View>
                  
                  {labels[index] && (
                    <Text style={styles.barLabel}>{labels[index]}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* 💡 Indicateur de montant maximum pour référence */}
        {maxAmount > 0 && (
          <View style={styles.chartInfo}>
            <Text style={styles.chartInfoText}>💡 Montant max: {maxAmount.toLocaleString()} FCFA</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.l,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  expenseValue: {
    color: Colors.error[500],
  },
  savingsPositive: {
    color: Colors.success[500],
  },
  savingsNegative: {
    color: Colors.error[500],
  },
  savingsRate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chartContainer: {
    marginTop: Layout.spacing.m,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.l,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  // 🔧 NOUVEAUX STYLES POUR L'ÉCHELLE AMÉLIORÉE
  chartWithScale: {
    flexDirection: 'row',
    height: 160,
  },
  yAxisContainer: {
    width: 40,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: Layout.spacing.xs,
    paddingTop: Layout.spacing.xs,
    paddingBottom: 20, // Espace pour les labels X
  },
  yAxisLabel: {
    fontSize: 10,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 20, // Espace pour les labels X
    position: 'relative',
    marginLeft: Layout.spacing.xs,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    zIndex: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gray[200],
    opacity: 0.5,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 'calc(100% - 20px)', // Soustraire l'espace des labels
    width: '100%',
    justifyContent: 'center',
    gap: 2, // Espacement entre les barres
  },
  bar: {
    width: 6, // 🔧 Barres plus larges pour une meilleure visibilité
    borderRadius: 2,
    minHeight: 3, // Hauteur minimale visible
  },
  visibleBar: {
    // 🎯 Style pour les barres avec des données
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  expenseBar: {
    backgroundColor: Colors.error[500],
  },
  incomeBar: {
    backgroundColor: Colors.success[500],
  },
  currentDayBar: {
    width: 8, // 🔧 Barres encore plus larges pour le jour actuel
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.gray[500],
    marginTop: 4,
    height: 12,
    fontWeight: '500',
  },
  // 💡 Nouveau style pour l'info du graphique
  chartInfo: {
    marginTop: Layout.spacing.s,
    alignItems: 'center',
  },
  chartInfoText: {
    fontSize: 11,
    color: Colors.gray[500],
    fontStyle: 'italic',
  },
});