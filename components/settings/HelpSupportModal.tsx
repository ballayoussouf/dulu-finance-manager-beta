import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { 
  X, 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react-native';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function HelpSupportModal({ visible, onClose }: HelpSupportModalProps) {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support.dulufinance@gmail.om?subject=Support DULU Finance');
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+237693997244');
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/237693997244?text=Bonjour, j\'ai besoin d\'aide avec DULU Finance');
  };

  const handleUserGuide = () => {
    // Ouvrir le guide utilisateur
    console.log('Ouvrir le guide utilisateur');
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Envoyez-nous un email, nous répondons sous 24h',
      icon: <Mail size={24} color={Colors.primary[500]} />,
      action: handleEmailSupport,
      color: Colors.primary[500],
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Chat en direct avec notre équipe support',
      icon: <MessageCircle size={24} color={Colors.success[500]} />,
      action: handleWhatsAppSupport,
      color: Colors.success[500],
    },
    {
      id: 'phone',
      title: 'Téléphone',
      description: 'Appelez-nous du lundi au vendredi, 8h-18h',
      icon: <Phone size={24} color={Colors.warning[500]} />,
      action: handlePhoneSupport,
      color: Colors.warning[500],
    },
    {
      id: 'guide',
      title: 'Guide utilisateur',
      description: 'Consultez notre documentation complète',
      icon: <FileText size={24} color={Colors.gray[600]} />,
      action: handleUserGuide,
      color: Colors.gray[600],
    },
  ];

  const faqs: FAQ[] = [
    {
      question: "Comment ajouter une transaction ?",
      answer: "Vous pouvez ajouter une transaction en appuyant sur le bouton '+' dans l'onglet Historique ou en utilisant l'assistant DULU dans l'onglet Discussion."
    },
    {
      question: "Comment modifier mon abonnement ?",
      answer: "Rendez-vous dans Paramètres > Profil pour voir votre abonnement actuel et le modifier si nécessaire."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations personnelles avec des tiers."
    },
    {
      question: "Comment fonctionne l'assistant IA ?",
      answer: "L'assistant DULU utilise l'intelligence artificielle pour analyser vos finances et vous donner des conseils personnalisés. Posez-lui des questions sur vos dépenses, revenus ou objectifs."
    },
    {
      question: "Puis-je exporter mes données ?",
      answer: "Oui, vous pouvez exporter vos transactions en format CSV ou PDF depuis l'onglet Rapports."
    },
  ];

  const renderSupportOption = (option: SupportOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.supportOption}
      onPress={option.action}
    >
      <View style={[styles.supportIcon, { backgroundColor: `${option.color}20` }]}>
        {option.icon}
      </View>
      <View style={styles.supportContent}>
        <Text style={styles.supportTitle}>{option.title}</Text>
        <Text style={styles.supportDescription}>{option.description}</Text>
      </View>
      <ChevronRight size={20} color={Colors.gray[400]} />
    </TouchableOpacity>
  );

  const renderFAQ = (faq: FAQ, index: number) => (
    <View key={index} style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{faq.question}</Text>
      <Text style={styles.faqAnswer}>{faq.answer}</Text>
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
          
          <Text style={styles.title}>Aide & Support</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <View style={styles.introIcon}>
              <HelpCircle size={32} color={Colors.primary[500]} />
            </View>
            <Text style={styles.introTitle}>
              Comment pouvons-nous vous aider ?
            </Text>
            <Text style={styles.introDescription}>
              Notre équipe support est là pour vous accompagner dans l'utilisation de DULU Finance. 
              Choisissez le moyen de contact qui vous convient le mieux.
            </Text>
          </View>

          {/* Options de support */}
          <View style={styles.supportSection}>
            <Text style={styles.sectionTitle}>Contactez-nous</Text>
            {supportOptions.map(renderSupportOption)}
          </View>

          {/* FAQ */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Questions fréquentes</Text>
            {faqs.map(renderFAQ)}
          </View>

          {/* Informations de contact */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Informations de contact</Text>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Mail size={16} color={Colors.gray[600]} />
                <Text style={styles.contactText}>support.dulufinance@gmail.com</Text>
              </View>
              
              <View style={styles.contactItem}>
                <Phone size={16} color={Colors.gray[600]} />
                <Text style={styles.contactText}>+237 693 99 72 44 / 697 18 13 87</Text>
              </View>
              
              <View style={styles.contactItem}>
                <MessageCircle size={16} color={Colors.gray[600]} />
                <Text style={styles.contactText}>WhatsApp: +237 693 99 72 44</Text>
              </View>
            </View>

            <Text style={styles.hoursText}>
              Heures d'ouverture : Lundi - Vendredi, 8h00 - 18h00 (GMT+1)
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
  introDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Layout.spacing.m,
  },
  supportSection: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  supportDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  faqSection: {
    marginBottom: Layout.spacing.l,
  },
  faqItem: {
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
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  contactInfo: {
    marginBottom: Layout.spacing.m,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
    gap: Layout.spacing.s,
  },
  contactText: {
    fontSize: 14,
    color: Colors.primary[600],
  },
  hoursText: {
    fontSize: 12,
    color: Colors.primary[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});