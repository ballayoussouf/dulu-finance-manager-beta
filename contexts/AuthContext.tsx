import React, { createContext, useState, useContext } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import md5 from 'md5';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Alert, Platform } from 'react-native';

interface User {
  id: string;
  phone: string;
  email: string;
  name: string;
  profile_picture_url: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, password: string, email: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  clearError: () => {},
  signInWithGoogle: async () => {},
});

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      clearError();

      const redirectUrl = makeRedirectUri({
        path: '/(auth)/login',
      });

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) throw authError;

      if (data?.user) {
        const { email, user_metadata } = data.user;
        
        if (!email) throw new Error('Email non disponible');

        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (userError && !userError.message.includes('Results contain 0 rows')) {
          throw userError;
        }

        if (existingUser) {
          // Vérifier si c'est un compte social
          if (existingUser.password_hash !== 'social') {
            setError('Un compte existe déjà avec cet email. Veuillez vous connecter avec votre mot de passe.');
            return;
          }

          // Connexion avec compte social existant
          setUser({
            id: existingUser.id,
            phone: existingUser.phone,
            email: existingUser.email,
            name: `${existingUser.first_name} ${existingUser.last_name}`.trim(),
            profile_picture_url: existingUser.profile_picture_url,
          });
        } else {
          // Créer un nouveau compte
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
              {
                email: email.toLowerCase(),
                password_hash: 'social',
                first_name: user_metadata.given_name || '',
                last_name: user_metadata.family_name || '',
                profile_picture_url: user_metadata.picture || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                subscription_level: 'free',
              },
            ])
            .select()
            .single();

          if (createError) throw createError;

          setUser({
            id: newUser.id,
            phone: newUser.phone,
            email: newUser.email,
            name: `${newUser.first_name} ${newUser.last_name}`.trim(),
            profile_picture_url: newUser.profile_picture_url,
          });
        }

        router.replace('/(onboarding)');
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion avec Google');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (phone: string, password: string) => {
    setIsLoading(true);
    clearError();

    try {
      const hashedPassword = md5(password);
      const normalizedPhone = phone.trim();

      // First check if the user exists
      const { data: userExists, error: userExistsError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (userExistsError) {
        if (userExistsError.message.includes('Results contain 0 rows')) {
          setError('Aucun compte trouvé avec ce numéro');
          return;
        }
        throw new Error('Erreur lors de la connexion');
      }

      // If user exists, check credentials
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('password_hash', hashedPassword)
        .single();

      if (userError || !userData) {
        setError('Numéro ou mot de passe incorrect');
        return;
      }

      // Update last_login
      const currentTime = new Date().toISOString();
      await supabase
        .from('users')
        .update({ last_login: currentTime })
        .eq('id', userData.id);

      setUser({
        id: userData.id,
        phone: userData.phone,
        email: userData.email,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        profile_picture_url: userData.profile_picture_url,
      });

      // Redirect based on last_login
      if (!userData.last_login) {
        router.replace('/(onboarding)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, phone: string, password: string, email: string) => {
    setIsLoading(true);
    clearError();

    try {
      const normalizedPhone = phone.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const hashedPassword = md5(password);

      // Check if phone already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (existingUser) {
        setError('Ce numéro est déjà utilisé');
        return;
      }

      // Split name into first and last name
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const currentTime = new Date().toISOString();

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            phone: normalizedPhone,
            email: normalizedEmail,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName || '',
            created_at: currentTime,
            updated_at: currentTime,
            last_login: currentTime // Set initial last_login
          },
        ])
        .select()
        .single();

      if (createError || !newUser) {
        throw new Error('Erreur lors de la création du compte');
      }

      setUser({
        id: newUser.id,
        phone: newUser.phone,
        email: newUser.email,
        name: `${newUser.first_name} ${newUser.last_name}`.trim(),
        profile_picture_url: newUser.profile_picture_url,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}