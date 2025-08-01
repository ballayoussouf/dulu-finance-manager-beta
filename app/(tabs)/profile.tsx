import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Camera, Save, Edit3, Crown, ArrowRight, Plus } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { usePricing } from '@/hooks/usePricing';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  subscription_level: string;
  subscription_end_date: string | null;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const { proPrice } = usePricing();

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        profile_picture_url: data.profile_picture_url,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          date_of_birth: editedProfile.date_of_birth,
          profile_picture_url: editedProfile.profile_picture_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Mettre à jour le profil local
      setProfile(prev => prev ? { ...prev, ...editedProfile } : null);
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    
    setEditedProfile({
      first_name: profile.first_name,
      last_name: profile.last_name,
      date_of_birth: profile.date_of_birth,
      profile_picture_url: profile.profile_picture_url,
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionLabel = (level: string) => {
    switch (level) {
      case 'free':
        return 'Essai';
      case 'pro':
        return 'Pro';
      case 'premium':
        return 'Premium';
      default:
        return level;
    }
  };

  const getSubscriptionColor = (level: string) => {
    switch (level) {
      case 'free':
        return Colors.gray[500];
      case 'pro':
        return Colors.primary[500];
      case 'premium':
        return Colors.warning[500];
      default:
        return Colors.gray[500];
    }
  };

  // Calculer les jours restants pour les utilisateurs Pro
  const getDaysRemaining = () => {
    if (!profile?.subscription_end_date) return 0;
    
    const endDate = new Date(profile.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();
  const isProUser = profile?.subscription_level === 'pro';

  const handleUpgrade = () => {
    // Naviguer vers la page d'upgrade au lieu d'afficher une alerte
    router.push('/(tabs)/upgrade');
  };

  const handleExtendSubscription = () => {
    // Naviguer vers la page de paiement avec le paramètre d'extension
    router.push({
      pathname: '/payment',
      params: {
        planId: 'pro',
        amount: proPrice.toString(),
        planName: 'Pro',
        isExtension: 'true'
      }
    });
  };

  const renderField = (
    label: string,
    value: string | null,
    isEditable: boolean = false,
    fieldKey?: keyof UserProfile,
    inputType: 'text' | 'date' = 'text'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditable && isEditing && fieldKey ? (
        inputType === 'date' ? (
          <DatePicker
            value={editedProfile[fieldKey] as string || null}
            onDateChange={(date) => setEditedProfile(prev => ({ ...prev, [fieldKey]: date }))}
            placeholder="Sélectionner une date"
          />
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={editedProfile[fieldKey] as string || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, [fieldKey]: text }))}
            placeholder={`Entrez ${label.toLowerCase()}`}
            placeholderTextColor={Colors.gray[400]}
          />
        )
      ) : (
        <Text style={[styles.fieldValue, !isEditable && styles.readOnlyField]}>
          {inputType === 'date' ? formatDate(value) : (value || 'Non renseigné')}
        </Text>
      )}
    </View>
  );

  const renderSubscriptionField = () => {
    const subscriptionLevel = profile?.subscription_level || 'free';
    const subscriptionLabel = getSubscriptionLabel(subscriptionLevel);
    const subscriptionColor = getSubscriptionColor(subscriptionLevel);
    const isTrialUser = subscriptionLevel === 'free';

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Type d'abonnement</Text>
        <View style={styles.subscriptionContainer}>
          <View style={styles.subscriptionInfo}>
            <View style={styles.subscriptionBadge}>
              {subscriptionLevel !== 'free' && (
                <Crown size={14} color={subscriptionColor} />
              )}
              <Text style={[
                styles.subscriptionText,
                { color: subscriptionColor }
              ]}>
                {subscriptionLabel}
              </Text>
            </View>
            
            {subscriptionLevel !== 'free' && profile?.subscription_end_date && (
              <Text style={styles.subscriptionEndDate}>
                Expire le {formatDate(profile.subscription_end_date)}
                {isProUser && daysRemaining > 0 && (
                  <Text style={styles.daysRemaining}> ({daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''})</Text>
                )}
              </Text>
            )}
          </View>
          
          {isTrialUser ? (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.7}
            >
              <Crown size={16} color={Colors.white} />
              <Text style={styles.upgradeButtonText}>Mise à niveau</Text>
              <ArrowRight size={14} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.extendButton}
              onPress={handleExtendSubscription}
              activeOpacity={0.7}
            >
              <Plus size={16} color={Colors.white} />
              <Text style={styles.extendButtonText}>Étendre</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Impossible de charger le profil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.gray[700]} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Mon Profil</Text>
        
        <TouchableOpacity
          style={[styles.editButton, isEditing && styles.editButtonActive]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Edit3 size={20} color={isEditing ? Colors.white : Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo de profil */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: (isEditing ? editedProfile.profile_picture_url : profile.profile_picture_url) || 
                     'https://ktqiamuxkrnseomlghqs.supabase.co/storage/v1/object/public/profile-picture//user.png'
              }}
              style={styles.profileImage}
            />
            {isEditing && (
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          {renderField('Identifiant', profile.id.substring(0, 8) + '...', false)}
          {renderField('Prénom', profile.first_name, true, 'first_name')}
          {renderField('Nom', profile.last_name, true, 'last_name')}
          {renderField('Email', profile.email, false)}
          {renderField('Téléphone', profile.phone, false)}
          {renderField('Date de naissance', profile.date_of_birth, true, 'date_of_birth', 'date')}
        </View>

        {/* Informations du compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          {renderField('Date d\'inscription', formatDateTime(profile.created_at), false)}
          {renderField('Dernière connexion', formatDateTime(profile.last_login), false)}
          {renderField('État du compte', profile.is_active ? 'Actif' : 'Inactif', false)}
        </View>

        {/* Abonnement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnement</Text>
          
          {renderSubscriptionField()}
          {renderField('Fin d\'abonnement', formatDate(profile.subscription_end_date), false)}
        </View>

        {/* Boutons d'action */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <Button
              title="Annuler"
              onPress={handleCancel}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Enregistrer"
              onPress={handleSave}
              loading={isSaving}
              style={styles.actionButton}
              leftIcon={<Save size={20} color={Colors.white} />}
            />
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  editButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.m,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingBottom: Layout.spacing.s,
  },
  fieldContainer: {
    marginBottom: Layout.spacing.m,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.gray[800],
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  readOnlyField: {
    backgroundColor: Colors.gray[100],
    color: Colors.gray[600],
  },
  fieldInput: {
    fontSize: 16,
    color: Colors.gray[800],
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  subscriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  subscriptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionEndDate: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  daysRemaining: {
    fontWeight: '500',
    color: Colors.primary[600],
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.full,
    gap: Layout.spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[500],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.full,
    gap: Layout.spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  extendButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.m,
    marginVertical: Layout.spacing.l,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error[500],
  },
});