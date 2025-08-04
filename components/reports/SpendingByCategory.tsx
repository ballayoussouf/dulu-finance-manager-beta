import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Transaction, Category } from '@/types';
import Card from '../ui/Card';

interface SpendingByCategoryProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function SpendingByCategory({
  transactions,
  categories,
}: SpendingByCategoryProps) {
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const calculateCategoryData = () => {
    const data: Record<string, number> = {};
    const currentTotal = selectedType === 'expense' ? totalExpenses : totalIncome;
    
    transactions
      .filter(t => t.type === selectedType)
      .forEach(transaction => {
        if (!data[transaction.category]) {
          data[transaction.category] = 0;
        }
        data[transaction.category] += transaction.amount;
      });
    
    return Object.entries(data)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Inconnu',
          color: category?.color || Colors.gray[300],
          amount,
          percentage: currentTotal > 0 ? (amount / currentTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryData = calculateCategoryData();
  const currentTotal = selectedType === 'expense' ? totalExpenses : totalIncome;

  const renderCategoryItem = ({ item }: { item: typeof categoryData[0] }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryNameContainer}>
          <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
          <Text style={styles.categoryName}>{item.categoryName}</Text>
        </View>
        <Text style={styles.categoryAmount}>{item.amount.toLocaleString()} FCFA</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${item.percentage}%`,
              backgroundColor: item.color
            }
          ]} 
        />
      </View>
      
      <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
    </View>
  );

  const getTitle = () => {
    return selectedType === 'expense' ? 'Dépenses par catégorie' : 'Revenus par catégorie';
  };

  const getEmptyMessage = () => {
    return selectedType === 'expense' 
      ? 'Aucune donnée de dépenses disponible'
      : 'Aucune donnée de revenus disponible';
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{getTitle()}</Text>
        
        {/* Toggle pour basculer entre dépenses et revenus */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonLeft,
              selectedType === 'expense' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedType('expense')}
          >
            <Text style={[
              styles.toggleButtonText,
              selectedType === 'expense' && styles.toggleButtonTextActive
            ]}>
              Dépenses
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonRight,
              selectedType === 'income' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedType('income')}
          >
            <Text style={[
              styles.toggleButtonText,
              selectedType === 'income' && styles.toggleButtonTextActive
            ]}>
              Revenus
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Indicateur du total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>
          Total {selectedType === 'expense' ? 'des dépenses' : 'des revenus'}:
        </Text>
        <Text style={[
          styles.totalAmount,
          { color: selectedType === 'expense' ? Colors.error[500] : Colors.success[500] }
        ]}>
          {currentTotal.toLocaleString()} FCFA
        </Text>
      </View>
      
      {currentTotal > 0 ? (
        <FlatList
          data={categoryData}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.categoryId}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          <Text style={styles.emptySubtext}>
            {selectedType === 'expense' 
              ? 'Commencez à enregistrer vos dépenses pour voir l\'analyse par catégorie'
              : 'Commencez à enregistrer vos revenus pour voir l\'analyse par catégorie'
            }
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.spacing.m,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.full,
    padding: 2,
    marginLeft: Layout.spacing.m,
  },
  toggleButton: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.m,
    borderRadius: Layout.borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonLeft: {
    // Pas de styles spéciaux pour le bouton gauche
  },
  toggleButtonRight: {
    // Pas de styles spéciaux pour le bouton droit
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary[500],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  toggleButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.m,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: Layout.spacing.s,
  },
  categoryItem: {
    marginVertical: Layout.spacing.s,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Layout.spacing.s,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginBottom: Layout.spacing.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Layout.spacing.s,
  },
  emptyContainer: {
    padding: Layout.spacing.l,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.gray[500],
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.gray[400],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});