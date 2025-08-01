import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Eye, EyeOff, User, Mail } from 'lucide-react-native';

export default function CompleteRegistrationScreen() {
  const { phone } = useLocalSearchParams();
  const { signUp, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Le nom est requis');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!email.trim()) {
      setEmailError("L'email est requis");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Veuillez entrer un email valide');
      isValid = false;
    } else {
      setEmailError('');
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

    if (password !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (isValid) {
      try {
        await signUp(name, phone as string, password, email);
        // Rediriger vers la page de choix du plan
        router.replace({
          pathname: '/register/plan',
          params: { phone }
        });
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
          <Image
            source={require('@/assets/images/logo-dulu.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Finaliser l'inscription</Text>
          <Text style={styles.subtitle}>Complétez vos informations</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom complet"
            autoCapitalize="words"
            leftIcon={<User size={20} color={Colors.gray[500]} />}
            error={nameError}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.gray[500]} />}
            error={emailError}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
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

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmer le mot de passe"
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Lock size={20} color={Colors.gray[500]} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.gray[500]} />
                ) : (
                  <Eye size={20} color={Colors.gray[500]} />
                )}
              </TouchableOpacity>
            }
            error={confirmPasswordError}
          />

          <Button
            title="Terminer l'inscription"
            onPress={handleRegister}
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
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  logo: {
    width: 80,
    height: 80,
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
});