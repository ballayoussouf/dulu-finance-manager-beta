import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

export default function Index() {
  useEffect(() => {
    // Assurer que la redirection fonctionne correctement sur mobile
    if (Platform.OS !== 'web') {
      console.log('Mobile platform detected, redirecting to auth...');
    }
  }, []);

  return <Redirect href="/(auth)/login" />;
}