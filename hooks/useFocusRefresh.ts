import React, { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UseFocusRefreshOptions {
  onRefresh: () => void | Promise<void>;
  refreshInterval?: number; // en millisecondes
  enabled?: boolean;
}

export function useFocusRefresh({ 
  onRefresh, 
  refreshInterval = 30000, // 30 secondes par défaut
  enabled = true 
}: UseFocusRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // Rafraîchir quand la vue devient active
  useFocusEffect(
    React.useCallback(() => {
      if (!enabled) return;

      const now = Date.now();
      
      // Rafraîchir immédiatement si c'est la première fois ou si assez de temps s'est écoulé
      if (now - lastRefreshRef.current > refreshInterval) {
        onRefresh();
        lastRefreshRef.current = now;
      }

      // Configurer le rafraîchissement périodique
      if (refreshInterval > 0) {
        intervalRef.current = setInterval(() => {
          onRefresh();
          lastRefreshRef.current = Date.now();
        }, refreshInterval);
      }

      // Nettoyer l'intervalle quand la vue devient inactive
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [onRefresh, refreshInterval, enabled])
  );

  // Nettoyer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}