import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

// Admins fijos por email (fallback robusto)
const ADMIN_EMAILS = new Set([
  'david@rfserveis.com',
  'rafael@rfserveis.com'
]);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  const email = (user?.email || '').toLowerCase().trim();
  const isAdmin = role === 'admin' || ADMIN_EMAILS.has(email);

  const profile = useMemo(() => {
    if (!user) return null;
    const e = (user.email || '').trim();
    return {
      id: user.id,
      email: e,
      nombre: e ? e.split('@')[0] : 'Usuario',
      role: isAdmin ? 'admin' : 'user',
      isAdmin
    };
  }, [user, isAdmin]);

  const fetchRole = async (u) => {
    if (!u?.id) {
      setRole('user');
      return;
    }

    // 1) Fallback inmediato por email (evita quedarte sin admin nunca)
    const e = (u.email || '').toLowerCase().trim();
    if (ADMIN_EMAILS.has(e)) {
      setRole('admin');
      return;
    }

    // 2) Intentar leer role desde user_roles
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', u.id)
        .maybeSingle();

      if (error) {
        console.error('[Auth] user_roles error:', error);
        setRole('user');
        return;
      }

      setRole(data?.role === 'admin' ? 'admin' : 'user');
    } catch (e2) {
      console.error('[Auth] fetchRole exception:', e2);
      setRole('user');
    }
  };

  useEffect(() => {
    let alive = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('[Auth] getSession error:', error);

        const u = data?.session?.user || null;
        if (!alive) return;

        setUser(u);
        await fetchRole(u);
      } catch (e) {
        console.error('[Auth] init exception:', e);
        if (!alive) return;
        setUser(null);
        setRole('user');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      if (!alive) return;
      setUser(u);
      await fetchRole(u);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
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
        role,
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
