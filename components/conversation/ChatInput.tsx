import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { Text } from 'react-native-web';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Send, Mic, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { Alert } from 'react-native';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isProcessing?: boolean;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, isProcessing = false, onError, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [inputHeight, setInputHeight] = useState(40); // Hauteur initiale
  const { playMessageSent } = useSoundEffects();
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Animation pour les barres de voix
  const [voiceAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  );
  const [animationLoop, setAnimationLoop] = useState<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  // Démarrer l'animation des barres de voix
  const startVoiceAnimation = () => {
    const animations = voiceAnimations.map((anim, index) => 
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + (index * 100), // Décalage pour effet de vague
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + (index * 100),
            useNativeDriver: false,
          }),
        ])
      )
    );

    const loop = Animated.stagger(50, animations);
    setAnimationLoop(loop);
    loop.start();
  };

  // Arrêter l'animation des barres de voix
  const stopVoiceAnimation = () => {
    if (animationLoop) {
      animationLoop.stop();
      setAnimationLoop(null);
    }
    // Réinitialiser les valeurs
    voiceAnimations.forEach(anim => anim.setValue(0.3));
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      setMessage(e.value[0]);
      // Envoyer automatiquement le message après reconnaissance vocale (en tant que string)
      setTimeout(() => {
        handleSend(e.value[0]);
      }, 300);
    }
    setIsRecording(false);
    stopVoiceAnimation();
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    if (e.error === 'no-speech') {
      console.warn('No speech detected:', e);
    } else {
      console.error(e);
      if (Platform.OS !== 'web') {
        Alert.alert('Erreur', 'Impossible de reconnaître votre voix. Veuillez réessayer.');
      }
    }
    setIsRecording(false);
    stopVoiceAnimation();
  };

  const handleVoiceInput = async (isStarting: boolean) => {
    if (isStarting) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

  const startRecording = async (): Promise<void> => {
    if (Platform.OS === 'web') {
      // Web Speech API implementation
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        
        recognition.onresult = (event) => {
          if (event.results && event.results[0]) {
            const transcript = event.results[0][0].transcript;
            setMessage(transcript);
            // Envoyer automatiquement le message après reconnaissance vocale
            setTimeout(() => {
              handleSend(transcript);
            }, 300);
            setIsRecording(false);
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.warn('No speech detected:', event.error);
          } else {
            console.error(event.error);
          }
          setIsRecording(false);
        };

        recognition.start();
        setIsRecording(true);
        startVoiceAnimation();
      } catch (error) {
        console.error('Web Speech API not supported:', error);
        Alert.alert('Erreur', 'La reconnaissance vocale n\'est pas supportée sur ce navigateur.');
      }
    } else {
      try {
        await Voice.start('fr-FR');
        setIsRecording(true);
        startVoiceAnimation();
      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', 'Impossible d\'activer la reconnaissance vocale.');
      }
    }
  };

  const stopRecording = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Voice.stop();
      } catch (error) {
        console.error(error);
      }
    }
    setIsRecording(false);
    stopVoiceAnimation();
  };

  const handleSend = async (textToSend?: string) => {
    const messageToSend = String(textToSend || message);
    // Vérifier que le message n'est pas vide et n'est pas un objet
    if (messageToSend.trim() === '' || isProcessing || messageToSend === '[object Object]' || disabled) {
      console.log('Message invalid or processing in progress, not sending:', { messageToSend, isProcessing });
      return;
    }
    
    // Jouer le son d'envoi
    await playMessageSent();
    
    try {
      // S'assurer que nous envoyons toujours une chaîne de caractères
      onSendMessage(messageToSend.toString());
    } catch (error) {
      // En cas d'erreur, on garde le message dans l'input
      setMessage(messageToSend);
      if (onError && error instanceof Error) {
        onError(error);
      }
      Alert.alert(
        'Erreur d\'envoi',
        'Impossible d\'envoyer votre message. Veuillez réessayer.',
        [{ text: 'OK', onPress: () => {} }],
        { cancelable: true }
      );
      return;
    }
    
    setMessage('');
    setInputHeight(40); // Réinitialiser la hauteur après envoi
  };

  // Composant pour les barres de voix animées
  const VoiceAnimation = () => (
    <View style={styles.voiceAnimationContainer}>
      {voiceAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.voiceBar,
            {
              height: anim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [8, 24],
              }),
            },
          ]}
        />
      ))}
    </View>
  );

  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    // Limiter la hauteur entre 40px (1 ligne) et 120px (environ 4 lignes)
    const newHeight = Math.max(40, Math.min(120, height));
    setInputHeight(newHeight);
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    // Si le texte est vide, réinitialiser la hauteur
    if (text.trim() === '') {
      setInputHeight(40);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        { minHeight: inputHeight + 20 },
        disabled && styles.disabledInputContainer
      ]}>
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <VoiceAnimation />
            <Text style={styles.recordingText}>En cours d'enregistrement...</Text>
          </View>
        ) : (
          <TextInput
            style={[
              styles.input,
              { 
                height: Math.max(40, inputHeight),
                textAlignVertical: 'top' // Pour Android
              },
              disabled && styles.disabledInput
            ]}
            value={message}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            placeholder="Tapez un message..."
            placeholderTextColor={Colors.gray[400]}
            multiline
            maxLength={1000}
            autoCapitalize="sentences"
            editable={!isProcessing && !disabled}
            scrollEnabled={inputHeight >= 120} // Permettre le scroll seulement quand on atteint la hauteur max
            returnKeyType="default"
            blurOnSubmit={false}
          />
        )}
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              isRecording && styles.activeButton,
              disabled && styles.disabledButton
            ]}
            onPress={() => handleVoiceInput(!isRecording)}
            onLongPress={() => handleVoiceInput(true)}
            onPressOut={() => {
              if (isRecording) {
                handleVoiceInput(false);
              }
            }}
            disabled={isProcessing || disabled}
            activeOpacity={0.7}
          >
            <Mic
              size={20}
              color={isRecording ? Colors.white : disabled ? Colors.gray[400] : Colors.primary[500]}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, message.trim() !== '' && styles.activeButton, isProcessing && styles.disabledButton]}
            onPress={() => handleSend()}
            disabled={message.trim() === '' || isProcessing || disabled}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Send
                size={20}
                color={message.trim() !== '' ? Colors.white : disabled ? Colors.gray[400] : Colors.primary[500]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.m,
    paddingTop: Layout.spacing.s,
    paddingBottom: Layout.spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.borderRadius.large,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    maxHeight: 140, // Hauteur maximale du conteneur
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray[800],
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    lineHeight: 20,
    color: Colors.gray[800],
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: Layout.spacing.s,
    paddingBottom: 2, // Petit ajustement pour l'alignement
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.s,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledInputContainer: {
    backgroundColor: Colors.gray[200],
    borderColor: Colors.gray[300],
  },
  disabledInput: {
    color: Colors.gray[500],
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.s,
  },
  recordingText: {
    fontSize: 16,
    color: Colors.primary[600],
    marginLeft: Layout.spacing.m,
    fontWeight: '500',
  },
  voiceAnimationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  voiceBar: {
    width: 3,
    backgroundColor: Colors.primary[500],
    borderRadius: 1.5,
    minHeight: 8,
  },
  activeButton: {
    backgroundColor: Colors.primary[500],
    transform: [{ scale: 1.1 }],
  },
  disabledButton: {
    backgroundColor: Colors.gray[400],
    borderColor: Colors.gray[400],
    transform: [{ scale: 1 }],
  },
});