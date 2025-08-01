import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { ArrowRight, Check, Crown, Calendar } from 'lucide-react-native';
import { usePricing } from '@/hooks/usePricing';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  color: string;
  popular?: boolean;
  trial?: boolean;
  trialDays?: number;
}

export default function PlanScreen() {
  const { phone } = useLocalSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>('trial');
  const { proPrice, isLoading: isPricingLoading } = usePricing();

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Essai',
      price: null,
      period: '14 jours',
      description: 'Essayez toutes les fonctionnalités gratuitement',
      color: Colors.gray[500],
      trial: true,
      trialDays: 14,
      features: [
        'Transactions illimitées',
        'Toutes les catégories',
        'Rapports de base',
        'Assistant IA limité',
        'Objectifs financiers',
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
        'Transactions illimitées',
        'Toutes les catégories',
        'Rapports avancés',
        'Assistant IA complet',
        'Objectifs financiers',
        'Budgets personnalisés',
        'Export des données',
        'Support prioritaire',
        'Analyses prédictives',
      ],
    },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleContinue = () => {
    // Si l'utilisateur a choisi le plan Pro, le rediriger directement vers la page de paiement
    if (selectedPlan === 'pro') {
      router.push({
        pathname: '/payment',
        params: {
          planId: 'pro',
          amount: proPrice.toString(),
          planName: 'Pro',
          isExtension: 'false',
          isNewUser: 'true'
        }
      });
    } else {
      // Pour le plan gratuit, continuer vers l'onboarding
      router.push({
        pathname: '/(onboarding)',
        params: {
          phone,
          plan: selectedPlan,
          needsPayment: 'false'
        }
      });
    }
  };

  const renderPlanCard = (plan: Plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.planCardSelected,
        plan.popular && styles.planCardPopular,
        isPricingLoading && styles.planCardLoading,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
      disabled={isPricingLoading}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Crown size={12} color={Colors.white} />
          <Text style={styles.popularBadgeText}>Recommandé</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.planPricing}>
          {plan.price ? (
            <>
              <Text style={styles.planPrice}>
                {isPricingLoading ? 'Chargement...' : `${plan.price.toLocaleString()} FCFA`}
              </Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </>
          ) : (
            <View style={styles.trialBadge}>
              <Calendar size={14} color={Colors.gray[700]} />
              <Text style={styles.trialText}>
                {plan.trialDays} jours gratuits
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.planFeatures}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Check size={12} color={Colors.success[600]} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo-dulu.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Choisissez votre offre</Text>
          <Text style={styles.subtitle}>
            Sélectionnez l'offre qui correspond le mieux à vos besoins
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Vous pouvez changer d'offre à tout moment depuis votre profil.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleContinue}
          rightIcon={<ArrowRight size={20} color={Colors.white} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[500],
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  plansContainer: {
    marginVertical: Layout.spacing.m,
  },
  planCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  planCardPopular: {
    borderColor: Colors.primary[300],
  },
  planCardLoading: {
    opacity: 0.7,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Layout.spacing.l,
    backgroundColor: Colors.primary[500],
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
    marginBottom: Layout.spacing.m,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Layout.spacing.s,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.gray[600],
    marginLeft: Layout.spacing.xs,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    alignSelf: 'flex-start',
    gap: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[700],
  },
  planDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.m,
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
    backgroundColor: Colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: Colors.gray[700],
    flex: 1,
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
  infoContainer: {
    marginTop: Layout.spacing.s,
    marginBottom: Layout.spacing.xl,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: Layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
});