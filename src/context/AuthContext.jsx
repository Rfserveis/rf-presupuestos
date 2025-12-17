// AuthContext.jsx - Roles desde Supabase (user_roles)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  // Perfil simple que usa la app (nombre/rol)
  const profile = useMemo(() => {
    if (!user) return null;
    const email = user.email || '';
    const nombre = email ? email.split('@')[0] : 'Usuario';
    return {
      id: user.id,
      email,
      nombre,
      role: isAdmin ? 'admin' : 'usuario',
      isAdmin
    };
  }, [user, isAdmin]);

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
        console.error('Error leyendo user_roles:', error);
        setRole('user');
        return;
      }

      if (!data?.role) {
        // Si no hay rol guardado, por defecto es user
        setRole('user');
        return;
      }

      setRole(data.role);
    } catch (e) {
      console.error('Error inesperado leyendo rol:', e);
      setRole('user');
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user || null;
      setUser(u);
      await fetchRole(u);
    } catch (e) {
      console.error('Error obteniendo sesión:', e);
      setUser(null);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

  const value = {
    user,
    profile,
    isAdmin,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
