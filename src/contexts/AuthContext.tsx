import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, db } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  minutes_used: number;
  subscription?: string;
  razorpayCustomerId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  saveProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'credits' | 'minutes_used' | 'subscription'>>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapProfile = (profile: any, authId?: string): User => ({
    id: profile?.id || authId || '',
    email: profile?.email || '',
    name: profile?.name || profile?.email?.split('@')[0] || '',
    credits: profile?.credits ?? 0,
    minutes_used: profile?.minutes_used ?? 0,
    subscription: profile?.subscription_plan,
    razorpayCustomerId: profile?.razorpay_customer_id,
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          try {
            const profile = await db.getUser(authUser.id);
            if (!mounted) return;
            setUser(mapProfile(profile, authUser.id));
          } catch (err) {
            if (!mounted) return;
            setUser({ id: authUser.id, email: authUser.email || '', name: authUser.user_metadata?.full_name || (authUser.email || '').split('@')[0] || 'User', credits: 0, minutes_used: 0 });
          }
        } else {
          if (!mounted) return;
          setUser(null);
        }
      } catch (err) {
        console.error('Auth init error', err);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setIsLoading(true);
      try {
        if (session?.user) {
          try {
            const profile = await db.getUser(session.user.id);
            setUser(mapProfile(profile, session.user.id));
          } catch (err) {
            setUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.full_name || (session.user.email || '').split('@')[0] || 'User', credits: 0, minutes_used: 0 });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('onAuthStateChange handler error', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      try { listener?.subscription?.unsubscribe?.(); } catch (e) { /* ignore */ }
    };
  }, []);

  const saveProfile = async (updates: Partial<Pick<User, 'name' | 'email' | 'credits' | 'minutes_used' | 'subscription'>>)
    : Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };
    const prev = user;
    setUser({ ...user, ...updates });

    try {
      await db.updateUserProfile(user.id, updates as any);
      try {
        const fresh = await db.getUser(user.id);
        setUser(mapProfile(fresh, user.id));
      } catch (e) {
        // ignore
      }
      toast({ title: 'Profile updated', description: 'Your profile was saved.' });
      return { success: true };
    } catch (err: any) {
      console.error('saveProfile failed', err);
      setUser(prev);
      toast({ title: 'Update failed', description: 'Unable to save profile. Changes were reverted.' });
      return { success: false, message: err?.message || 'Failed to save' };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Supabase login error', error);
        return false;
      }
      if (data?.user) {
        try {
          const profile = await db.getUser(data.user.id);
          setUser(mapProfile(profile, data.user.id));
        } catch (err) {
          setUser({ id: data.user.id, email: data.user.email || '', name: data.user.user_metadata?.full_name || (data.user.email || '').split('@')[0] || 'User', credits: 0, minutes_used: 0 });
        }
      }
      return true;
    } catch (err) {
      console.error('login error', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) {
        console.error('Supabase signup error', error);
        return { success: false, message: error.message };
      }

      // If user object is available, create profile in DB using auth id
      const authId = data?.user?.id;
      if (authId) {
        try {
          await db.createUser({
            firebase_uid: authId,
            email,
            name,
            credits: 10,
            minutes_used: 0,
          });
        } catch (dbErr) {
          console.warn('Failed to create DB profile after signup', dbErr);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('signup error', err);
      return { success: false, message: err?.message || 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch (err) { console.warn('logout error', err); }
  };

  const value: AuthContextType = { user, login, signup, logout, saveProfile, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};