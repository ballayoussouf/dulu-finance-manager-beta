import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { FinancialSummary } from '@/types';

interface BalanceCardProps {
  financialSummary: FinancialSummary;
}

export default function BalanceCard({ financialSummary }: BalanceCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Solde actuel</Text>
      <Text style={styles.balance}>
        {financialSummary.balance.toLocaleString()} FCFA
      </Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Revenus</Text>
          <Text style={styles.statValueIncome}>
            +{financialSummary.income.toLocaleString()} FCFA
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Dépenses</Text>
          <Text style={styles.statValueExpense}>
            -{financialSummary.expenses.toLocaleString()} FCFA
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.spacing.l,
  },
  title: {
    fontSize: 16,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: Layout.spacing.m,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  statValueIncome: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success[500],
  },
  statValueExpense: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error[500],
  },
  divider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: Layout.spacing.m,
  },
});