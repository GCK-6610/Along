import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync } from '../lib/notifications';

export interface UserProfileData {
  id: string;
  full_name?: string | null;
  gender?: string | null;
  base_latitude?: number | null;
  base_longitude?: number | null;
  base_location_name?: string | null;
  avatar_url?: string | null;
  push_token?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  hasProfile: boolean;
  setHasProfile: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  hasProfile: false,
  setHasProfile: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  const checkProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, push_token, full_name, gender, base_latitude, base_longitude, base_location_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as UserProfileData);
      } else {
        setProfile(null);
      }
      
      const isComplete = Boolean(
        data &&
        data.full_name &&
        data.full_name.trim() !== '' &&
        data.full_name !== 'New User' &&
        data.gender &&
        data.gender !== 'unspecified'
      );

      if (isComplete) {
        setHasProfile(true);
        // Register for Push Notifications safely
        try {
          const token = await registerForPushNotificationsAsync();
          if (token && data?.push_token !== token) {
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
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await checkProfile(session.user);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        try {
          await checkProfile(initialSession.user);
        } catch (e) {
          console.warn('Error checking initial profile:', e);
        }
        setSession(initialSession);
      } else {
        setSession(null);
        setProfile(null);
        setHasProfile(false);
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, newSession: Session | null) => {
      setLoading(true);
      if (newSession) {
        try {
          await checkProfile(newSession.user);
        } catch (e) {
          console.warn('Error checking profile on auth state change:', e);
        }
        setSession(newSession);
      } else {
        setSession(null);
        setProfile(null);
        setHasProfile(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setHasProfile(false);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      hasProfile,
      setHasProfile,
      refreshProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

