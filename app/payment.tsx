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
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Smartphone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Phone
} from 'lucide-react-native';
import { 
  validateCameroonPhoneNumber, 
  formatCameroonPhoneNumber,
  getCorrespondentFromPhoneNumber,
  CAMEROON_CORRESPONDENTS,
  formatAmount
} from '@/lib/pawapay';
import { supabase } from '@/lib/supabase';

interface PaymentProvider {
  id: string;
  name: string;
  logo: any;
  color: string;
  correspondent: string;
}

interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'failed';
  message: string;
  transactionId?: string;
  depositId?: string;
}

export default function PaymentScreen() {
  const { user } = useAuth();
  const { planId, amount, planName, isExtension, isNewUser } = useLocalSearchParams();
  const isExtendingSubscription = isExtension === 'true';
  const isNewUserRegistration = isNewUser === 'true';
  
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('+237');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [errors, setErrors] = useState<{ phone?: string }>({});

  // Providers Mobile Money disponibles avec les nouveaux logos
  const providers: PaymentProvider[] = [
    {
      id: 'orange_cmr',
      name: 'Orange Money',
      logo: require('@/assets/images/orange-money.png'),
      color: '#FF6600',
      correspondent: 'ORANGE_CMR',
    },
    {
      id: 'mtn_cmr',
      name: 'MTN Money',
      logo: require('@/assets/images/mtn-momo.png'),
      color: '#FFCC00',
      correspondent: 'MTN_MOMO_CMR',
    },
  ];

  useEffect(() => {
    // Pré-sélectionner Orange Money par défaut
    if (providers.length > 0) {
      setSelectedProvider(providers[0].id);
    }
    
    // Pré-remplir le numéro de téléphone de l'utilisateur s'il existe
    if (user?.phone) {
      setPhoneNumber(user.phone);
      
      // Auto-détecter l'opérateur si le numéro est complet
      try {
        const correspondent = getCorrespondentFromPhoneNumber(user.phone);
        const provider = providers.find(p => p.correspondent === correspondent);
        if (provider) {
          setSelectedProvider(provider.id);
        }
      } catch (error) {
        // Ignorer les erreurs de détection automatique
      }
    }
  }, [user]);

  const handlePhoneNumberChange = (text: string) => {
    if (text.length <= 13) {
      const formatted = text.startsWith('+237') ? text : '+237';
      setPhoneNumber(formatted);
      setErrors(prev => ({ ...prev, phone: undefined }));
      
      // Auto-détecter l'opérateur si le numéro est complet
      if (formatted.length === 13) {
        try {
          const correspondent = getCorrespondentFromPhoneNumber(formatted);
          const provider = providers.find(p => p.correspondent === correspondent);
          if (provider) {
            setSelectedProvider(provider.id);
          }
        } catch (error) {
          // Ignorer les erreurs de détection automatique
        }
      }
    }
  };

  const handlePayment = async () => {
    // Validation
    if (!validateCameroonPhoneNumber(phoneNumber)) {
      setErrors({ phone: 'Numéro de téléphone invalide (format: +237xxxxxxxxx)' });
      return;
    }

    if (!selectedProvider) {
      Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
      return;
    }

    const selectedProviderData = providers.find(p => p.id === selectedProvider);
    if (!selectedProviderData) {
      Alert.alert('Erreur', 'Opérateur sélectionné invalide');
      return;
    }

    setIsLoading(true);
    setPaymentStatus({ status: 'pending', message: 'Initialisation du paiement...' });

    try {
      // Formater le numéro de téléphone
      const formattedPhone = formatCameroonPhoneNumber(phoneNumber);
      
      setPaymentStatus({ status: 'processing', message: 'Envoi de la demande de paiement...' });

      // Check if Supabase client is properly configured
      if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables.');
      }

      console.log('Calling Supabase Edge Function with data:', {
        amount: parseFloat(amount as string),
        phoneNumber: formattedPhone,
        correspondent: selectedProviderData.correspondent,
        planId: planId,
        userId: user?.id,
        description: `DULU ${planName}${isExtendingSubscription ? ' (Extension)' : ''}`,
        isExtension: isExtendingSubscription
      });

      // Call Supabase Edge Function with better error handling
      const { data: responseData, error } = await supabase.functions.invoke('payment', {
        body: {
          amount: parseFloat(amount as string),
          phoneNumber: formattedPhone,
          correspondent: selectedProviderData.correspondent,
          planId: planId,
          userId: user?.id,
          description: `DULU ${planName}${isExtendingSubscription ? ' (Extension)' : ''}`,
          isExtension: isExtendingSubscription
        },
      });

      console.log('Supabase function response:', { data: responseData, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to send a request to the Edge Function: ${error.message}`);
      }

      if (!responseData) {
        throw new Error('No response data received from the Edge Function');
      }

      console.log('Deposit initiated:', responseData);

      if (responseData.status === 'ACCEPTED') {
        setPaymentStatus({
          status: 'processing',
          message: 'Paiement en cours de traitement. Veuillez confirmer sur votre téléphone.',
          depositId: responseData.depositId,
        });

        // Démarrer la vérification du statut
        startStatusPolling(responseData.depositId);
      } else {
        throw new Error(responseData.message || 'Paiement rejeté');
      }

    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Une erreur est survenue lors du paiement.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.';
        } else if (error.message.includes('Edge Function')) {
          errorMessage = 'Erreur de configuration du service de paiement. Veuillez contacter le support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setPaymentStatus({
        status: 'failed',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (depositId: string) => {
    console.log('🔄 Starting status polling for deposit:', depositId);
    
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes maximum (60 * 5 secondes)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`📊 Poll attempt ${pollCount}/${maxPolls} for deposit:`, depositId);
      
      try {
        // Call Supabase Edge Function to check status
        const { data: statusResponse, error } = await supabase.functions.invoke('payment-status', {
          body: { depositId },
        });
        
        console.log('📈 Status response:', { data: statusResponse, error, pollCount });
        
        if (error) {
          console.error('❌ Status polling error:', error);
          // Continue polling even on error, but log it
          return;
        }

        // Vérifier si la réponse contient les données attendues
        if (!statusResponse) {
          console.log('⚠️ No status response data received');
          return;
        }

        const currentStatus = statusResponse.status;
        console.log('📋 Current payment status:', currentStatus);

        if (currentStatus === 'COMPLETED') {
          console.log('✅ Payment completed! Stopping polling.');
          clearInterval(pollInterval);
          
          setPaymentStatus({
            status: 'success',
            message: 'Paiement effectué avec succès !',
            transactionId: statusResponse.correspondentIds?.MTN_FINAL || 
                          statusResponse.correspondentIds?.ORANGE_FINAL || 
                          depositId,
            depositId: depositId,
          });

          // Rediriger vers la page de succès après 2 secondes
          setTimeout(() => {
            router.push({
              pathname: '/payment-success',
              params: {
                planName: planName,
                amount: amount,
                transactionId: statusResponse.correspondentIds?.MTN_FINAL || 
                              statusResponse.correspondentIds?.ORANGE_FINAL || 
                              depositId,
                isExtension: isExtendingSubscription ? 'true' : 'false',
                isNewUser: isNewUserRegistration ? 'true' : 'false'
              }
            });
          }, 1500);

        } else if (currentStatus === 'FAILED' || currentStatus === 'REJECTED') {
          console.log('❌ Payment failed/rejected! Stopping polling.');
          clearInterval(pollInterval);
          
          // 🔧 Amélioration des messages d'erreur
          let errorMessage = 'Paiement échoué. Veuillez réessayer.';
          
          if (currentStatus === 'REJECTED') {
            if (statusResponse.rejectionReason?.rejectionMessage) {
              errorMessage = `Paiement rejeté: ${statusResponse.rejectionReason.rejectionMessage}`;
            } else {
              errorMessage = 'Paiement rejeté par votre opérateur. Vérifiez votre solde et réessayez.';
            }
          } else if (currentStatus === 'FAILED') {
            errorMessage = 'Échec du paiement. Vérifiez votre connexion et réessayez.';
          }
          
          // Si on a un message spécifique de l'API, l'utiliser
          if (statusResponse.message && statusResponse.message !== 'Status retrieved successfully') {
            errorMessage = statusResponse.message;
          }
          
          setPaymentStatus({
            status: 'failed',
            message: errorMessage,
          });
        } else if (currentStatus === 'ACCEPTED') {
          console.log(`⏳ Payment still processing (${currentStatus}). Continue polling...`);
          // Continue polling for ACCEPTED status
        } else {
          console.log(`⚠️ Unknown status received: ${currentStatus}. Continue polling...`);
          // Continue polling for unknown statuses
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('⏰ Max polling attempts reached. Stopping.');
          clearInterval(pollInterval);
          setPaymentStatus({
            status: 'failed',
            message: 'Délai d\'attente dépassé. Veuillez vérifier votre transaction ou réessayer.',
          });
        }
        
      } catch (error) {
        console.error('💥 Status polling exception:', error);
        // Continue polling even on error
      }
    }, 5000); // Vérifier toutes les 5 secondes

    // Cleanup function to clear interval if component unmounts
    return () => {
      console.log('🧹 Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setErrors({});
  };

  const renderProvider = (provider: PaymentProvider) => (
    <TouchableOpacity
      key={provider.id}
      style={[
        styles.providerCard,
        selectedProvider === provider.id && styles.providerCardSelected,
      ]}
      onPress={() => setSelectedProvider(provider.id)}
    >
      <View style={styles.providerInfo}>
        <Image 
          source={provider.logo} 
          style={styles.providerLogo}
          resizeMode="contain"
        />
        <Text style={styles.providerName}>{provider.name}</Text>
      </View>
      
      {selectedProvider === provider.id && (
        <CheckCircle size={20} color={Colors.primary[500]} />
      )}
    </TouchableOpacity>
  );

  const renderPaymentStatus = () => {
    if (!paymentStatus) return null;

    const getStatusIcon = () => {
      switch (paymentStatus.status) {
        case 'pending':
        case 'processing':
          return <ActivityIndicator size="large" color={Colors.primary[500]} />;
        case 'success':
          return <CheckCircle size={48} color={Colors.success[500]} />;
        case 'failed':
          return <AlertCircle size={48} color={Colors.error[500]} />;
      }
    };

    const getStatusColor = () => {
      switch (paymentStatus.status) {
        case 'success':
          return Colors.success[500];
        case 'failed':
          return Colors.error[500];
        default:
          return Colors.primary[500];
      }
    };

    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusIcon}>
          {getStatusIcon()}
        </View>
        
        <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
          {paymentStatus.message}
        </Text>

        {paymentStatus.status === 'processing' && (
          <Text style={styles.processingHint}>
            Vous devriez recevoir une notification sur votre téléphone pour confirmer le paiement.
          </Text>
        )}

        {paymentStatus.transactionId && (
          <Text style={styles.transactionId}>
            ID: {paymentStatus.transactionId}
          </Text>
        )}

        {paymentStatus.status === 'failed' && (
          <Button
            title="Réessayer"
            onPress={handleRetry}
            style={styles.retryButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Paiement Mobile Money</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé de la commande */}
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {isExtendingSubscription ? 'Extension d\'abonnement' : 'Plan sélectionné'}
            </Text>
            <Text style={styles.summaryValue}>{planName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Montant</Text>
            <Text style={styles.summaryValueAmount}>
              {formatAmount(parseFloat(amount as string))} FCFA
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Période</Text>
            <Text style={styles.summaryValue}>
              {isExtendingSubscription ? '+1 mois supplémentaire' : '1 mois'}
            </Text>
          </View>
          
          {isExtendingSubscription && (
            <View style={styles.extensionNote}>
              <Text style={styles.extensionNoteText}>
                Ce paiement ajoutera 1 mois supplémentaire à votre abonnement actuel.
              </Text>
            </View>
          )}
        </View>

        {paymentStatus ? (
          renderPaymentStatus()
        ) : (
          <>
            {/* Sélection du provider */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choisissez votre opérateur</Text>
              
              <View style={styles.providersList}>
                {providers.map(renderProvider)}
              </View>
            </View>

            {/* Numéro de téléphone */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
              
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="+237xxxxxxxxx"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color={Colors.gray[500]} />}
                error={errors.phone}
              />
              
              <Text style={styles.phoneHint}>
                Assurez-vous que ce numéro correspond à votre compte {providers.find(p => p.id === selectedProvider)?.name}
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Comment ça marche ?</Text>
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>
                  1. Sélectionnez votre opérateur mobile money
                </Text>
                <Text style={styles.instructionItem}>
                  2. Entrez votre numéro de téléphone
                </Text>
                <Text style={styles.instructionItem}>
                  3. Confirmez le paiement
                </Text>
                <Text style={styles.instructionItem}>
                  4. Validez la transaction sur votre téléphone
                </Text>
              </View>
            </View>

            {/* Sécurité */}
            <View style={styles.securitySection}>
              <Shield size={24} color={Colors.success[500]} />
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Paiement 100% sécurisé</Text>
                <Text style={styles.securityDescription}>
                  Vos données sont protégées par un chiffrement de niveau bancaire. 
                  Nous utilisons PawaPay, une plateforme de paiement certifiée.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {!paymentStatus && (
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalAmount}>
              {formatAmount(parseFloat(amount as string))} FCFA
            </Text>
          </View>
          
          <Button
            title="Confirmer le paiement"
            onPress={handlePayment}
            loading={isLoading}
            style={styles.paymentButton}
            leftIcon={<Smartphone size={20} color={Colors.white} />}
          />
        </View>
      )}
    </SafeAreaView>
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
  orderSummary: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  section: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.s,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  summaryValueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  extensionNote: {
    marginTop: Layout.spacing.s,
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.small,
    padding: Layout.spacing.s,
  },
  extensionNoteText: {
    fontSize: 12,
    color: Colors.primary[700],
    fontStyle: 'italic',
  },
  providersList: {
    gap: Layout.spacing.s,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.m,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  providerCardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.m,
  },
  providerLogo: {
    width: 40,
    height: 40,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  phoneHint: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: Layout.spacing.xs,
  },
  instructionsSection: {
    backgroundColor: Colors.primary[50],
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginHorizontal: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[700],
    marginBottom: Layout.spacing.s,
  },
  instructionsList: {
    gap: Layout.spacing.xs,
  },
  instructionItem: {
    fontSize: 14,
    color: Colors.primary[600],
    lineHeight: 20,
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success[50],
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginHorizontal: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.m,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success[700],
    marginBottom: Layout.spacing.xs,
  },
  securityDescription: {
    fontSize: 12,
    color: Colors.success[600],
    lineHeight: 16,
  },
  statusContainer: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
    backgroundColor: Colors.white,
    margin: Layout.spacing.l,
    borderRadius: Layout.borderRadius.large,
  },
  statusIcon: {
    marginBottom: Layout.spacing.l,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
  },
  processingHint: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Layout.spacing.s,
    fontStyle: 'italic',
  },
  transactionId: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: Layout.spacing.l,
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: Layout.spacing.m,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  paymentButton: {
    paddingVertical: Layout.spacing.m,
  },
});