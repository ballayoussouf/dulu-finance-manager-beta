import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { MessageCircle as LogoWhatsapp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ResetVerifyCodeScreen() {
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setCodeError('Veuillez entrer un code valide');
      return;
    }

    setIsLoading(true);
    try {
      // Vérifier le code OTP
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (verificationError) {
        console.error('Verification error:', verificationError);
        setCodeError('Une erreur est survenue lors de la vérification');
        return;
      }

      if (!verificationData || verificationData.length === 0) {
        setCodeError('Code invalide ou expiré. Veuillez réessayer.');
        return;
      }

      // Marquer le code comme vérifié
      const { error: updateError } = await supabase
        .from('verification_codes')
        .update({ 
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', verificationData[0].id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Rediriger vers la page de nouveau mot de passe
      router.push({
        pathname: '/(auth)/reset-password',
        params: { phone }
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      setCodeError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        method: 'POST',
        body: { 
          to: phone as string,
          channel: 'whatsapp'
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de l\'envoi du code de vérification');
      }

      setTimeLeft(300); // Reset timer to 5 minutes
      setCanResend(false);
      setCodeError('');
      Alert.alert('Succès', 'Un nouveau code a été envoyé.');
    } catch (error: any) {
      setCodeError('Erreur lors de l\'envoi du code. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>
            Entrez le code à 6 chiffres envoyé sur votre WhatsApp
          </Text>
          <View style={styles.whatsappContainer}>
            <LogoWhatsapp size={24} color="#25D366" />
            <Text style={styles.whatsappText}>{phone}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, ''));
              setCodeError('');
            }}
            placeholder="Code de vérification"
            keyboardType="number-pad"
            maxLength={6}
            error={codeError}
          />

          <Button
            title="Vérifier"
            onPress={handleVerifyCode}
            loading={isLoading}
            style={styles.button}
          />

          {!canResend ? (
            <Text style={styles.timerText}>
              Renvoyer le code dans {formatTime(timeLeft)}
            </Text>
          ) : (
            <Button
              title="Renvoyer le code"
              onPress={handleResendCode}
              variant="text"
              loading={isLoading}
            />
          )}
        </View>
      </ScrollView>
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
    marginBottom: Layout.spacing.s,
  },
  whatsappContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D36620',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.s,
    marginBottom: Layout.spacing.m,
  },
  whatsappText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#075E54',
    marginLeft: Layout.spacing.s,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  timerText: {
    textAlign: 'center',
    color: Colors.gray[600],
    fontSize: 14,
  },
});