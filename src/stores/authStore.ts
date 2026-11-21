import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';
import type { UserProfile } from '../types';

export const PROFILE_CACHE_KEY = 'lifeos_cached_user_profile';
export const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

export function isCleanAvatarUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  if (trimmed.includes('avatar_test.jpg')) return false; // Corrupt placeholder string
  return true;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '72174898-5ffa-49b2-a5fa-5c85972e819f',
  email: 'manikandanjanani67@gmail.com',
  full_name: 'Manikandan',
  avatar_url: null,
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  theme: 'system',
  notification_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: DEFAULT_PROFILE,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      // 1. Load persistent local avatar first
      let cachedAvatarUrl: string | null = null;
      try {
        const storedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
        if (isCleanAvatarUrl(storedAvatar)) {
          cachedAvatarUrl = storedAvatar;
        } else if (storedAvatar && storedAvatar.includes('avatar_test.jpg')) {
          // Clear legacy corrupt URL
          await AsyncStorage.removeItem(AVATAR_CACHE_KEY);
        }
      } catch {}

      // 2. Load cached profile immediately for instant 0ms UI load
      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            const cleanUrl = isCleanAvatarUrl(parsed.avatar_url) ? parsed.avatar_url : cachedAvatarUrl;
            set({
              profile: {
                ...parsed,
                avatar_url: cleanUrl,
              } as UserProfile,
            });
          }
        } else if (cachedAvatarUrl) {
          set({ profile: { ...DEFAULT_PROFILE, avatar_url: cachedAvatarUrl } });
        }
      } catch {}

      // 3. Check Supabase session with 3.5s timeout guard so it never hangs offline
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 3500)
      );

      let session: Session | null = null;
      try {
        const raceResult = await Promise.race([sessionPromise, timeoutPromise]);
        session = raceResult.data.session;
      } catch (sessErr) {
        console.warn('[Auth] Session check timed out or offline:', sessErr);
      }

      set({ session, user: session?.user ?? null });

      // 4. If session active, sync remote profile
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (data) {
            let loaded = data as UserProfile;
            // Never overwrite with corrupt avatar URL
            const bestAvatar = isCleanAvatarUrl(cachedAvatarUrl)
              ? cachedAvatarUrl
              : isCleanAvatarUrl(loaded.avatar_url)
              ? loaded.avatar_url
              : null;

            loaded = { ...loaded, avatar_url: bestAvatar };
            set({ profile: loaded });
            AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loaded)).catch(() => {});
            if (bestAvatar) {
              AsyncStorage.setItem(AVATAR_CACHE_KEY, bestAvatar).catch(() => {});
            }
          }
        } catch (fetchErr) {
          console.warn('[Auth] Remote profile fetch deferred:', fetchErr);
        }
      }

      // 5. Setup auth state listener
      supabase.auth.onAuthStateChange(async (_e, s) => {
        set({ session: s, user: s?.user ?? null });
        if (s?.user) {
          try {
            const stored = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
            const cleanStored = isCleanAvatarUrl(stored) ? stored : null;

            const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
            if (data) {
              let loaded = data as UserProfile;
              const bestAvatar = cleanStored || (isCleanAvatarUrl(loaded.avatar_url) ? loaded.avatar_url : null);
              loaded = { ...loaded, avatar_url: bestAvatar };
              set({ profile: loaded });
              AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loaded)).catch(() => {});
              if (bestAvatar) {
                AsyncStorage.setItem(AVATAR_CACHE_KEY, bestAvatar).catch(() => {});
              }
            }
          } catch (profileErr) {
            console.warn('[Auth] State change profile fetch deferred:', profileErr);
          }
        }
      });
    } catch (e) {
      console.warn('[Auth Init Error]', e);
    } finally {
      set({ isInitialized: true });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      if (data.session) {
        set({ session: data.session, user: data.session.user });
      } else {
        const { data: sData } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (sData?.session) {
          set({ session: sData.session, user: sData.user });
        }
      }
      // Create initial local profile
      const newProfile: UserProfile = {
        id: data.user?.id || `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        avatar_url: null,
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        theme: 'system',
        notification_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({ profile: newProfile });
      AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile)).catch(() => {});
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Sign up failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      set({ session: data.session, user: data.user });
      
      // Fetch or initialize profile
      if (data.user) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (pData) {
          set({ profile: pData as UserProfile });
          AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(pData)).catch(() => {});
        }
      }
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Sign in failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut().catch(() => {});
      set({ session: null, user: null, profile: null });
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase());
      if (error) throw error;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Reset failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    set({ isLoading: true, error: null });

    // 1. Immediately update local state and cache so UI never loses avatar
    const updated = {
      ...(profile ?? DEFAULT_PROFILE),
      ...updates,
      updated_at: new Date().toISOString(),
    };
    set({ profile: updated });
    AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});

    // Save or clear dedicated avatar cache
    if (updates.avatar_url !== undefined) {
      if (isCleanAvatarUrl(updates.avatar_url)) {
        AsyncStorage.setItem(AVATAR_CACHE_KEY, updates.avatar_url!).catch(() => {});
      } else if (updates.avatar_url === null) {
        AsyncStorage.removeItem(AVATAR_CACHE_KEY).catch(() => {});
      }
    }

    // 2. Sync to Supabase in background
    try {
      const targetId = user?.id ?? profile?.id ?? DEFAULT_PROFILE.id;
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: targetId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (!error && data) {
        let persisted = data as UserProfile;
        const storedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
        if (isCleanAvatarUrl(storedAvatar)) {
          persisted = { ...persisted, avatar_url: storedAvatar };
        }
        set({ profile: persisted });
        AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(persisted)).catch(() => {});
      }
    } catch (e) {
      console.warn('[Profile Sync]', e);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: { user_id: user.id } });
      if (error) throw error;
      await supabase.auth.signOut().catch(() => {});
      set({ session: null, user: null, profile: null });
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
      await AsyncStorage.removeItem(AVATAR_CACHE_KEY).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
