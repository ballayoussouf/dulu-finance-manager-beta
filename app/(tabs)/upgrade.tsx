import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePricing } from '@/hooks/usePricing';
import { ArrowLeft, Crown, Check, Smartphone, Shield, Zap, Star, Users, ChartBar as BarChart3, Calendar, Plus } from 'lucide-react-native';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  color: string;
}

interface UserSubscription {
  subscription_level: string;
  subscription_end_date: string | null;
}

export default function UpgradeScreen() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const { proPrice, isLoading: isPricingLoading } = usePricing();

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_level, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Essai',
      price: 0,
      period: 'Gratuit',
      description: 'Parfait pour commencer',
      color: Colors.gray[500],
      features: [
        { text: 'Jusqu\'à 50 transactions/mois', included: true },
        { text: 'Catégories de base', included: true },
        { text: 'Rapports simples', included: true },
        { text: 'Assistant IA limité', included: true },
        { text: 'Objectifs financiers', included: false },
        { text: 'Rapports avancés', included: false },
        { text: 'Export des données', included: false },
        { text: 'Support prioritaire', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: proPrice,
      period: '/mois',
      description: 'Pour une gestion complète',
      color: Colors.primary[500],
      popular: true,
      features: [
        { text: 'Transactions illimitées', included: true },
        { text: 'Toutes les catégories', included: true },
        { text: 'Rapports avancés', included: true },
        { text: 'Assistant IA complet', included: true },
        { text: 'Objectifs financiers', included: true },
        { text: 'Budgets personnalisés', included: true },
        { text: 'Export des données', included: true },
        { text: 'Support prioritaire', included: true },
        { text: 'Analyses prédictives', included: true },
        { text: 'Conseils personnalisés', included: true },
        { text: 'Intégrations bancaires', included: true },
        { text: 'Support 24/7', included: true },
      ],
    },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Déterminer le statut de l'utilisateur
  const isTrialUser = userSubscription?.subscription_level === 'free' || !userSubscription?.subscription_level;
  const isProUser = userSubscription?.subscription_level === 'pro';

  // Calculer les jours restants pour les utilisateurs Pro
  const getDaysRemaining = () => {
    if (!userSubscription?.subscription_end_date) return 0;
    
    const endDate = new Date(userSubscription.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  const handlePayment = async () => {
    if (selectedPlan === 'free') {
      Alert.alert('Information', 'Vous utilisez déjà le plan gratuit.');
      return;
    }

    setIsLoading(true);
    try {
      // Rediriger vers la page de paiement
      router.push({
        pathname: '/payment',
        params: {
          planId: selectedPlan,
          amount: proPrice.toString(),
          planName: selectedPlanData?.name || '',
          isExtension: isProUser ? 'true' : 'false', // Nouveau paramètre pour indiquer si c'est une extension
        }
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de procéder au paiement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanCard = (plan: Plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.planCardSelected,
        plan.popular && styles.planCardPopular,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Star size={12} color={Colors.white} />
          <Text style={styles.popularBadgeText}>Populaire</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Crown size={24} color={plan.color} />
        <Text style={styles.planName}>{plan.name}</Text>
      </View>

      <View style={styles.planPricing}>
        <Text style={styles.planPrice}>
          {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} FCFA`}
        </Text>
        {plan.price > 0 && (
          <Text style={styles.planPeriod}>{plan.period}</Text>
        )}
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.planFeatures}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={[
              styles.featureIcon,
              { backgroundColor: feature.included ? Colors.success[100] : Colors.gray[100] }
            ]}>
              <Check 
                size={12} 
                color={feature.included ? Colors.success[600] : Colors.gray[400]} 
              />
            </View>
            <Text style={[
              styles.featureText,
              !feature.included && styles.featureTextDisabled
            ]}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      {selectedPlan === plan.id && (
        <View style={styles.selectedIndicator}>
          <Check size={16} color={Colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Affichage de chargement
  if (loadingSubscription || isPricingLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {isProUser ? 'Étendre l\'abonnement' : 'Mise à niveau'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut actuel pour les utilisateurs Pro */}
        {isProUser && (
          <View style={styles.currentStatusSection}>
            <View style={styles.statusIcon}>
              <Crown size={32} color={Colors.primary[500]} />
            </View>
            <Text style={styles.statusTitle}>Abonnement Pro Actif</Text>
            <Text style={styles.statusDescription}>
              Votre abonnement expire dans <Text style={styles.daysHighlight}>{daysRemaining} jour(s)</Text>
            </Text>
            <View style={styles.statusDetails}>
              <View style={styles.statusDetailRow}>
                <Calendar size={16} color={Colors.primary[500]} />
                <Text style={styles.statusDetailText}>
                  Expire le {userSubscription?.subscription_end_date ? 
                    new Date(userSubscription.subscription_end_date).toLocaleDateString('fr-FR') : 
                    'Non défini'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Crown size={48} color={Colors.primary[500]} />
          <Text style={styles.heroTitle}>
            {isProUser ? 
              'Prolongez votre expérience Pro' : 
              'Débloquez tout le potentiel de DULU'
            }
          </Text>
          <Text style={styles.heroSubtitle}>
            {isProUser ? 
              'Ajoutez un mois supplémentaire à votre abonnement Pro pour continuer à profiter de toutes les fonctionnalités avancées.' :
              'Accédez à des fonctionnalités avancées pour une gestion financière optimale'
            }
          </Text>
        </View>

        {/* Avantages */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>
            {isProUser ? 'Continuez à profiter de' : 'Pourquoi passer au premium ?'}
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <BarChart3 size={20} color={Colors.primary[500]} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Analyses avancées</Text>
                <Text style={styles.benefitDescription}>
                  Rapports détaillés et prédictions pour optimiser vos finances
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Zap size={20} color={Colors.warning[500]} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Assistant IA complet</Text>
                <Text style={styles.benefitDescription}>
                  Conseils personnalisés et réponses illimitées
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Shield size={20} color={Colors.success[500]} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Sécurité renforcée</Text>
                <Text style={styles.benefitDescription}>
                  Sauvegarde automatique et protection des données
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Users size={20} color={Colors.primary[500]} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Support prioritaire</Text>
                <Text style={styles.benefitDescription}>
                  Assistance rapide et dédiée 24/7
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Plans - Afficher seulement le plan Pro pour les utilisateurs Pro */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>
            {isProUser ? 'Étendre votre abonnement' : 'Choisissez votre plan'}
          </Text>
          
          <View style={styles.plansList}>
            {isProUser ? 
              renderPlanCard(plans.find(p => p.id === 'pro')!) :
              plans.map(renderPlanCard)
            }
          </View>

          {/* Information spéciale pour l'extension */}
          {isProUser && (
            <View style={styles.extensionInfo}>
              <View style={styles.extensionIcon}>
                <Plus size={20} color={Colors.primary[500]} />
              </View>
              <Text style={styles.extensionText}>
                En payant maintenant, vous ajoutez <Text style={styles.extensionHighlight}>1 mois supplémentaire</Text> à 
                votre abonnement actuel. Votre nouvelle date d'expiration sera le{' '}
                <Text style={styles.extensionHighlight}>
                  {userSubscription?.subscription_end_date ? 
                    (() => {
                      const currentEnd = new Date(userSubscription.subscription_end_date);
                      const newEnd = new Date(currentEnd);
                      newEnd.setMonth(newEnd.getMonth() + 1);
                      return newEnd.toLocaleDateString('fr-FR');
                    })() : 
                    'Non défini'
                  }
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Méthodes de paiement */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Paiement sécurisé</Text>
          
          <View style={styles.paymentMethods}>
            <View style={styles.paymentMethod}>
              <Smartphone size={24} color={Colors.primary[500]} />
              <Text style={styles.paymentMethodText}>Mobile Money</Text>
            </View>
            <Text style={styles.paymentDescription}>
              Payez facilement avec Orange Money, MTN Money, ou Moov Money
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer avec bouton de paiement */}
      <View style={styles.footer}>
        {selectedPlanData && selectedPlan !== 'free' && (
          <View style={styles.footerSummary}>
            <Text style={styles.footerPlan}>
              {isProUser ? 'Extension Pro' : `Plan ${selectedPlanData.name}`}
            </Text>
            <Text style={styles.footerPrice}>
              {proPrice.toLocaleString()} FCFA
              {isProUser && <Text style={styles.footerPeriod}> (+1 mois)</Text>}
            </Text>
          </View>
        )}
        
        <Button
          title={
            selectedPlan === 'free' ? 'Plan actuel' : 
            isProUser ? 'Étendre l\'abonnement' : 
            'Procéder au paiement'
          }
          onPress={handlePayment}
          loading={isLoading}
          disabled={selectedPlan === 'free'}
          style={styles.paymentButton}
          leftIcon={
            selectedPlan !== 'free' ? 
              isProUser ? 
                <Plus size={20} color={Colors.white} /> : 
                <Crown size={20} color={Colors.white} /> : 
              undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[600],
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
  content: {
    flex: 1,
  },
  // Section pour le statut actuel (utilisateurs Pro)
  currentStatusSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.l,
    paddingHorizontal: Layout.spacing.l,
    backgroundColor: Colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.xs,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.primary[600],
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  daysHighlight: {
    fontWeight: '700',
    color: Colors.primary[800],
  },
  statusDetails: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    width: '100%',
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  statusDetailText: {
    fontSize: 14,
    color: Colors.gray[700],
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.l,
    backgroundColor: Colors.white,
    marginBottom: Layout.spacing.m,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    textAlign: 'center',
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.s,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.l,
  },
  benefitsList: {
    gap: Layout.spacing.l,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  plansSection: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  plansList: {
    gap: Layout.spacing.m,
  },
  planCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  planCardPopular: {
    borderColor: Colors.warning[500],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: Layout.spacing.l,
    backgroundColor: Colors.warning[500],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Layout.spacing.xs,
  },
  popularBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.s,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Layout.spacing.s,
    gap: Layout.spacing.xs,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  planDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.l,
  },
  planFeatures: {
    gap: Layout.spacing.s,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: Colors.gray[700],
    flex: 1,
  },
  featureTextDisabled: {
    color: Colors.gray[400],
  },
  selectedIndicator: {
    position: 'absolute',
    top: Layout.spacing.m,
    right: Layout.spacing.m,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Section d'information sur l'extension
  extensionInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginTop: Layout.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    alignItems: 'center',
  },
  extensionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  extensionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary[700],
    lineHeight: 20,
  },
  extensionHighlight: {
    fontWeight: '700',
    color: Colors.primary[800],
  },
  paymentSection: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  paymentMethods: {
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.s,
    marginBottom: Layout.spacing.s,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
  },
  paymentDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  footerPlan: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  footerPeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary[700],
  },
  paymentButton: {
    paddingVertical: Layout.spacing.m,
  },
});