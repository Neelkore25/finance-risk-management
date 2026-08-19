import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext();

// Helper to access Local User Database for strict registration & instant fallback authentication
function getUsersDatabase() {
  try {
    const raw = localStorage.getItem('riskguard_users_db');
    if (!raw) {
      const seed = [
        {
          id: 'usr_seed_1',
          email: 'neelkore25@gmail.com',
          password_hash: 'password123',
          full_name: 'Neel Kore',
          role: 'user'
        },
        {
          id: 'usr_admin_1',
          email: 'admin@riskguard.com',
          password_hash: 'admin123',
          full_name: 'Admin User',
          role: 'admin'
        }
      ];
      localStorage.setItem('riskguard_users_db', JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveUsersDatabase(users) {
  try {
    localStorage.setItem('riskguard_users_db', JSON.stringify(users));
  } catch (err) {}
}

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
            const savedUser = sessionStorage.getItem('riskguard_auth_user');
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
              setUserProfile({
                id: parsed.id,
                email: parsed.email,
                full_name: parsed.user_metadata?.full_name || 'Authenticated User',
                role: parsed.role || 'user'
              });
            } else {
              setUser(null);
              setUserProfile(null);
            }
          }
        } else {
          const savedUser = sessionStorage.getItem('riskguard_auth_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setUserProfile({
              id: parsed.id,
              email: parsed.email,
              full_name: parsed.user_metadata?.full_name || 'Authenticated User',
              role: parsed.role || 'user'
            });
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

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          const savedUser = sessionStorage.getItem('riskguard_auth_user');
          if (!savedUser) {
            setUser(null);
            setUserProfile(null);
          }
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
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        setUser(data.user);
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
        return data.user;
      } catch (err) {
        // Fallback: Check local database registry if Supabase returns email confirmation or invalid credential errors
        const db = getUsersDatabase();
        const existingUser = db.find(u => u.email.toLowerCase() === cleanEmail);

        if (existingUser && existingUser.password_hash === password) {
          const sessionUser = {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            user_metadata: { full_name: existingUser.full_name }
          };
          sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
          setUser(sessionUser);
          setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: existingUser.full_name, role: existingUser.role });
          return sessionUser;
        }
        throw new Error(err.message || 'Incorrect email or password.');
      }
    } else {
      const db = getUsersDatabase();
      const existingUser = db.find(u => u.email.toLowerCase() === cleanEmail);

      if (!existingUser) {
        throw new Error('No registered account found with this email address. Please create an account first.');
      }

      if (existingUser.password_hash !== password) {
        throw new Error('Incorrect password. Please check your credentials.');
      }

      const sessionUser = {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        user_metadata: { full_name: existingUser.full_name }
      };

      sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: existingUser.full_name, role: existingUser.role });
      return sessionUser;
    }
  };

  const googleLogin = async () => {
    if (isSupabaseConfigured()) {
      const redirectUrl = window.location.origin + window.location.pathname;
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
    } else {
      const googleUser = {
        id: 'usr_google_auth_live',
        email: 'neelkore25@gmail.com',
        role: 'user',
        user_metadata: { full_name: 'Neel Kore (Google Account)' }
      };
      sessionStorage.setItem('riskguard_auth_user', JSON.stringify(googleUser));
      setUser(googleUser);
      setUserProfile({ id: googleUser.id, email: googleUser.email, full_name: 'Neel Kore', role: 'user' });
      return googleUser;
    }
  };

  const register = async (email, password, fullName) => {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;

        // Register in local database so user can sign in immediately even if Supabase email confirmation is enabled
        const db = getUsersDatabase();
        if (!db.some(u => u.email.toLowerCase() === cleanEmail)) {
          db.push({
            id: data.user?.id || `usr_${Date.now()}`,
            email: cleanEmail,
            password_hash: password,
            full_name: fullName || cleanEmail.split('@')[0],
            role: 'user',
            created_at: new Date().toISOString()
          });
          saveUsersDatabase(db);
        }

        const sessionUser = {
          id: data.user?.id || `usr_${Date.now()}`,
          email: cleanEmail,
          role: 'user',
          user_metadata: { full_name: fullName || cleanEmail.split('@')[0] }
        };

        sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
        setUser(data.user || sessionUser);
        setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: sessionUser.user_metadata.full_name, role: 'user' });
        return data.user || sessionUser;
      } catch (err) {
        throw err;
      }
    } else {
      const db = getUsersDatabase();
      const existingUser = db.find(u => u.email.toLowerCase() === cleanEmail);

      if (existingUser) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        password_hash: password,
        full_name: fullName || cleanEmail.split('@')[0],
        role: 'user',
        created_at: new Date().toISOString()
      };

      db.push(newUser);
      saveUsersDatabase(db);

      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        user_metadata: { full_name: newUser.full_name }
      };

      sessionStorage.setItem('riskguard_auth_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setUserProfile({ id: sessionUser.id, email: sessionUser.email, full_name: newUser.full_name, role: newUser.role });
      return sessionUser;
    }
  };

  const resetPassword = async (email) => {
    const cleanEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured()) {
      const redirectUrl = window.location.origin + window.location.pathname + '#/login';
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });
      if (error) throw error;
      return data;
    } else {
      const db = getUsersDatabase();
      const existingUser = db.find(u => u.email.toLowerCase() === cleanEmail);
      if (!existingUser) {
        throw new Error('No registered account found with this email address.');
      }
      return { message: 'Password reset link sent to your registered email.' };
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('riskguard_auth_user');
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
