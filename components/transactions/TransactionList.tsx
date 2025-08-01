import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Transaction, Category } from '@/types';
import { ChevronRight } from 'lucide-react-native';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onTransactionPress: (transaction: Transaction) => void;
  refreshControl?: React.ReactElement;
}

export default function TransactionList({ 
  transactions, 
  categories,
  onTransactionPress,
  refreshControl,
}: TransactionListProps) {
  const sortedTransactions = [...transactions]
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {};
    
    sortedTransactions.forEach(transaction => {
      const dateKey = transaction.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    return Object.entries(groups).map(([date, transactions]) => ({
      date: new Date(date),
      transactions,
    }));
  };

  const groupedTransactions = groupTransactionsByDate();

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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const calculateDailyTotal = (transactions: Transaction[]): number => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, 0);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category);
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => onTransactionPress(item)}
      >
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
          <ChevronRight size={16} color={Colors.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }: { item: { date: Date; transactions: Transaction[] } }) => {
    const dailyTotal = calculateDailyTotal(item.transactions);
    const isPositive = dailyTotal >= 0;
    
    return (
      <View style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text 
            style={[
              styles.dailyTotalText,
              isPositive ? styles.positiveTotal : styles.negativeTotal
            ]}
          >
            {isPositive ? '+' : ''}{dailyTotal.toLocaleString()} FCFA
          </Text>
        </View>
        
        <View style={styles.transactionGroup}>
          <FlatList
            data={item.transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {transactions.length > 0 ? (
        <FlatList
          data={groupedTransactions}
          renderItem={renderDateGroup}
          keyExtractor={item => item.date.toISOString()}
          contentContainerStyle={styles.listContent}
          refreshControl={refreshControl}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Layout.spacing.l,
  },
  dateGroup: {
    marginBottom: Layout.spacing.m,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  dailyTotalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveTotal: {
    color: Colors.success[500],
  },
  negativeTotal: {
    color: Colors.error[500],
  },
  transactionGroup: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    marginHorizontal: Layout.spacing.m,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: Layout.spacing.xs,
  },
  incomeText: {
    color: Colors.success[500],
  },
  expenseText: {
    color: Colors.error[500],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: Layout.spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray[500],
  },
});