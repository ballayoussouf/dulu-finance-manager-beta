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
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import md5 from 'md5';

export default function ResetPasswordScreen() {
  const { phone } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    let isValid = true;

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

    if (!isValid) return;

    setIsLoading(true);
    try {
      const hashedPassword = md5(password);

      // Mettre à jour le mot de passe dans la base de données
      const { error } = await supabase
        .from('users')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('phone', phone);

      if (error) {
        console.error('Password update error:', error);
        throw new Error('Erreur lors de la mise à jour du mot de passe');
      }

      // Afficher l'état de succès
      setIsSuccess(true);

    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color={Colors.success[500]} />
          </View>
          
          <Text style={styles.successTitle}>Mot de passe réinitialisé !</Text>
          
          <Text style={styles.successMessage}>
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </Text>

          <View style={styles.successActions}>
            <Button
              title="Se connecter maintenant"
              onPress={handleGoToLogin}
              style={styles.loginButton}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            Créez un nouveau mot de passe pour votre compte
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            placeholder="Nouveau mot de passe"
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
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
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

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
            <Text style={styles.requirementItem}>• Au moins 6 caractères</Text>
            <Text style={styles.requirementItem}>• Utilisez un mot de passe unique</Text>
          </View>

          <Button
            title="Réinitialiser le mot de passe"
            onPress={handleResetPassword}
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
  },
  formContainer: {
    width: '100%',
  },
  passwordRequirements: {
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginVertical: Layout.spacing.m,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.xs,
  },
  requirementItem: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  button: {
    marginTop: Layout.spacing.m,
  },
  // Styles pour l'état de succès
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  successIcon: {
    marginBottom: Layout.spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.m,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
  },
});