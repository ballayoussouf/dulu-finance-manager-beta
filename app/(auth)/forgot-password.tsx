import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('+237');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+237[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setPhoneError('Le numéro de téléphone est requis');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setIsLoading(true);
    try {
      // Vérifier si le numéro de téléphone existe
      const { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (queryError) {
        console.error('Database query error:', queryError);
        throw new Error('Erreur lors de la vérification du numéro de téléphone');
      }

      if (!existingUser) {
        setPhoneError('Aucun compte trouvé avec ce numéro de téléphone');
        return;
      }

      // Envoyer l'OTP via WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        method: 'POST',
        body: { 
          to: phone,
          channel: 'whatsapp'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Erreur lors de l\'envoi du code de vérification');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de l\'envoi du code de vérification');
      }

      // Naviguer vers l'écran de vérification
      router.push({
        pathname: '/(auth)/reset-verify',
        params: { phone }
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      setPhoneError(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone pour recevoir un code de vérification
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            value={phone}
            onChangeText={(text) => {
              if (text.length <= 13) {
                setPhone(text.startsWith('+237') ? text : '+237');
                setPhoneError('');
              }
            }}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={Colors.gray[500]} />}
            error={phoneError}
          />

          <Button
            title="Envoyer le code"
            onPress={handleSendCode}
            loading={isLoading}
            style={styles.button}
          />
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
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.l,
  },
  backButton: {
    position: 'absolute',
    top: Layout.spacing.xl,
    left: Layout.spacing.l,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    marginTop: Layout.spacing.xl,
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
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: Layout.spacing.l,
  },
});