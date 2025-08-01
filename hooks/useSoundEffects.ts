import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface SoundEffects {
  playMessageSent: () => Promise<void>;
  playMessageReceived: () => Promise<void>;
  playNotification: () => Promise<void>;
}

export function useSoundEffects(): SoundEffects {
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // Marquer comme chargé immédiatement pour éviter les délais
    isLoadedRef.current = true;
  }, []);

  // Fonction pour jouer un son web simple
  const playWebTone = (frequency: number, duration: number, volume: number = 0.3) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Vérifier si AudioContext est disponible
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.log('Web Audio API non disponible');
        return;
      }

      const audioContext = new AudioContext();
      
      // Reprendre le contexte audio si nécessaire (politique des navigateurs)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Envelope pour éviter les clics
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // Nettoyer après utilisation
      setTimeout(() => {
        try {
          audioContext.close();
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
      }, (duration + 0.1) * 1000);
      
    } catch (error) {
      console.log('Erreur Web Audio API:', error);
    }
  };

  // Fonction pour jouer une mélodie web
  const playWebNotification = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.log('Web Audio API non disponible');
        return;
      }

      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Mélodie simple: Do-Mi-Sol
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const noteDuration = 0.15;
      
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + index * noteDuration;
        const endTime = startTime + noteDuration;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
      
      // Nettoyer après utilisation
      setTimeout(() => {
        try {
          audioContext.close();
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
      }, (notes.length * noteDuration + 0.1) * 1000);
      
    } catch (error) {
      console.log('Erreur Web Audio API notification:', error);
    }
  };

  // Fonction pour vibrer sur mobile (fallback silencieux)
  const triggerMobileVibration = (pattern: number[] = [100]) => {
    if (Platform.OS !== 'web') {
      try {
        // Utiliser l'API de vibration native si disponible
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(pattern);
        }
      } catch (error) {
        // Ignorer les erreurs de vibration
        console.log('Vibration non disponible');
      }
    }
  };

  const playMessageSent = async () => {
    try {
      if (!isLoadedRef.current) {
        console.log('Sons non encore chargés');
        return;
      }

      if (Platform.OS === 'web') {
        playWebTone(800, 0.1, 0.3);
      } else {
        // Sur mobile, utiliser une vibration courte comme feedback
        triggerMobileVibration([50]);
      }
    } catch (error) {
      console.log('Erreur lors de la lecture du son d\'envoi:', error);
      // Fallback silencieux - pas d'erreur
    }
  };

  const playMessageReceived = async () => {
    try {
      if (!isLoadedRef.current) {
        console.log('Sons non encore chargés');
        return;
      }

      if (Platform.OS === 'web') {
        playWebTone(400, 0.2, 0.4);
      } else {
        // Sur mobile, utiliser une vibration double comme feedback
        triggerMobileVibration([100, 50, 100]);
      }
    } catch (error) {
      console.log('Erreur lors de la lecture du son de réception:', error);
      // Fallback silencieux - pas d'erreur
    }
  };

  const playNotification = async () => {
    try {
      if (!isLoadedRef.current) {
        console.log('Sons non encore chargés');
        return;
      }

      if (Platform.OS === 'web') {
        playWebNotification();
      } else {
        // Sur mobile, utiliser une vibration de notification
        triggerMobileVibration([200, 100, 200, 100, 200]);
      }
    } catch (error) {
      console.log('Erreur lors de la lecture de la notification:', error);
      // Fallback silencieux - pas d'erreur
    }
  };

  return {
    playMessageSent,
    playMessageReceived,
    playNotification,
  };
}