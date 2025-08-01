import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { Phone, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function RegisterPhoneScreen() {
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
      // Check if phone number already exists
      // Utiliser une requête plus robuste qui gère mieux les erreurs
      const { data, error: queryError } = await supabase
        .rpc('check_phone_exists', { phone_param: phone });

      if (queryError) {
        console.error('Database query error:', queryError);
        throw new Error('Erreur lors de la vérification du numéro de téléphone');
      }

      if (data && data.exists) {
        setPhoneError('Ce numéro est déjà utilisé');
        return;
      }

      // Send OTP via WhatsApp using Edge Function
      const { data: otpData, error } = await supabase.functions.invoke('send-whatsapp-otp', {
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

      if (!otpData?.success) {
        throw new Error(otpData?.error || 'Échec de l\'envoi du code de vérification');
      }

      // Navigate to verification screen
      router.push({
        pathname: '/register/verify',
        params: { phone }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
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
          <Image
            source={require('@/assets/images/logo-dulu.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone pour commencer
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
            title="Continuer"
            onPress={handleSendCode}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
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
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: Colors.gray[600],
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
  },
});