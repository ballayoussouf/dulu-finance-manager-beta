import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { ArrowRight, Wallet, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePricing } from '@/hooks/usePricing';

export default function InitialBalanceScreen() {
  const { user } = useAuth();
  const { plan, needsPayment } = useLocalSearchParams();
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { proPrice } = usePricing();

  const handleBalanceChange = (text: string) => {
    // Accepter uniquement les chiffres
    const numericValue = text.replace(/[^0-9]/g, '');
    setBalance(numericValue);
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setIsLoading(true);
    try {
      // Ajouter le solde initial comme une transaction de revenu
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(balance) || 0,
            is_expense: false, // C'est un revenu
            category_id: 'a1d1237c-249b-49b4-aa11-34bcc14f3fb5', // ID de la catégorie "Solde de départ"
            description: 'Solde initial',
            transaction_date: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Afficher l'écran de succès
      setIsSuccess(true);
    } catch (error) {
      console.error('Error adding initial balance:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le solde initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (needsPayment === 'true') {
      // Rediriger vers la page de paiement si l'utilisateur a choisi le plan Pro
      router.push({
        pathname: '/payment', // Ceci est correct car payment est à la racine
        params: {
          planId: 'pro',
          amount: proPrice.toString(),
          planName: 'Pro',
          isExtension: 'false',
          isNewUser: 'true'
        }
      });
    } else {
      // Sinon, rediriger vers la page d'accueil
      router.replace('/(tabs)');
    }
  };

  // Écran de succès
  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color={Colors.success[500]} />
          </View>
          
          <Text style={styles.successTitle}>Configuration terminée !</Text>
          
          <Text style={styles.successMessage}>
            Votre solde initial de {parseInt(balance).toLocaleString()} FCFA a été enregistré avec succès.
            {needsPayment === 'true' 
              ? ' Vous allez maintenant être redirigé vers la page de paiement pour activer votre abonnement Pro.'
              : ' Vous pouvez maintenant commencer à utiliser DULU Finance.'}
          </Text>

          <Button
            title={needsPayment === 'true' ? "Procéder au paiement" : "Commencer à utiliser DULU"}
            onPress={handleFinish}
            style={styles.finishButton}
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Solde initial</Text>
          <Text style={styles.subtitle}>
            Entrez votre solde actuel pour commencer à suivre vos finances
          </Text>
        </View>

        <View style={styles.balanceContainer}>
          <View style={styles.walletIconContainer}>
            <Wallet size={48} color={Colors.primary[500]} />
          </View>
          
          <Text style={styles.balanceLabel}>Votre solde actuel (FCFA)</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.balanceInput}
              value={balance}
              onChangeText={handleBalanceChange}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors.gray[400]}
            />
          </View>
          
          <Text style={styles.balanceHint}>
            Ce montant sera enregistré comme votre solde de départ
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Pourquoi c'est important ?</Text>
          <Text style={styles.infoText}>
            Votre solde initial permet à DULU de calculer précisément votre situation financière actuelle et de suivre votre progression au fil du temps.
          </Text>
          <Text style={styles.infoText}>
            Vous pouvez entrer 0 si vous préférez commencer à zéro ou ne pas divulguer votre solde actuel.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleContinue}
          loading={isLoading}
          rightIcon={<ArrowRight size={20} color={Colors.white} />}
        />
        
        <View style={styles.stepsIndicator}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.activeStepDot]} />
        </View>
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
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    maxWidth: '80%',
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: Layout.spacing.xl,
  },
  walletIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  balanceInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary[300],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.l,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    textAlign: 'center',
  },
  balanceHint: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: Layout.spacing.s,
  },
  infoContainer: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.l,
    marginTop: Layout.spacing.l,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.s,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary[600],
    marginBottom: Layout.spacing.s,
    lineHeight: 20,
  },
  footer: {
    padding: Layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.l,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Layout.spacing.xs,
  },
  activeStepDot: {
    backgroundColor: Colors.primary[500],
    width: 24,
    borderRadius: 4,
  },
  // Styles pour l'écran de succès
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  successIcon: {
    marginBottom: Layout.spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.m,
  },
  finishButton: {
    width: '100%',
    marginTop: Layout.spacing.l,
  },
});