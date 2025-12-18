import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

// 🔐 ADMINS DEFINITIVOS
const ADMIN_EMAILS = [
  'david@rfserveis.com',
  'rafael@rfserveis.com'
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = (user?.email || '').toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(email);

  const profile = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email,
      nombre: email.split('@')[0],
      role: isAdmin ? 'admin' : 'user',
      isAdmin
    };
  }, [user, email, isAdmin]);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!alive) return;
      setUser(session?.user || null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        isAuthenticated: !!user,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
