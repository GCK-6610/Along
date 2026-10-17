import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync } from '../lib/notifications';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasProfile: boolean;
  setHasProfile: (val: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  hasProfile: false,
  setHasProfile: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        try {
          await checkProfile(session.user);
        } catch (e) {
          console.warn('Error checking initial profile:', e);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setSession(session);
      if (session) {
        try {
          await checkProfile(session.user);
        } catch (e) {
          console.warn('Error checking profile on auth state change:', e);
        }
      } else {
        setHasProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, push_token, full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data && data.full_name && data.full_name.trim() !== '') {
        setHasProfile(true);
        // Register for Push Notifications safely
        try {
          const token = await registerForPushNotificationsAsync();
          if (token && data.push_token !== token) {
            await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
          }
        } catch (pushErr) {
          console.warn('Failed to update push token in profile:', pushErr);
        }
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      console.warn('Error in checkProfile:', err);
      setHasProfile(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      hasProfile,
      setHasProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
