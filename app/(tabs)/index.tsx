import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import BalanceCard from '@/components/dashboard/BalanceCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { usePricing } from '@/hooks/usePricing';
import { Plus, Bell, ArrowUpRight, X, Calendar, Crown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { user } = useAuth();
  const { 
    transactions, 
    categories, 
    financialSummary, 
    isLoading, 
    lastUpdated,
    refreshData 
  } = useFinance();
  const [showNotification, setShowNotification] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<string>('free');
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isSubscriptionExpiring, setIsSubscriptionExpiring] = useState(false);
  const { proPrice } = usePricing();

  // Référence pour l'animation du fond de la cloche
  const bellBackgroundAnimation = useRef(new Animated.Value(0)).current;
  const bellAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useFocusRefresh({
    onRefresh: async () => {
      await refreshData();
      await checkSubscriptionStatus();
    },
    refreshInterval: 30000,
    enabled: true,
  });

  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_level, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data && data.subscription_level === 'pro' && data.subscription_end_date) {
        setSubscriptionEndDate(data.subscription_end_date);
        setSubscriptionType('pro');

        const endDate = new Date(data.subscription_end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDaysRemaining(diffDays); 

        // Vérifier si l'abonnement est expiré ou sur le point d'expirer
        if (diffDays < 0) { 
          setIsSubscriptionExpired(true);
          setIsSubscriptionExpiring(true);
          startBellAnimation();
        } else if (diffDays <= 5) {
          setIsSubscriptionExpiring(true);
          startBellAnimation();
        } else {
          setIsSubscriptionExpiring(false);
          setIsSubscriptionExpired(false);
          stopBellAnimation();
        }
      } else if (data) {
        setSubscriptionType(data.subscription_level || 'free');
        // Pour les utilisateurs avec subscription_level = "free", vérifier également la date d'expiration
        if (data.subscription_end_date) {
          setSubscriptionType('free');
          setSubscriptionEndDate(data.subscription_end_date);
          const endDate = new Date(data.subscription_end_date);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setDaysRemaining(diffDays);
          
          if (diffDays < 0) {
            setIsSubscriptionExpired(true);
            setIsSubscriptionExpiring(true);
            startBellAnimation();
          } else if (diffDays <= 5) {
            setIsSubscriptionExpiring(true);
            startBellAnimation();
          }
        }
      } else { 
        setSubscriptionType('free');
        setSubscriptionEndDate(null);
        setDaysRemaining(null);
        setIsSubscriptionExpiring(false);
        setIsSubscriptionExpired(false);
        stopBellAnimation();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'abonnement:', error);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
    return () => {
      stopBellAnimation();
    };
  }, [user]);

  // Animation du fond de la cloche
  const startBellAnimation = () => {
    stopBellAnimation();

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bellBackgroundAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(bellBackgroundAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    bellAnimationRef.current = animation;
    animation.start();
  };

  const stopBellAnimation = () => {
    if (bellAnimationRef.current) {
      bellAnimationRef.current.stop();
      bellAnimationRef.current = null;
    }
    bellBackgroundAnimation.setValue(0);
  };

  const handleAddTransaction = () => {
    router.push('/chat');
  };

  const handleViewAllTransactions = () => {
    router.push('/history');
  };

  const handleViewReports = () => {
    router.push('/reports');
  };

  const handleNotificationPress = () => {
    setShowNotification(!showNotification);
  };

  const handleExtendSubscription = () => {
    router.push({
      pathname: '/payment',
      params: subscriptionType === 'pro' 
        ? {
            planId: 'pro',
            amount: proPrice.toString(),
            planName: 'Pro',
            isExtension: 'true'
          }
        : {
            planId: 'pro',
            amount: proPrice.toString(),
            planName: 'Pro',
            isExtension: 'false'
          }
    });
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return 'Bonjour';
    if (hours >= 12 && hours < 17) return 'Bon après-midi';
    if (hours >= 17 && hours < 21) return 'Bonsoir';
    return 'Bonne nuit';
  };

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

  // Interpolation du fond du bouton
  const bellBackgroundColor = bellBackgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.white, Colors.error[500]],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{user?.name || 'Utilisateur'}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleNotificationPress}
            style={styles.notificationButton}
          >
            <Animated.View style={[styles.notificationButton, { backgroundColor: bellBackgroundColor }]}>
              <Bell 
                size={24} 
                color={isSubscriptionExpiring || isSubscriptionExpired ? Colors.error[500] : Colors.gray[700]} 
              />
              {(isSubscriptionExpiring || isSubscriptionExpired) && (
                <View style={styles.notificationBadge} />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown de notification */}
      {showNotification && (
        <View style={styles.notificationDropdown}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Notifications</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowNotification(false)}
            >
              <X size={20} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {(isSubscriptionExpiring || isSubscriptionExpired) ? (
            <View style={styles.expirationAlert}>
              <View style={styles.alertIconContainer}>
                <Crown size={20} color={Colors.error[500]} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {isSubscriptionExpired 
                    ? `Votre ${subscriptionType === 'pro' ? 'abonnement Pro' : 'période d\'essai'} a expiré !`
                    : `Votre ${subscriptionType === 'pro' ? 'abonnement Pro' : 'période d\'essai'} expire bientôt !`}
                </Text>
                <Text style={styles.alertMessage}>
                  {isSubscriptionExpired
                    ? `Votre ${subscriptionType === 'pro' ? 'abonnement Pro' : 'période d\'essai'} a pris fin${subscriptionEndDate ? ` le ${new Date(subscriptionEndDate).toLocaleDateString('fr-FR')}` : ''}.`
                    : `Votre ${subscriptionType === 'pro' ? 'abonnement Pro' : 'période d\'essai'} prendra fin${subscriptionEndDate ? ` le ${new Date(subscriptionEndDate).toLocaleDateString('fr-FR')}` : ''}${daysRemaining !== null && daysRemaining > 0 ? ` (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''})` : ''}.`}
                </Text>
                
                {subscriptionType === 'pro' ? (
                  <TouchableOpacity 
                    style={styles.extendButton}
                    onPress={handleExtendSubscription}
                  >
                    <Plus size={14} color={Colors.white} />
                    <Text style={styles.extendButtonText}>Étendre l'abonnement</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={handleExtendSubscription}
                  >
                    <Crown size={14} color={Colors.white} />
                    <Text style={styles.upgradeButtonText}>Mise à niveau</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noNotifications}>
              <Text style={styles.noNotificationsText}>
                Aucune notification pour le moment
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={async () => {
              await refreshData();
              await checkSubscriptionStatus();
            }}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        <BalanceCard financialSummary={financialSummary} />

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddTransaction}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Ajouter une transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.viewReportsButton}
            onPress={handleViewReports}
          >
            <ArrowUpRight size={20} color={Colors.primary[500]} />
            <Text style={styles.viewReportsText}>Voir les rapports</Text>
          </TouchableOpacity>
        </View>

        <RecentTransactions 
          transactions={transactions} 
          categories={categories}
          onViewAll={handleViewAllTransactions}
        />

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Astuce 💡</Text>
          <Text style={styles.tipText}>
            Essayez de demander à DULU "Quelles sont mes dépenses en alimentation ce mois-ci ?" dans la discussion pour obtenir des informations instantanées.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  headerContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.m,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    zIndex: 1000,
    elevation: 1000,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
    zIndex: 1001,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.m,
    paddingBottom: Layout.spacing.xl,
  },
  greeting: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  notificationContainer: {
    position: 'relative',
    zIndex: 1002,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1002,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error[500],
    borderWidth: 1,
    borderColor: Colors.white,
    zIndex: 1003,
  },
  notificationDropdown: {
    position: 'absolute',
    top: 70,
    right: Layout.spacing.m,
    width: 300,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  expirationAlert: {
    flexDirection: 'row',
    padding: Layout.spacing.m,
    backgroundColor: Colors.error[50],
    borderBottomLeftRadius: Layout.borderRadius.medium,
    borderBottomRightRadius: Layout.borderRadius.medium,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error[700],
    marginBottom: Layout.spacing.xs,
  },
  alertMessage: {
    fontSize: 12,
    color: Colors.error[600],
    marginBottom: Layout.spacing.m,
    lineHeight: 18,
  },
  daysRemaining: {
    fontWeight: '700',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    alignSelf: 'flex-start',
    gap: Layout.spacing.xs,
  },
  extendButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  noNotifications: {
    padding: Layout.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noNotificationsText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Layout.spacing.m,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    flex: 1,
    marginRight: Layout.spacing.s,
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Layout.spacing.s,
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    flex: 1,
    marginLeft: Layout.spacing.s,
    justifyContent: 'center',
  },
  viewReportsText: {
    color: Colors.primary[500],
    fontWeight: '600',
    marginLeft: Layout.spacing.s,
  },
  tipCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginTop: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.xs,
  },
  tipText: {
    fontSize: 14,
    color: Colors.primary[800],
    lineHeight: 20,
  },
});