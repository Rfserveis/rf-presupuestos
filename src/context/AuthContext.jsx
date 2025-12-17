// AuthContext.jsx - Version simplificada y robusta
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

// Crear contexto
const AuthContext = createContext(null);

// EMAILS CON ROL ADMINISTRADOR
const ADMIN_EMAILS = [
  'david@rfserveis.com',
  'rafael@rfserveis.com'
];

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
  const [loading, setLoading] = useState(true);

  // Verificar si es admin
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email?.toLowerCase()) : false;

  // Obtener perfil del usuario
  const getProfile = () => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      nombre: user.email?.split('@')[0] || 'Usuario',
      role: isAdmin ? 'admin' : 'usuario',
      isAdmin: isAdmin
    };
  };

  useEffect(() => {
    // Obtener sesion inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error obteniendo sesion:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Funcion de login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Funcion de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Valor del contexto
  const value = {
    user,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    profile: getProfile(),
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
