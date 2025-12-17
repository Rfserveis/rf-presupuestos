import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // admin | user
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const profile = useMemo(() => {
    if (!user) return null;
    const email = user.email || '';
    return {
      id: user.id,
      email,
      nombre: email ? email.split('@')[0] : 'Usuario',
      // OJO: aquí mostramos el rol real, no "usuario" fijo
      role: role,
      isAdmin,
    };
  }, [user, role, isAdmin]);

  const fetchRole = async (u) => {
    if (!u?.id) {
      setRole('user');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', u.id)
        .maybeSingle();

      if (error) {
        console.error('[user_roles] error:', error);
        setRole('user');
        return;
      }

      setRole(data?.role === 'admin' ? 'admin' : 'user');
    } catch (e) {
      console.error('Error inesperado leyendo rol:', e);
      setRole('user');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('[getSession] error:', error);

        const u = session?.user || null;
        setUser(u);
        await fetchRole(u);
      } catch (e) {
        console.error('Error init auth:', e);
        setUser(null);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      const u = session?.user || null;
      setUser(u);
      await fetchRole(u);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error };
    }
    const u = data?.user || data?.session?.user || null;
    setUser(u);
    await fetchRole(u);
    setLoading(false);
    return { data };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
