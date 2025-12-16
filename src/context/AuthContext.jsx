// AuthContext.jsx - Versión simplificada
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
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Crear perfil básico desde los datos de auth
        setUserProfile({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          rol: session.user.email === 'admin@rfserveis.com' ? 'admin' : 'usuario'
        });
      }
      setLoading(false);
    });

    // Listener para cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (session?.user) {
        setUser(session.user);
        setUserProfile({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.email?.split('@')[0] || 'Usuario',
          rol: session.user.email === 'admin@rfserveis.com' ? 'admin' : 'usuario'
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // El onAuthStateChange se encargará de setear user y profile
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      return { success: false, error: err.message };
    }
  };

  const isAdmin = () => {
    return userProfile?.rol === 'admin';
  };

  const isUsuario = () => {
    return userProfile?.rol === 'usuario' || !userProfile?.rol;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      signIn,
      signOut,
      isAdmin,
      isUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
