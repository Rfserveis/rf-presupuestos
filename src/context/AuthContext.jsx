// AuthContext.jsx - Versión robusta
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
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
        }
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Timeout de seguridad - si no carga en 5 segundos, mostrar login
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout - showing login');
        setLoading(false);
      }
    }, 5000);

    initAuth();

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setUserProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, rol')
        .eq('id', userId)
        .single();

      if (error) {
        // Si no existe en users, crear perfil básico
        if (error.code === 'PGRST116') {
          console.log('User profile not found, using basic profile');
          setUserProfile({
            id: userId,
            nombre: 'Usuario',
            rol: 'usuario'
          });
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (data) {
        setUserProfile({
          ...data,
          nombre: data.name || 'Usuario'
        });
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      // Fallback profile
      setUserProfile({
        id: userId,
        nombre: 'Usuario',
        rol: 'usuario'
      });
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
      console.error('Sign in error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
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
      setError(err.message);
      return { success: false, error: err.message };
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
