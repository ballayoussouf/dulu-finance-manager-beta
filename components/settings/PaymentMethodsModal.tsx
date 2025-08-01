import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { X, CheckCircle, Smartphone, Shield } from 'lucide-react-native';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  logo: any;
  description: string;
  features: string[];
  color: string;
}

export default function PaymentMethodsModal({ visible, onClose }: PaymentMethodsModalProps) {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      logo: require('@/assets/images/orange-money.png'),
      description: 'Paiement sécurisé avec Orange Money',
      features: [
        'Paiement instantané',
        'Sécurisé et fiable',
        'Disponible 24h/24',
        'Confirmation par SMS'
      ],
      color: '#FF6600',
    },
    {
      id: 'mtn_money',
      name: 'MTN Mobile Money',
      logo: require('@/assets/images/mtn-momo.png'),
      description: 'Paiement sécurisé avec MTN Mobile Money',
      features: [
        'Paiement instantané',
        'Sécurisé et fiable',
        'Disponible 24h/24',
        'Confirmation par SMS'
      ],
      color: '#FFCC00',
    },
  ];

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <Image 
          source={method.logo} 
          style={styles.methodLogo}
          resizeMode="contain"
        />
        <View style={styles.methodInfo}>
          <Text style={styles.methodName}>{method.name}</Text>
          <Text style={styles.methodDescription}>{method.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${method.color}20` }]}>
          <CheckCircle size={16} color={method.color} />
          <Text style={[styles.statusText, { color: method.color }]}>
            Accepté
          </Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Avantages :</Text>
        {method.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle size={14} color={Colors.success[500]} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
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
          
          <Text style={styles.title}>Moyens de paiement</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <View style={styles.introIcon}>
              <Smartphone size={32} color={Colors.primary[500]} />
            </View>
            <Text style={styles.introTitle}>
              Paiements Mobile Money
            </Text>
            <Text style={styles.introDescription}>
              DULU accepte les paiements via les principales plateformes de Mobile Money au Cameroun. 
              Choisissez votre opérateur préféré pour effectuer vos paiements en toute sécurité.
            </Text>
          </View>

          {/* Méthodes de paiement */}
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Méthodes acceptées</Text>
            {paymentMethods.map(renderPaymentMethod)}
          </View>

          {/* Sécurité */}
          <View style={styles.securitySection}>
            <View style={styles.securityHeader}>
              <Shield size={24} color={Colors.success[500]} />
              <Text style={styles.securityTitle}>Paiements 100% sécurisés</Text>
            </View>
            
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <CheckCircle size={16} color={Colors.success[500]} />
                <Text style={styles.securityFeatureText}>
                  Chiffrement de niveau bancaire
                </Text>
              </View>
              
              <View style={styles.securityFeature}>
                <CheckCircle size={16} color={Colors.success[500]} />
                <Text style={styles.securityFeatureText}>
                  Aucune donnée bancaire stockée
                </Text>
              </View>
              
              <View style={styles.securityFeature}>
                <CheckCircle size={16} color={Colors.success[500]} />
                <Text style={styles.securityFeatureText}>
                  Conformité aux standards internationaux
                </Text>
              </View>
              
              <View style={styles.securityFeature}>
                <CheckCircle size={16} color={Colors.success[500]} />
                <Text style={styles.securityFeatureText}>
                  Partenaire certifié PawaPay
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Comment effectuer un paiement ?</Text>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Sélectionnez votre plan d'abonnement
                </Text>
              </View>
              
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Choisissez votre opérateur Mobile Money
                </Text>
              </View>
              
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Entrez votre numéro de téléphone
                </Text>
              </View>
              
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  Confirmez le paiement sur votre téléphone
                </Text>
              </View>
            </View>
          </View>

          {/* Support */}
          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Besoin d'aide ?</Text>
            <Text style={styles.supportText}>
              Si vous rencontrez des difficultés avec votre paiement, 
              notre équipe support est disponible pour vous aider.
            </Text>
            
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contacter le support</Text>
            </TouchableOpacity>
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
  methodsSection: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  methodCard: {
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
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  methodLogo: {
    width: 48,
    height: 48,
    marginRight: Layout.spacing.m,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.xs,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Layout.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: Layout.spacing.m,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.s,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
    gap: Layout.spacing.s,
  },
  featureText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  securitySection: {
    backgroundColor: Colors.success[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.l,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success[500],
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.s,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success[700],
  },
  securityFeatures: {
    gap: Layout.spacing.s,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  securityFeatureText: {
    fontSize: 14,
    color: Colors.success[600],
  },
  instructionsSection: {
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
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  instructionsList: {
    gap: Layout.spacing.m,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.m,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 14,
    color: Colors.primary[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Layout.spacing.l,
  },
  supportButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
  },
  supportButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});