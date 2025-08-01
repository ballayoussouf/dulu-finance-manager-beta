import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Text } from 'react-native-web';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import ChatBubble from '@/components/conversation/ChatBubble';
import ChatInput from '@/components/conversation/ChatInput';
import { ChatMessage } from '@/types'; 
import { ChevronDown, CircleAlert as AlertCircle, WifiOff, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { usePricing } from '@/hooks/usePricing';

export default function ChatScreen() {
  const { 
    chatHistory, 
    addChatMessage, 
    isProcessing
  } = useFinance();
  const { user } = useAuth();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;
  const isNearBottom = useRef(true);
  const previousMessageCount = useRef(0);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const errorPopupOpacity = useRef(new Animated.Value(0)).current;
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const { proPrice } = usePricing();

  // Effet pour scroll automatique lors du chargement initial
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Délai pour s'assurer que la FlatList est rendue
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [chatHistory.length === 0 ? 0 : 1]); // Se déclenche seulement au premier chargement

  // Effet pour scroll automatique lors de nouveaux messages
  useEffect(() => {
    const currentMessageCount = chatHistory.length;
    
    // Si on a de nouveaux messages et qu'on était près du bas
    if (currentMessageCount > previousMessageCount.current && isNearBottom.current) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      
      previousMessageCount.current = currentMessageCount;
      return () => clearTimeout(timer);
    }
    
    previousMessageCount.current = currentMessageCount;
  }, [chatHistory.length]);

  // Effet pour afficher/masquer le popup d'erreur
  useEffect(() => {
    if (showErrorPopup) {
      Animated.sequence([
        Animated.timing(errorPopupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(errorPopupOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowErrorPopup(false);
      });
    }
  }, [showErrorPopup]);

  // Simuler une vérification de connexion
  useEffect(() => {
    const checkConnection = () => {
      // Simuler une vérification de connexion
      // En production, vous pourriez vérifier l'état de votre webhook ou service
      const isConnected = navigator.onLine; // Vérification basique de la connexion
      setConnectionError(!isConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Vérifier si l'abonnement est expiré
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_level, subscription_end_date')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Vérifier si l'abonnement est expiré pour tous les types d'utilisateurs
        if (data) {
          const endDate = new Date(data.subscription_end_date);
          const today = new Date();
          
          // Vérifier si l'abonnement est expiré (pour les utilisateurs pro et free)
          if (endDate < today) {
            setIsSubscriptionExpired(true);
          } else {
            setIsSubscriptionExpired(false);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'abonnement:', error);
      }
    };

    checkSubscriptionStatus();
  }, [user]);
  const scrollToBottom = (animated = true) => {
    if (flatListRef.current && chatHistory.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated });
        isNearBottom.current = true;
        setShowScrollButton(false);
        
        // Masquer le bouton de scroll
        Animated.timing(scrollButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.log('Erreur lors du scroll:', error);
      }
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    
    // Considérer qu'on est "près du bas" si on est à moins de 100px
    const nearBottom = distanceFromBottom < 100;
    isNearBottom.current = nearBottom;
    
    const shouldShow = distanceFromBottom > 200; // Afficher le bouton si on est à plus de 200px du bas

    if (shouldShow !== showScrollButton) {
      setShowScrollButton(shouldShow);
      Animated.timing(scrollButtonOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSendMessage = async (text: string) => {
    // Vérifier si l'abonnement est expiré
    if (isSubscriptionExpired) {
      const buttonText = user?.subscription_level === 'pro' ? 'Renouveler' : 'Mise à niveau';
      Alert.alert(
        'Abonnement expiré',
        `Votre ${user?.subscription_level === 'pro' ? 'abonnement' : 'période d\'essai'} a expiré. Veuillez ${user?.subscription_level === 'pro' ? 'le renouveler' : 'passer à la version Pro'} pour continuer à utiliser l'assistant DULU.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: buttonText, 
            onPress: () => {
              if (user?.subscription_level === 'pro') {
                router.push({
                  pathname: '/payment',
                  params: {
                    planId: 'pro',
                    amount: proPrice.toString(),
                    planName: 'Pro',
                    isExtension: 'true'
                  }
                });
              } else {
                router.push('/(tabs)/upgrade');
              }
            }
          }
        ]
      );
      return;
    }

    // Marquer qu'on va être près du bas après l'envoi
    isNearBottom.current = true;

    try {
      await addChatMessage({
        text,
        sender: 'user',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setFailedMessage(text);
      setShowErrorPopup(true);
      handleMessageError(error);
    }
  };

  const handleMessageError = (error: any) => {
    setConnectionError(true);
    setShowErrorPopup(true);
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    
    const currentMessage = chatHistory[index];
    const previousMessage = chatHistory[index - 1];
    
    return (
      currentMessage.timestamp.toDateString() !== 
      previousMessage.timestamp.toDateString()
    );
  };

  const handleContentSizeChange = () => {
    // Si on était près du bas, scroller automatiquement
    if (isNearBottom.current) {
      scrollToBottom(true);
    }
  };

  const handleLayout = () => {
    // Scroll initial après le layout
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollToBottom(false);
      }, 50);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Bannière d'abonnement expiré */}
        {isSubscriptionExpired && (
          <View style={styles.subscriptionExpiredBanner}>
            <Crown size={16} color={Colors.error[700]} />
            <Text style={styles.subscriptionExpiredText}>
              {user?.subscription_level === 'pro' 
                ? 'Abonnement expiré. Veuillez renouveler pour continuer à utiliser l\'assistant.'
                : 'Période d\'essai expirée. Veuillez passer à la version Pro pour continuer à utiliser l\'assistant.'}
            </Text>
            <TouchableOpacity 
              style={styles.renewButton}
              onPress={() => router.push('/(tabs)/upgrade')}
            >
              <Text style={styles.renewButtonText}>
                {user?.subscription_level === 'pro' ? 'Renouveler' : 'Mise à niveau'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Indicateur de connexion - SIMPLIFIÉ sans bouton de saisie manuelle */}
        {connectionError && (
          <View style={styles.connectionBanner}>
            <AlertCircle size={16} color={Colors.warning[700]} />
            <Text style={styles.connectionBannerText}>
              Service temporairement indisponible. Vérifiez votre connexion.
            </Text>
          </View>
        )}

        {/* Popup d'erreur */}
        {showErrorPopup && (
          <Animated.View 
            style={[
              styles.errorPopup,
              { opacity: errorPopupOpacity }
            ]}
          >
            <WifiOff size={16} color={Colors.error[500]} />
            <Text style={styles.errorPopupText}>
              Échec de l'envoi. Veuillez réessayer.
            </Text>
          </Animated.View>
        )}

        <FlatList
          ref={flatListRef}
          data={chatHistory}
          renderItem={({ item, index }) => (
            <ChatBubble 
              message={item} 
              showDate={shouldShowDate(index)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        <Animated.View 
          style={[
            styles.scrollButtonContainer,
            { opacity: scrollButtonOpacity }
          ]}
          pointerEvents={showScrollButton ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => scrollToBottom(true)}
          >
            <ChevronDown size={24} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
        
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          onError={handleMessageError}
          disabled={isSubscriptionExpired}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  subscriptionExpiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error[200],
    gap: Layout.spacing.s,
  },
  subscriptionExpiredText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error[700],
    fontWeight: '500',
  },
  renewButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.medium,
  },
  renewButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning[200],
    gap: Layout.spacing.s,
  },
  errorPopup: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    left: '10%',
    right: '10%',
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  errorPopupText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error[700],
    fontWeight: '500',
  },
  connectionBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning[700],
    fontWeight: '500',
  },
  chatContainer: {
    paddingHorizontal: Layout.spacing.m,
    paddingTop: Platform.OS === 'android' ? Layout.spacing.xl : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    flexGrow: 1,
  },
  scrollButtonContainer: {
    position: 'absolute',
    right: Layout.spacing.m,
    bottom: 80,
    alignItems: 'center',
  },
  scrollButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});