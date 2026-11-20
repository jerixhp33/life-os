import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS==='web') return AsyncStorage.getItem(key);
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS==='web') return AsyncStorage.setItem(key, value);
    try { await SecureStore.setItemAsync(key, value); } catch { await AsyncStorage.setItem(key, value); }
  },
  removeItem: async (key: string) => {
    if (Platform.OS==='web') return AsyncStorage.removeItem(key);
    try { await SecureStore.deleteItemAsync(key); } catch { await AsyncStorage.removeItem(key); }
  },
};

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__ && (!supabaseUrl || !supabaseAnon)) {
  console.warn('[LifeOS] Supabase credentials not set. Copy .env.example to .env.local and fill in your project values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { storage: SecureStoreAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);
