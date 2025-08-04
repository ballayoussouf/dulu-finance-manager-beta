import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { CheckCircle, Crown, Home } from 'lucide-react-native';

export default function PaymentSuccessScreen() {
  const { planName, amount, transactionId, isExtension, isNewUser } = useLocalSearchParams();
  const isExtendingSubscription = isExtension === 'true';
  const isNewUserRegistration = isNewUser === 'true';
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoHome = () => {
    // Si c'est une extension, retourner aux tabs, sinon continuer l'onboarding
    if (isExtendingSubscription) {
      router.replace('/(tabs)');
    } else if (isNewUserRegistration) {
      // Pour un nouvel utilisateur, aller directement aux tabs après le paiement
      router.replace('/(onboarding)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.successIcon,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <CheckCircle size={80} color={Colors.success[500]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: opacityAnim,
              transform: [
                {
                  translateY: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Paiement réussi !</Text>
          
          <Text style={styles.description}>
            {isExtendingSubscription 
              ? 'Félicitations ! Votre abonnement Pro a été prolongé avec succès.'
              : 'Félicitations ! Votre abonnement au plan Pro a été activé avec succès.'}
          </Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {isExtendingSubscription ? 'Abonnement prolongé' : 'Plan activé'}
              </Text>
              <View style={styles.planBadge}>
                <Crown size={16} color={Colors.primary[500]} />
                <Text style={styles.planName}>{planName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Montant payé</Text>
              <Text style={styles.detailValue}>
                {parseFloat(amount as string).toLocaleString()} FCFA
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Transaction</Text>
              <Text style={styles.transactionId}>{transactionId}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {isExtendingSubscription ? 'Date de prolongation' : 'Date d\'activation'}
              </Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>
              {isExtendingSubscription 
                ? 'Vous continuez à profiter de :' 
                : 'Vous avez maintenant accès à :'}
            </Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>✨ Transactions illimitées</Text>
              <Text style={styles.benefitItem}>📊 Rapports avancés</Text>
              <Text style={styles.benefitItem}>🤖 Assistant IA complet</Text>
              <Text style={styles.benefitItem}>🎯 Objectifs personnalisés</Text>
              <Text style={styles.benefitItem}>📱 Support prioritaire</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Retour à l'accueil"
          onPress={handleGoHome}
          style={styles.homeButton}
          leftIcon={<Home size={20} color={Colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  successIcon: {
    marginBottom: Layout.spacing.xl,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.xl,
  },
  detailsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    width: '100%',
    marginBottom: Layout.spacing.l,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.s,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Layout.spacing.xs,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[700],
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.gray[600],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.small,
  },
  benefitsCard: {
    backgroundColor: Colors.success[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success[700],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  benefitsList: {
    gap: Layout.spacing.s,
  },
  benefitItem: {
    fontSize: 14,
    color: Colors.success[600],
    lineHeight: 20,
  },
  footer: {
    padding: Layout.spacing.l,
  },
  homeButton: {
    paddingVertical: Layout.spacing.m,
  },
});