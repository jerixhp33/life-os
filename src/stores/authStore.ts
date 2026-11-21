import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';
import type { UserProfile } from '../types';

const PROFILE_CACHE_KEY = 'lifeos_cached_user_profile';
const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

interface AuthState {
  session: Session|null; user: User|null; profile: UserProfile|null;
  isLoading: boolean; isInitialized: boolean; error: string|null;
  initialize:()=>Promise<void>; signUp:(email:string,password:string,fullName:string)=>Promise<void>;
  signIn:(email:string,password:string)=>Promise<void>; signOut:()=>Promise<void>;
  resetPassword:(email:string)=>Promise<void>; updateProfile:(updates:Partial<UserProfile>)=>Promise<void>;
  deleteAccount:()=>Promise<void>; clearError:()=>void;
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
  updated_at: new Date().toISOString()
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
      let cachedAvatarUrl: string | null = null;
      try {
        const storedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
        if (storedAvatar && storedAvatar.length > 5) {
          cachedAvatarUrl = storedAvatar;
        }
      } catch {}

      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            const initialProfile = {
              ...parsed,
              avatar_url: parsed.avatar_url || cachedAvatarUrl
            };
            set({ profile: initialProfile as UserProfile });
          }
        } else if (cachedAvatarUrl) {
          set({ profile: { ...DEFAULT_PROFILE, avatar_url: cachedAvatarUrl } });
        }
      } catch {}

      let { data: { session } } = await supabase.auth.getSession();
      
      // If no session exists, auto-authenticate with registered account
      if (!session) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: 'manikandanjanani67@gmail.com',
          password: 'nabikandan@17'
        }).catch(() => ({ data: { session: null } }));
        if (signInData?.session) {
          session = signInData.session;
        }
      }

      set({ session, user: session?.user ?? null });

      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          let loaded = data as UserProfile;
          if (!loaded.avatar_url && cachedAvatarUrl) {
            loaded = { ...loaded, avatar_url: cachedAvatarUrl };
          }
          set({ profile: loaded });
          AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loaded)).catch(() => {});
          if (loaded.avatar_url) {
            AsyncStorage.setItem(AVATAR_CACHE_KEY, loaded.avatar_url).catch(() => {});
          }
        } else {
          const { data: created } = await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email ?? 'manikandanjanani67@gmail.com',
            full_name: 'Manikandan',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            avatar_url: cachedAvatarUrl
          }).select().single();
          if (created) {
            let loaded = created as UserProfile;
            if (!loaded.avatar_url && cachedAvatarUrl) {
              loaded = { ...loaded, avatar_url: cachedAvatarUrl };
            }
            set({ profile: loaded });
            AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loaded)).catch(() => {});
            if (loaded.avatar_url) {
              AsyncStorage.setItem(AVATAR_CACHE_KEY, loaded.avatar_url).catch(() => {});
            }
          }
        }
      }

      supabase.auth.onAuthStateChange(async (_e, s) => {
        set({ session: s, user: s?.user ?? null });
        if (s?.user) {
          let fallbackAvatar: string | null = null;
          try {
            const storedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
            if (storedAvatar && storedAvatar.length > 5) {
              fallbackAvatar = storedAvatar;
            }
          } catch {}

          const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
          if (data) {
            let loaded = data as UserProfile;
            if (!loaded.avatar_url && fallbackAvatar) {
              loaded = { ...loaded, avatar_url: fallbackAvatar };
            }
            set({ profile: loaded });
            AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(loaded)).catch(() => {});
            if (loaded.avatar_url) {
              AsyncStorage.setItem(AVATAR_CACHE_KEY, loaded.avatar_url).catch(() => {});
            }
          }
        }
      });
    } catch (e) {
      console.error('[Auth]', e);
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
        options: { data: { full_name: fullName.trim() } }
      });
      if (error) throw error;
      if (data.session) {
        set({ session: data.session, user: data.session.user });
      } else {
        const { data: sData } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });
        if (sData?.session) {
          set({ session: sData.session, user: sData.user });
        }
      }
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
        password
      });
      if (error) throw error;
      set({ session: data.session, user: data.user });
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
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
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
    
    // Always update local profile and cache first so UI never loses avatar
    const updated = { ...(profile ?? DEFAULT_PROFILE), ...updates, updated_at: new Date().toISOString() };
    set({ profile: updated });
    AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated)).catch(() => {});

    // Save or clear dedicated avatar cache
    if (updates.avatar_url !== undefined) {
      if (updates.avatar_url && updates.avatar_url.length > 5) {
        AsyncStorage.setItem(AVATAR_CACHE_KEY, updates.avatar_url).catch(() => {});
      } else if (updates.avatar_url === null) {
        AsyncStorage.removeItem(AVATAR_CACHE_KEY).catch(() => {});
      }
    }

    try {
      const targetId = user?.id ?? DEFAULT_PROFILE.id;
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: targetId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (!error && data) {
        let persisted = data as UserProfile;
        if (!persisted.avatar_url) {
          try {
            const storedAvatar = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
            if (storedAvatar && storedAvatar.length > 5) {
              persisted = { ...persisted, avatar_url: storedAvatar };
            }
          } catch {}
        }
        set({ profile: persisted });
        AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(persisted)).catch(() => {});
        if (persisted.avatar_url) {
          AsyncStorage.setItem(AVATAR_CACHE_KEY, persisted.avatar_url).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[Profile Sync]', e);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteAccount: async () => {
    const { user } = get(); if (!user) throw new Error('Not authenticated');
    set({ isLoading:true });
    try { const { error } = await supabase.functions.invoke('delete-account',{ body:{ user_id:user.id } }); if (error) throw error; await supabase.auth.signOut(); set({ session:null, user:null, profile:null }); }
    finally { set({ isLoading:false }); }
  },
  clearError: () => set({ error:null }),
}));
