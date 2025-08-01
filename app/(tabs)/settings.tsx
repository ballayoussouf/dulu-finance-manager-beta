import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import PaymentMethodsModal from '@/components/settings/PaymentMethodsModal';
import HelpSupportModal from '@/components/settings/HelpSupportModal';
import AboutModal from '@/components/settings/AboutModal';
import TermsModal from '@/components/settings/TermsModal';
import { User, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Receipt, Moon, Sun, Fingerprint, Info, FileText } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { refreshData, isLoading, lastUpdated } = useFinance();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const notificationsEnabled = true; // Toujours activé
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [showHelpSupportModal, setShowHelpSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Rafraîchissement automatique quand la vue devient active
  useFocusRefresh({
    onRefresh: refreshData,
    refreshInterval: 60000, // 1 minute pour les paramètres
    enabled: true,
  });

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    return lastUpdated.toLocaleDateString('fr-FR');
  };

  const settingsSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: <User size={22} color={colors.primary[500]} />,
          title: 'Profil',
          onPress: () => router.push('/(tabs)/profile'),
        },
        {
          icon: <CreditCard size={22} color={colors.primary[500]} />,
          title: 'Moyens de paiement',
          onPress: () => setShowPaymentMethodsModal(true),
        },
        {
          icon: <Receipt size={22} color={colors.primary[500]} />,
          title: 'Historique des paiements',
          onPress: () => router.push('/(tabs)/payment-history'),
        },
        {
          icon: <Bell size={22} color={colors.primary[500]} />,
          title: 'Notifications',
          onPress: () => {}, // Pas d'action car toujours activé
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={() => {}} // Pas de changement possible
              trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
              thumbColor={notificationsEnabled ? colors.primary[500] : colors.gray[100]}
              disabled={true} // Désactivé pour empêcher les changements
            />
          ),
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: isDarkMode ? <Moon size={22} color={colors.primary[500]} /> : <Sun size={22} color={colors.primary[500]} />,
          title: 'Mode sombre',
          onPress: () => {}, // Pas d'action pour le moment
          rightElement: (
            <Text style={{fontSize: 12, color: colors.gray[500], fontStyle: 'italic'}}>
              Bientôt disponible
            </Text>
          ),
        },
        {
          icon: <Fingerprint size={22} color={colors.primary[500]} />,
          title: 'Authentification biométrique',
          onPress: () => {}, // Pas d'action pour le moment
          rightElement: (
            <Text style={{fontSize: 12, color: colors.gray[500], fontStyle: 'italic'}}>
              Bientôt disponible
            </Text>
          ),
        },
      ],
    },
    {
      title: 'Assistance',
      items: [
        {
          icon: <HelpCircle size={22} color={colors.primary[500]} />,
          title: 'Aide & Support',
          onPress: () => setShowHelpSupportModal(true),
        },
        {
          icon: <Info size={22} color={colors.primary[500]} />,
          title: 'À propos de DULU',
          onPress: () => setShowAboutModal(true),
        },
        {
          icon: <FileText size={22} color={colors.primary[500]} />,
          title: 'Conditions générales',
          onPress: () => setShowTermsModal(true),
        },
      ],
    },
  ];

  const handleRefresh = async () => {
    await refreshData();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 32 : 16,
      paddingBottom: 16,
      backgroundColor: colors.white,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.gray[800],
    },
    lastUpdated: {
      fontSize: 12,
      color: colors.gray[500],
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.gray[500],
      marginBottom: 2,
    },
    profilePhone: {
      fontSize: 14,
      color: colors.gray[500],
    },
    editProfileButton: {
      paddingVertical: 4,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.gray[100],
    },
    editProfileText: {
      fontSize: 14,
      color: colors.primary[500],
      fontWeight: '500',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[700],
      marginBottom: 8,
      marginLeft: 4,
    },
    settingsList: {
      backgroundColor: colors.white,
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.gray[800],
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    comingSoonText: {
      fontSize: 12,
      color: colors.gray[500],
      fontStyle: 'italic',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
      marginBottom: 24,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error[500],
      marginLeft: 8,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.gray[500],
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Paramètres</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Mis à jour {formatLastUpdated()}
            </Text>
          )}
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        <View style={styles.profileSection}>
          <Image
            source={{ 
              uri: user?.profile_picture_url || 'https://ktqiamuxkrnseomlghqs.supabase.co/storage/v1/object/public/profile-picture//user.png'
            }}
            style={styles.profileImage}
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || '+237xxxxxxxxx'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.editProfileText}>Modifier</Text>
          </TouchableOpacity>
        </View>
        
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.settingsList}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastSettingItem,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    {item.icon && <View style={styles.settingIcon}>{item.icon}</View>}
                    <Text style={styles.settingTitle}>{item.title}</Text>
                  </View>
                  
                  <View style={styles.settingRight}>
                    {item.rightElement || <ChevronRight size={20} color={colors.gray[400]} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color={colors.error[500]} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>DULU Finance Manager v1.0.0</Text>
      </ScrollView>

      {/* Modals */}
      <PaymentMethodsModal
        visible={showPaymentMethodsModal}
        onClose={() => setShowPaymentMethodsModal(false)}
      />
      
      <HelpSupportModal
        visible={showHelpSupportModal}
        onClose={() => setShowHelpSupportModal(false)}
      />
      
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
      
      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </SafeAreaView>
  );
}