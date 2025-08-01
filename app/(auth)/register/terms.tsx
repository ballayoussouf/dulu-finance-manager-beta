import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import { ArrowRight, Check, FileText } from 'lucide-react-native';

export default function TermsScreen() {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(!accepted);
  };

  const handleContinue = () => {
    if (accepted) {
      router.push('/register');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo-dulu.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Conditions Générales</Text>
        <Text style={styles.subtitle}>
          Veuillez lire et accepter nos conditions générales pour continuer
        </Text>
      </View>

      <View style={styles.termsContainer}>
        <View style={styles.termsHeader}>
          <FileText size={24} color={Colors.primary[500]} />
          <Text style={styles.termsTitle}>Conditions Générales d'Utilisation</Text>
        </View>

        <ScrollView style={styles.termsContent}>
          <Text style={styles.termsSection}>1. Acceptation des Conditions</Text>
          <Text style={styles.termsParagraph}>
            En téléchargeant, installant ou utilisant l'application DULU Finance Manager (ci-après "l'Application"), vous acceptez d'être lié par ces Conditions Générales d'Utilisation (ci-après "les Conditions").
          </Text>
          <Text style={styles.termsParagraph}>
            Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser l'Application.
          </Text>

          <Text style={styles.termsSection}>2. Description du Service</Text>
          <Text style={styles.termsParagraph}>
            DULU Finance Manager est une application de gestion financière personnelle qui vous permet de :
          </Text>
          <Text style={styles.termsList}>• Suivre vos revenus et dépenses</Text>
          <Text style={styles.termsList}>• Définir et suivre des objectifs financiers</Text>
          <Text style={styles.termsList}>• Analyser vos habitudes de dépenses</Text>
          <Text style={styles.termsList}>• Recevoir des conseils financiers personnalisés via notre assistant IA</Text>
          <Text style={styles.termsParagraph}>
            L'Application est conçue pour un usage personnel et non commercial.
          </Text>

          <Text style={styles.termsSection}>3. Compte Utilisateur</Text>
          <Text style={styles.termsParagraph}>
            Pour utiliser l'Application, vous devez créer un compte en fournissant des informations exactes et complètes.
          </Text>
          <Text style={styles.termsParagraph}>
            Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.
          </Text>
          <Text style={styles.termsParagraph}>
            Vous devez avoir au moins 12 ans pour utiliser l'Application ou avoir l'autorisation d'un parent ou tuteur légal.
          </Text>

          <Text style={styles.termsSection}>4. Données et Confidentialité</Text>
          <Text style={styles.termsParagraph}>
            Nous collectons et traitons vos données personnelles conformément à notre Politique de Confidentialité.
          </Text>
          <Text style={styles.termsParagraph}>
            Vos données financières sont chiffrées et stockées de manière sécurisée.
          </Text>
          <Text style={styles.termsParagraph}>
            Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.
          </Text>

          <Text style={styles.termsSection}>5. Paiements et Abonnements</Text>
          <Text style={styles.termsParagraph}>
            L'Application propose des fonctionnalités gratuites et des abonnements payants.
          </Text>
          <Text style={styles.termsParagraph}>
            Les paiements sont traités via des plateformes de Mobile Money sécurisées (Orange Money, MTN Mobile Money).
          </Text>
          

          <Text style={styles.termsSection}>6. Limitation de Responsabilité</Text>
          <Text style={styles.termsParagraph}>
            L'Application est fournie "en l'état" sans garantie d'aucune sorte.
          </Text>
          <Text style={styles.termsParagraph}>
            Nous ne garantissons pas que l'Application sera exempte d'erreurs ou disponible en permanence.
          </Text>
          <Text style={styles.termsParagraph}>
            Nous ne sommes pas responsables des décisions financières que vous prenez sur la base des informations fournies par l'Application.
          </Text>
        </ScrollView>
      </View>

      <View style={styles.acceptContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleAccept}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Check size={16} color={Colors.white} />}
          </View>
          <Text style={styles.acceptText}>
            J'ai lu et j'accepte les conditions générales d'utilisation
          </Text>
        </TouchableOpacity>

        <Button
          title="Continuer"
          onPress={handleContinue}
          disabled={!accepted}
          rightIcon={<ArrowRight size={20} color={Colors.white} />}
          style={styles.continueButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 22,
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
  termsContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    marginVertical: Layout.spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    gap: Layout.spacing.s,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  termsContent: {
    padding: Layout.spacing.m,
  },
  termsSection: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.s,
  },
  termsParagraph: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
    lineHeight: 20,
  },
  termsList: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: Layout.spacing.m,
    marginBottom: Layout.spacing.xs,
    lineHeight: 20,
  },
  acceptContainer: {
    marginTop: Layout.spacing.m,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    marginRight: Layout.spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[500],
  },
  acceptText: {
    fontSize: 14,
    color: Colors.gray[700],
    flex: 1,
  },
  continueButton: {
    marginTop: Layout.spacing.s,
  },
});