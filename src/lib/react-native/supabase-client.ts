import { createClient } from '@supabase/supabase-js';

// In a real React Native app, you would use:
// import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Shared Supabase client configuration
 * This is designed to be compatible with both Web and React Native.
 * For React Native, ensure you pass the custom storage option.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Detect if we are in a browser or mobile environment
    // For React Native, you must provide a persistent storage engine
    // storage: typeof window !== 'undefined' ? window.localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to get the appropriate redirect URL for Auth
 * React Native uses deep links (e.g. com.yourapp://)
 */
export const getAuthRedirectUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/auth/callback`;
  }
  // Replace with your actual mobile deep link scheme
  return 'quickcomm://auth-callback';
};
