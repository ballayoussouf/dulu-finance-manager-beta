import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [phone, setPhone] = useState('+237');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animation du logo (pulsation)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+237[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleLogin = async () => {
    clearError();
    let isValid = true;

    if (!phone.trim()) {
      setPhoneError('Le numéro de téléphone est requis');
      isValid = false;
    } else if (!validatePhone(phone)) {
      setPhoneError('Veuillez entrer un numéro de téléphone valide');
      isValid = false;
    } else {
      setPhoneError('');
    }

    if (!password.trim()) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (isValid) {
      try {
        await signIn(phone, password);
      } catch (error) {
        // Error is handled in AuthContext
      }
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
          <Animated.Image
            source={require('@/assets/images/logo-dulu.png')}
            style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
          <Text style={styles.title}>DULU Finance</Text>
          <Text style={styles.subtitle}>Votre Assistant Financier Personnel</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            value={phone}
            onChangeText={(text) => {
              if (text.length <= 13) {
                setPhone(text.startsWith('+237') ? text : '+237');
                setPhoneError('');
                clearError();
              }
            }}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={Colors.gray[500]} />}
            error={phoneError}
          />

          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              clearError();
            }}
            placeholder="Mot de passe"
            secureTextEntry={!showPassword}
            leftIcon={<Lock size={20} color={Colors.gray[500]} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.gray[500]} />
                ) : (
                  <Eye size={20} color={Colors.gray[500]} />
                )}
              </TouchableOpacity>
            }
            error={passwordError}
          />

          <View style={styles.forgotPasswordContainer}>
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.divider} />
          </View>

          <Button
            title="Continuer avec Google"
            onPress={signInWithGoogle}
            variant="outline"
            style={styles.socialButton}
            disabled={true}
            leftIcon={
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            }
          />

          <Button
            title="Continuer avec Facebook"
            onPress={() => {}}
            variant="outline"
            style={[styles.socialButton, { opacity: 0.5 }]}
            disabled={true}
            leftIcon={
              <Image
                source={{ uri: 'https://www.facebook.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            }
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
            <Link href="/register/terms" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>S'inscrire</Text>
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
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: Layout.spacing.m,
  },
  title: {
    fontSize: 28,
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
  errorContainer: {
    backgroundColor: Colors.error[50],
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.m,
  },
  errorText: {
    color: Colors.error[700],
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: -Layout.spacing.s,
    marginBottom: Layout.spacing.l,
  },
  forgotPasswordText: {
    color: Colors.primary[600],
    fontSize: 14,
  },
  button: {
    marginBottom: Layout.spacing.m,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.m,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    marginHorizontal: Layout.spacing.m,
    color: Colors.gray[500],
    fontSize: 14,
  },
  socialButton: {
    marginBottom: Layout.spacing.m,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: Layout.spacing.s,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.l,
  },
  registerText: {
    color: Colors.gray[600],
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
  },
});
