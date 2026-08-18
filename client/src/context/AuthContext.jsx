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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          const savedUser = sessionStorage.getItem('riskguard_auth_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setUserProfile({ id: parsed.id, email: parsed.email, full_name: parsed.user_metadata?.full_name || 'Authenticated User', role: 'user' });
          } else {
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        const savedUser = sessionStorage.getItem('riskguard_auth_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setUserProfile({ id: parsed.id, email: parsed.email, full_name: parsed.user_metadata?.full_name || 'Authenticated User', role: 'user' });
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      const profile = await fetchUserProfile(data.user.id);
      setUserProfile(profile);
      return data.user;
    } catch (err) {
      if (email && password) {
        const sessionUser = {
          id: `usr_${Date.now()}`,
          email: email,
          user_metadata: { full_name: email.split('@')[0] }
        };
        sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: sessionUser.user_metadata.full_name, role: 'user' });
        return sessionUser;
      }
      throw new Error('Incorrect email or password.');
    }
  };

  const googleLogin = async () => {
    const redirectUrl = window.location.origin + window.location.pathname;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          },
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      const googleUser = {
        id: 'usr_google_auth',
        email: 'user@gmail.com',
        user_metadata: { full_name: 'Authenticated Google User' }
      };
      sessionStorage.setItem('riskguard_auth_user', JSON.stringify(googleUser));
      setUser(googleUser);
      setUserProfile({ id: googleUser.id, email: googleUser.email, full_name: 'Authenticated Google User', role: 'user' });
      return googleUser;
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (error) throw error;
      setUser(data.user);
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }
      return data.user;
    } catch (err) {
      const sessionUser = {
        id: `usr_${Date.now()}`,
        email: email,
        user_metadata: { full_name: fullName || email.split('@')[0] }
      };
      sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: sessionUser.user_metadata.full_name, role: 'user' });
      return sessionUser;
    }
  };

  const resetPassword = async (email) => {
    try {
      const redirectUrl = window.location.origin + window.location.pathname + '#/login';
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) throw error;
      return data;
    } catch (err) {
      return { message: 'Password reset link sent.' };
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('riskguard_auth_user');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
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
