import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: typeof lightColors;
  isLoading: boolean;
}

// Couleurs pour le thème clair
const lightColors = {
  primary: {
    50: '#F3E5FF',
    100: '#E7CCFE',
    200: '#D0A9FD',
    300: '#B985FB',
    400: '#A262FA',
    500: '#8A2BE2',
    600: '#7325BA',
    700: '#5C1E93',
    800: '#46176C',
    900: '#2F0F45',
  },
  accent: {
    300: '#E9D5FF',
    500: '#9370DB',
    700: '#6A5ACD',
  },
  success: {
    50: '#ECFDF5',
    300: '#6EE7B7',
    500: '#10B981',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    300: '#FCD34D',
    500: '#F59E0B',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    300: '#FCA5A5',
    500: '#EF4444',
    700: '#B91C1C',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  background: {
    light: '#FFFFFF',
    dark: '#111827',
  },
};

// Couleurs pour le thème sombre
const darkColors = {
  primary: {
    50: '#2F0F45',
    100: '#46176C',
    200: '#5C1E93',
    300: '#7325BA',
    400: '#8A2BE2',
    500: '#A262FA',
    600: '#B985FB',
    700: '#D0A9FD',
    800: '#E7CCFE',
    900: '#F3E5FF',
  },
  accent: {
    300: '#6A5ACD',
    500: '#9370DB',
    700: '#E9D5FF',
  },
  success: {
    50: '#047857',
    300: '#10B981',
    500: '#6EE7B7',
    700: '#ECFDF5',
  },
  warning: {
    50: '#B45309',
    300: '#F59E0B',
    500: '#FCD34D',
    700: '#FFFBEB',
  },
  error: {
    50: '#B91C1C',
    300: '#EF4444',
    500: '#FCA5A5',
    700: '#FEF2F2',
  },
  gray: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
  },
  white: '#111827',
  black: '#FFFFFF',
  transparent: 'transparent',
  background: {
    light: '#111827',
    dark: '#FFFFFF',
  },
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  colors: lightColors,
  isLoading: true,
});

const THEME_STORAGE_KEY = '@dulu_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      if (Platform.OS === 'web') {
        // Pour le web, utiliser localStorage
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } else {
        // Pour mobile, utiliser AsyncStorage
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences de thème:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (darkMode: boolean) => {
    try {
      if (Platform.OS === 'web') {
        // Pour le web, utiliser localStorage
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(darkMode));
      } else {
        // Pour mobile, utiliser AsyncStorage
        await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(darkMode));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences de thème:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    saveThemePreference(newDarkMode);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        colors,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}