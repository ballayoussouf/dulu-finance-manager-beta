import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react-native';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  payment_method: string;
  plan_id: string;
  transaction_id: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  metadata?: any;
}

type FilterStatus = 'all' | 'completed' | 'failed' | 'pending';

export default function PaymentHistoryScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  useEffect(() => {
    // Appliquer le filtre actif chaque fois que les paiements ou le filtre changent
    applyFilter(activeFilter);
  }, [payments, activeFilter]);

  const fetchPayments = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching payments for user:', user.id);
      
      // Récupérer tous les paiements (pas seulement les complétés)
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .is('metadata->test', null) // Exclure les paiements de test
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Found payments for user:', data?.length || 0);
      setPayments(data || []);
      // Initialiser les paiements filtrés avec tous les paiements
      applyFilter(activeFilter, data || []);

    } catch (error) {
      console.error('💥 Error fetching payments:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des paiements');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (filter: FilterStatus, paymentData = payments) => {
    console.log('Applying filter:', filter);
    
    let filtered: Payment[];
    
    switch (filter) {
      case 'completed':
        filtered = paymentData.filter(p => p.status === 'completed');
        break;
      case 'failed':
        filtered = paymentData.filter(p => ['failed', 'cancelled', 'rejected'].includes(p.status));
        break;
      case 'pending':
        filtered = paymentData.filter(p => ['pending', 'processing'].includes(p.status));
        break;
      case 'all':
      default:
        filtered = [...paymentData];
        break;
    }
    
    console.log(`Filter "${filter}" applied: ${filtered.length} payments`);
    setFilteredPayments(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color={Colors.success[500]} />;
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return <XCircle size={20} color={Colors.error[500]} />;
      case 'pending':
      case 'processing':
        return <Clock size={20} color={Colors.warning[500]} />;
      default:
        return <AlertCircle size={20} color={Colors.gray[500]} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En cours';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success[500];
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return Colors.error[500];
      case 'pending':
      case 'processing':
        return Colors.warning[500];
      case 'refunded':
        return Colors.primary[500];
      default:
        return Colors.gray[500];
    }
  };

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'pro':
        return 'Plan Pro';
      case 'premium':
        return 'Plan Premium';
      case 'free':
        return 'Plan Essai';
      default:
        return planId || 'Plan inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.planContainer}>
            <CreditCard size={16} color={Colors.primary[500]} />
            <Text style={styles.planName}>{getPlanName(item.plan_id)}</Text>
          </View>
          <Text style={styles.paymentDate}>{formatDate(item.payment_date)}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatAmount(item.amount, item.currency)}</Text>
          {item.payment_method && (
            <Text style={styles.paymentMethod}>{item.payment_method}</Text>
          )}
        </View>

        {item.subscription_start_date && item.subscription_end_date && (
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionLabel}>Période d'abonnement :</Text>
            <Text style={styles.subscriptionPeriod}>
              {new Date(item.subscription_start_date).toLocaleDateString('fr-FR')} - {' '}
              {new Date(item.subscription_end_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        {item.transaction_id && (
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>ID Transaction :</Text>
            <Text style={styles.transactionId}>
              {item.transaction_id.length > 16 
                ? `${item.transaction_id.substring(0, 16)}...` 
                : item.transaction_id
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <CreditCard size={64} color={Colors.gray[400]} />
      <Text style={styles.emptyStateTitle}>Aucun paiement</Text>
      <Text style={styles.emptyStateText}>
        {activeFilter === 'all' 
          ? "Vous n'avez effectué aucun paiement pour le moment."
          : activeFilter === 'completed'
          ? "Vous n'avez aucun paiement réussi."
          : activeFilter === 'failed'
          ? "Vous n'avez aucun paiement échoué."
          : "Vous n'avez aucun paiement en cours."}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Chargement...</Text>
      <Text style={styles.emptyStateText}>
        Récupération de l'historique des paiements
      </Text>
    </View>
  );

  // Filtres UI
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
        onPress={() => handleFilterChange('all')}
      >
        <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
          Tous
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, activeFilter === 'completed' && styles.activeFilterButton]}
        onPress={() => handleFilterChange('completed')}
      >
        <CheckCircle size={16} color={activeFilter === 'completed' ? Colors.white : Colors.success[500]} />
        <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
          Réussis
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, activeFilter === 'failed' && styles.activeFilterButton]}
        onPress={() => handleFilterChange('failed')}
      >
        <XCircle size={16} color={activeFilter === 'failed' ? Colors.white : Colors.error[500]} />
        <Text style={[styles.filterText, activeFilter === 'failed' && styles.activeFilterText]}>
          Échoués
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, activeFilter === 'pending' && styles.activeFilterButton]}
        onPress={() => handleFilterChange('pending')}
      >
        <Clock size={16} color={activeFilter === 'pending' ? Colors.white : Colors.warning[500]} />
        <Text style={[styles.filterText, activeFilter === 'pending' && styles.activeFilterText]}>
          En cours
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Historique des paiements</Text>
        
        <View style={styles.placeholder} />
      </View>

      {renderFilters()}

      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          (filteredPayments.length === 0 || isLoading) && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={isLoading ? renderLoadingState : renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    marginRight: Layout.spacing.s,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.gray[100],
    gap: Layout.spacing.xs,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  activeFilterText: {
    color: Colors.white,
  },
  listContent: {
    padding: Layout.spacing.m,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.m,
  },
  paymentInfo: {
    flex: 1,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
    gap: Layout.spacing.xs,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentDetails: {
    gap: Layout.spacing.s,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  paymentMethod: {
    fontSize: 14,
    color: Colors.gray[600],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.small,
  },
  subscriptionInfo: {
    backgroundColor: Colors.primary[50],
    padding: Layout.spacing.s,
    borderRadius: Layout.borderRadius.small,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  subscriptionPeriod: {
    fontSize: 14,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  transactionId: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'monospace',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.small,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.s,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
});