// AuthContext.jsx - CORREGIDO para tu estructura de BD
// La tabla users tiene 'name' en lugar de 'nombre'

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (err) {
      console.error('Error verificando sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  // CORREGIDO: usa 'name' en lugar de 'nombre'
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, rol')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo perfil:', error);
      }
      
      // Mapear 'name' a 'nombre' para compatibilidad
      if (data) {
        setUserProfile({
          ...data,
          nombre: data.name // Alias para compatibilidad
        });
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Error fetchUserProfile:', err);
    }
  };

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        await fetchUserProfile(data.user.id);
      }

      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return userProfile?.rol === 'admin';
  };

  const isUsuario = () => {
    return userProfile?.rol === 'usuario' || !userProfile?.rol;
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signOut,
    isAdmin,
    isUsuario,
    checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
