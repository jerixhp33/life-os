import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    try { await SecureStore.setItemAsync(key, value); } catch { await AsyncStorage.setItem(key, value); }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    try { await SecureStore.deleteItemAsync(key); } catch { await AsyncStorage.removeItem(key); }
  },
};

const DEFAULT_SUPABASE_URL = 'https://fnjvyogwandgbqrnahld.supabase.co';
const DEFAULT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuanZ5b2d3YW5kZ2Jxcm5haGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NTQ5MTAsImV4cCI6MjExMDIzMDkxMH0.-dpiCIVl3L4REjcB-ZYoElFszoQHug4xVCp4h9NZHhI';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ||
  DEFAULT_SUPABASE_ANON;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { storage: SecureStoreAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);
