// AuthContext.jsx - Roles desde Supabase (public.user_roles)
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

// Crear contexto
const AuthContext = createContext(null);

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const getProfile = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      nombre: user.email?.split('@')[0] || 'Usuario',
      role: isAdmin ? 'admin' : 'usuario',
      isAdmin: isAdmin,
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

      setRole(data?.role === 'admin' ? 'admin' : 'user');
    } catch (e) {
      console.error('Error inesperado leyendo rol:', e);
      setRole('user');
    }
  };

  // Obtener sesion inicial
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Error getSession:', error);

        const u = session?.user || null;
        setUser(u);
        await fetchRole(u);
      } catch (e) {
        console.error('Error inicializando auth:', e);
        setUser(null);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      setUser(u);
      await fetchRole(u);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Login
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

  // Logout
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
    setLoading(false);
  };

  const value = {
    user,
    isAdmin,
    loading,
    isAuthenticated: !!user,
    profile: getProfile,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
