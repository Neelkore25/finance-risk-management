import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(userId) {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  useEffect(() => {
    async function initSession() {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password // Exact password (unmodified, untrimmed)
    });

    if (error) throw error;

    setUser(data.user);
    const profile = await fetchUserProfile(data.user.id);
    setUserProfile(profile);
    return data;
  };

  const register = async (email, password, fullName) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password, // Exact password
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        throw new Error('Supabase email rate limit exceeded. Please disable "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email to allow instant signups.');
      }
      throw error;
    }
    return data;
  };

  const googleLogin = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Auth is not configured.');
    }
    const redirectUrl = window.location.origin + window.location.pathname;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Auth is not configured.');
    }
    const redirectUrl = window.location.origin + window.location.pathname + '#/login';
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // ignore
      }
    }
    setUser(null);
    setUserProfile(null);
  };

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Authenticated User');

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        displayName,
        loading,
        login,
        googleLogin,
        register,
        resetPassword,
        logout,
        isConfigured: isSupabaseConfigured()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
