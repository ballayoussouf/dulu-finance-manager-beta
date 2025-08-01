import { useEffect } from 'react';
import { AppRegistry, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Register the main component for React Native
      AppRegistry.registerComponent('main', () => RootLayout);
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <Stack 
            screenOptions={{ headerShown: false }}
            initialRouteName="(auth)"
          >
            <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default RootLayout;