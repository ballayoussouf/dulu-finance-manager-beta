import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { X, FileText, Shield, AlertTriangle } from 'lucide-react-native';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Section {
  title: string;
  content: string[];
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
  const lastUpdated = "15 janvier 2025";

  const sections: Section[] = [
    {
      title: "1. Acceptation des Conditions",
      content: [
        "En téléchargeant, installant ou utilisant l'application DULU Finance Manager (ci-après \"l'Application\"), vous acceptez d'être lié par ces Conditions Générales d'Utilisation (ci-après \"les Conditions\").",
        "Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser l'Application.",
        "Nous nous réservons le droit de modifier ces Conditions à tout moment. Les modifications prendront effet dès leur publication dans l'Application."
      ]
    },
    {
      title: "2. Description du Service",
      content: [
        "DULU Finance Manager est une application de gestion financière personnelle qui vous permet de :",
        "• Suivre vos revenus et dépenses",
        "• Définir et suivre des objectifs financiers",
        "• Analyser vos habitudes de dépenses",
        "• Recevoir des conseils financiers personnalisés via notre assistant IA",
        "• Exporter vos données financières",
        "L'Application est conçue pour un usage personnel et non commercial."
      ]
    },
    {
      title: "3. Compte Utilisateur",
      content: [
        "Pour utiliser l'Application, vous devez créer un compte en fournissant des informations exactes et complètes.",
        "Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.",
        "Vous devez nous notifier immédiatement de toute utilisation non autorisée de votre compte.",
        "Vous devez avoir au moins 12 ans pour utiliser l'Application ou avoir l'autorisation d'un parent ou tuteur légal."
      ]
    },
    {
      title: "4. Utilisation Acceptable",
      content: [
        "Vous vous engagez à utiliser l'Application uniquement à des fins légales et conformément à ces Conditions.",
        "Il est interdit de :",
        "• Utiliser l'Application pour des activités illégales ou frauduleuses",
        "• Tenter de contourner les mesures de sécurité de l'Application",
        "• Partager vos identifiants de connexion avec des tiers",
        "• Utiliser l'Application pour harceler, menacer ou nuire à autrui",
        "• Télécharger ou transmettre des virus ou codes malveillants"
      ]
    },
    {
      title: "5. Données et Confidentialité",
      content: [
        "Nous collectons et traitons vos données personnelles conformément à notre Politique de Confidentialité.",
        "Vos données financières sont chiffrées et stockées de manière sécurisée.",
        "Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.",
        "Vous conservez la propriété de vos données et pouvez demander leur suppression à tout moment.",
        "Nous utilisons vos données pour améliorer nos services et vous fournir des conseils personnalisés."
      ]
    },
    {
      title: "6. Paiements et Abonnements",
      content: [
        "L'Application propose des fonctionnalités gratuites et des abonnements payants.",
        "Les paiements sont traités via des plateformes de Mobile Money sécurisées (Orange Money, MTN Mobile Money).",
        "Vous pouvez annuler votre abonnement à tout moment dans les paramètres de l'Application.",
        "Aucun remboursement n'est accordé pour les périodes d'abonnement déjà entamées, sauf disposition légale contraire."
      ]
    },
    {
      title: "7. Propriété Intellectuelle",
      content: [
        "L'Application et tout son contenu (textes, graphiques, logos, icônes, images, clips audio, téléchargements numériques, compilations de données et logiciels) sont la propriété de DULU ou de ses concédants de licence.",
        "Vous recevez une licence limitée, non exclusive et non transférable pour utiliser l'Application à des fins personnelles.",
        "Il est interdit de reproduire, distribuer, modifier ou créer des œuvres dérivées de l'Application sans autorisation écrite."
      ]
    },
    {
      title: "8. Limitation de Responsabilité",
      content: [
        "L'Application est fournie \"en l'état\" sans garantie d'aucune sorte.",
        "Nous ne garantissons pas que l'Application sera exempte d'erreurs ou disponible en permanence.",
        "Nous ne sommes pas responsables des décisions financières que vous prenez sur la base des informations fournies par l'Application.",
        "Notre responsabilité totale envers vous ne dépassera pas le montant que vous avez payé pour l'Application au cours des 12 derniers mois.",
        "Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs."
      ]
    },
    {
      title: "9. Suspension et Résiliation",
      content: [
        "Nous nous réservons le droit de suspendre ou de résilier votre accès à l'Application à tout moment, avec ou sans préavis, si vous violez ces Conditions.",
        "Vous pouvez résilier votre compte à tout moment en nous contactant ou en utilisant les fonctionnalités de l'Application.",
        "En cas de résiliation, vos données seront supprimées conformément à notre Politique de Confidentialité.",
        "Les dispositions qui, par leur nature, doivent survivre à la résiliation, continueront de s'appliquer."
      ]
    },
    {
      title: "10. Droit Applicable",
      content: [
        "Ces Conditions sont régies par les lois de la République du Cameroun.",
        "Tout litige découlant de ces Conditions sera soumis à la juridiction exclusive des tribunaux de Douala, Cameroun.",
        "Si une disposition de ces Conditions est jugée invalide ou inapplicable, les autres dispositions resteront en vigueur."
      ]
    },
    {
      title: "11. Contact",
      content: [
        "Pour toute question concernant ces Conditions Générales, vous pouvez nous contacter :",
        "• Email : support.dulufinance@gmail.com",
        "• Téléphone : +237 693 99 72 44 / 697 18 13 87",
        "• Adresse : Douala, Cameroun",
        "Nous nous efforcerons de répondre à vos questions dans les plus brefs délais."
      ]
    }
  ];

  const renderSection = (section: Section, index: number) => (
    <View key={index} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.content.map((paragraph, pIndex) => (
        <Text key={pIndex} style={styles.sectionContent}>
          {paragraph}
        </Text>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Conditions Générales</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <View style={styles.introIcon}>
              <FileText size={32} color={Colors.primary[500]} />
            </View>
            <Text style={styles.introTitle}>
              Conditions Générales d'Utilisation
            </Text>
            <Text style={styles.lastUpdated}>
              Dernière mise à jour : {lastUpdated}
            </Text>
            <Text style={styles.introDescription}>
              Ces conditions générales régissent votre utilisation de l'application DULU Finance Manager. 
              Veuillez les lire attentivement avant d'utiliser nos services.
            </Text>
          </View>

          {/* Avertissement important */}
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={20} color={Colors.warning[600]} />
              <Text style={styles.warningTitle}>Important</Text>
            </View>
            <Text style={styles.warningText}>
              En utilisant DULU Finance Manager, vous acceptez ces conditions dans leur intégralité. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
            </Text>
          </View>

          {/* Sections des conditions */}
          <View style={styles.sectionsContainer}>
            {sections.map(renderSection)}
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <View style={styles.footerIcon}>
              <Shield size={24} color={Colors.success[500]} />
            </View>
            <Text style={styles.footerTitle}>Vos droits sont protégés</Text>
            <Text style={styles.footerText}>
              Ces conditions sont conçues pour protéger à la fois vos droits et les nôtres. 
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: Platform.OS === 'ios' ? Layout.spacing.xl : Layout.spacing.l,
    paddingBottom: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.l,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    marginVertical: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Layout.spacing.m,
  },
  warningSection: {
    backgroundColor: Colors.warning[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[500],
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
    gap: Layout.spacing.s,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning[700],
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning[600],
    lineHeight: 20,
  },
  sectionsContainer: {
    marginBottom: Layout.spacing.l,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  sectionContent: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: Layout.spacing.s,
  },
  footerSection: {
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  footerIcon: {
    marginBottom: Layout.spacing.m,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success[700],
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.success[600],
    textAlign: 'center',
    lineHeight: 20,
  },
});