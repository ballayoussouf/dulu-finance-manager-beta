import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { 
  X, 
  Heart, 
  Users, 
  Target, 
  Shield,
  ExternalLink,
  Mail,
  Globe
} from 'lucide-react-native';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TeamMember {
  name: string;
  photo?: any;
  role: string;
  description: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const handleWebsite = () => {
    Linking.openURL('https://flowbydulu.com');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support.dulufinance@gmail.com');
  };

  const teamMembers: TeamMember[] = [
    {
      name: "Gaston EFFA",
      photo: require('@/assets/images/gaston-effa.png'),
      role: "Directeur Marketing & Commercial",
      description: "Expert en stratégies marketing et développement commercial, Gaston dirige les initiatives de croissance et d'acquisition clients de DULU."
    },
    {
      name: "Issoufou BALLA",
      photo: require('@/assets/images/issoufou-balla.jpeg'),
      role: "Développeur Web & Ingenieur en Automatisation IA",
      description: "Spécialiste en développement web et intelligence artificielle, Issoufou est responsable de l'architecture technique et des fonctionnalités IA de DULU."
    }
  ];

  const features: Feature[] = [
    {
      icon: <Target size={24} color={Colors.primary[500]} />,
      title: "Gestion intelligente",
      description: "Suivez vos revenus, dépenses et objectifs financiers avec notre assistant IA"
    },
    {
      icon: <Shield size={24} color={Colors.success[500]} />,
      title: "Sécurité maximale",
      description: "Vos données sont protégées par un chiffrement de niveau bancaire"
    },
    {
      icon: <Users size={24} color={Colors.warning[500]} />,
      title: "Fait pour le Cameroun",
      description: "Conçu spécialement pour les besoins financiers des Camerounais"
    }
  ];

  const renderFeature = (feature: Feature, index: number) => (
    <View key={index} style={styles.featureCard}>
      <View style={styles.featureIcon}>
        {feature.icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  const renderTeamMember = (member: TeamMember, index: number) => (
    <View key={index} style={styles.teamCard}>
      <View style={styles.teamAvatar}>
        {member.photo ? (
          <Image 
            source={member.photo} 
            style={styles.memberPhoto}
            resizeMode="cover"
          />
        ) : (
          <Users size={32} color={Colors.primary[500]} />
        )}
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{member.name}</Text>
        <Text style={styles.teamRole}>{member.role}</Text>
        <Text style={styles.teamDescription}>{member.description}</Text>
      </View>
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
          
          <Text style={styles.title}>À propos de DULU</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Logo et introduction */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo-dulu.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>DULU Finance Manager</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.tagline}>
              Votre assistant financier personnel intelligent
            </Text>
          </View>

          {/* Mission */}
          <View style={styles.missionSection}>
            <View style={styles.missionIcon}>
              <Heart size={32} color={Colors.error[500]} />
            </View>
            <Text style={styles.missionTitle}>Notre Mission</Text>
            <Text style={styles.missionText}>
              DULU a pour mission de démocratiser la gestion financière personnelle au Cameroun. 
              Nous croyons que chaque Camerounais mérite d'avoir accès à des outils financiers 
              modernes et intelligents pour mieux gérer son argent et atteindre ses objectifs.
            </Text>
          </View>

          {/* Fonctionnalités */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Ce que nous offrons</Text>
            {features.map(renderFeature)}
          </View>

          {/* Histoire */}
          <View style={styles.storySection}>
            <Text style={styles.storyTitle}>Notre Histoire</Text>
            <Text style={styles.storyText}>
              DULU est né de la constatation que les Camerounais manquaient d'outils adaptés 
              pour gérer leurs finances personnelles. Créé par une équipe de développeurs 
              camerounais passionnés, DULU combine intelligence artificielle et design 
              intuitif pour offrir une expérience de gestion financière unique.
            </Text>
            <Text style={styles.storyText}>
              Le nom "DULU" vient du mot "dulù" en langue locale qui signifie "économiser" 
              ou "mettre de côté". C'est exactement ce que nous voulons vous aider à faire : 
              économiser intelligemment et construire votre avenir financier.
            </Text>
          </View>

          {/* Équipe */}
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>Notre Équipe</Text>
            {teamMembers.map(renderTeamMember)}
          </View>

          {/* Valeurs */}
          <View style={styles.valuesSection}>
            <Text style={styles.sectionTitle}>Nos Valeurs</Text>
            
            <View style={styles.valuesList}>
              <View style={styles.valueItem}>
                <Text style={styles.valueTitle}>🎯 Innovation</Text>
                <Text style={styles.valueDescription}>
                  Nous utilisons les dernières technologies pour créer des solutions financières innovantes
                </Text>
              </View>
              
              <View style={styles.valueItem}>
                <Text style={styles.valueTitle}>🔒 Sécurité</Text>
                <Text style={styles.valueDescription}>
                  La protection de vos données financières est notre priorité absolue
                </Text>
              </View>
              
              <View style={styles.valueItem}>
                <Text style={styles.valueTitle}>🤝 Accessibilité</Text>
                <Text style={styles.valueDescription}>
                  Nous rendons la gestion financière accessible à tous les Camerounais
                </Text>
              </View>
              
              <View style={styles.valueItem}>
                <Text style={styles.valueTitle}>💡 Éducation</Text>
                <Text style={styles.valueDescription}>
                  Nous vous accompagnons dans votre apprentissage financier
                </Text>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Restons en contact</Text>
            
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleWebsite}>
                <Globe size={20} color={Colors.primary[500]} />
                <Text style={styles.contactButtonText}>Site Web</Text>
                <ExternalLink size={16} color={Colors.gray[400]} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                <Mail size={20} color={Colors.primary[500]} />
                <Text style={styles.contactButtonText}>Nous contacter</Text>
                <ExternalLink size={16} color={Colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Copyright */}
          <View style={styles.copyrightSection}>
            <Text style={styles.copyrightText}>
              © 2025 DULU Finance Manager. Tous droits réservés.
            </Text>
            <Text style={styles.copyrightSubtext}>
              Fait avec ❤️ au Cameroun
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
  logoSection: {
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: 22,
    marginBottom: Layout.spacing.m,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[500],
    marginBottom: Layout.spacing.xs,
  },
  version: {
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: Layout.spacing.s,
  },
  tagline: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  missionSection: {
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
  },
  missionIcon: {
    marginBottom: Layout.spacing.m,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error[700],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 14,
    color: Colors.error[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  featureCard: {
    flexDirection: 'row',
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
  featureIcon: {
    marginRight: Layout.spacing.m,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  storySection: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  storyText: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: Layout.spacing.m,
  },
  teamSection: {
    marginBottom: Layout.spacing.l,
  },
  teamCard: {
    flexDirection: 'row',
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
  teamAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
    overflow: 'hidden',
  },
  memberPhoto: {
    width: '100%',
    height: '100%',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  teamRole: {
    fontSize: 14,
    color: Colors.primary[500],
    marginBottom: Layout.spacing.s,
  },
  teamDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  valuesSection: {
    marginBottom: Layout.spacing.l,
  },
  valuesList: {
    gap: Layout.spacing.m,
  },
  valueItem: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.s,
  },
  valueDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  contactSection: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.l,
    textAlign: 'center',
  },
  contactButtons: {
    width: '100%',
    gap: Layout.spacing.m,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    justifyContent: 'space-between',
  },
  contactButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
    marginLeft: Layout.spacing.s,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.l,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'center',
  },
});