import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Transaction, Category } from '@/types';
import Card from '../ui/Card';
import { ChevronRight } from 'lucide-react-native';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onViewAll: () => void;
}

export default function RecentTransactions({ 
  transactions, 
  categories,
  onViewAll
}: RecentTransactionsProps) {
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category);
    
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.categoryIcon, { backgroundColor: category?.color || Colors.gray[300] }]}>
          <Text style={styles.categoryInitial}>{category?.name.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.categoryName}>{category?.name || 'Non catégorisé'}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text 
            style={[
              styles.amountText, 
              item.type === 'expense' ? styles.expenseText : styles.incomeText
            ]}
          >
            {item.type === 'expense' ? '-' : '+'}{item.amount.toLocaleString()} FCFA
          </Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions récentes</Text>
        <TouchableOpacity onPress={onViewAll}>
          <View style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Voir tout</Text>
            <ChevronRight size={16} color={Colors.primary[500]} />
          </View>
        </TouchableOpacity>
      </View>

      {recentTransactions.length > 0 ? (
        <FlatList
          data={recentTransactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <Text style={styles.emptyText}>Aucune transaction récente</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary[500],
    marginRight: Layout.spacing.xs,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.s,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  categoryInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  categoryName: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeText: {
    color: Colors.success[500],
  },
  expenseText: {
    color: Colors.error[500],
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Layout.spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.gray[500],
    paddingVertical: Layout.spacing.l,
  },
});