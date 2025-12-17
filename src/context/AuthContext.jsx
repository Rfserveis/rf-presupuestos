// AuthContext.jsx - Contexto de autenticacion con roles por email
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

// EMAILS CON ROL ADMINISTRADOR
const ADMIN_EMAILS = [
  'david@rfserveis.com',
  'rafael@rfserveis.com'
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determinar rol segun email
  const getRoleByEmail = (email) => {
    if (!email) return 'usuario';
    return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'usuario';
  };

  // Crear perfil desde sesion
  const createProfileFromSession = (session) => {
    if (!session?.user) return null;
    
    const email = session.user.email;
    const role = getRoleByEmail(email);
    
    return {
      id: session.user.id,
      email: email,
      role: role,
      nombre: email.split('@')[0],
      isAdmin: role === 'admin'
    };
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Obtener sesion actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesion:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          setProfile(createProfileFromSession(session));
        }
      } catch (err) {
        console.error('Error en initAuth:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Escuchar cambios de autenticacion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            setProfile(createProfileFromSession(session));
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login con email y password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error en login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.isAdmin || false,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
