import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable. Please check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
);