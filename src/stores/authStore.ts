import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import type { UserProfile } from '../types';
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
      let { data: { session } } = await supabase.auth.getSession();
      
      // If no session exists, auto-authenticate with the user's registered account
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
          set({ profile: data as UserProfile });
        } else {
          // If profile row is missing, insert it
          const { data: created } = await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email ?? 'manikandanjanani67@gmail.com',
            full_name: 'Manikandan',
            currency: 'INR',
            timezone: 'Asia/Kolkata'
          }).select().single();
          if (created) set({ profile: created as UserProfile });
        }
      }

      supabase.auth.onAuthStateChange(async (_e, s) => {
        set({ session: s, user: s?.user ?? null });
        if (s?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
          if (data) set({ profile: data as UserProfile });
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
        // Auto-sign in if email confirmation was bypassed or already exists
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
    
    // Always update local profile first
    const updated = { ...(profile ?? DEFAULT_PROFILE), ...updates, updated_at: new Date().toISOString() };
    set({ profile: updated });

    try {
      const targetId = user?.id ?? DEFAULT_PROFILE.id;
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: targetId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (!error && data) {
        set({ profile: data as UserProfile });
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
