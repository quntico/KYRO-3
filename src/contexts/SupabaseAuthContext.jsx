import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      // Bypass Auth: Mock user for development
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@kyro.test',
        user_metadata: { full_name: 'Developer' }
      };
      const mockSession = { user: mockUser, access_token: 'mock-token' };

      setSession(mockSession);
      setUser(mockUser);
      setLoading(false);
    };

    getSession();

    // We still listen for changes but the initial state is mocked
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};