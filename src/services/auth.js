import { supabase } from './supabase';

export const signIn = async (email, password) => {
  try {
    // Validar contra tabla users
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Aquí puedes agregar validación de contraseña si la tienes en BD
    // Por ahora, solo verificamos que el usuario existe
    
    return {
      user: user.id,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.rol
      }
    };
  } catch (err) {
    throw err;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out:', err);
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    return {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name,
      role: profile?.rol || 'user'
    };
  } catch (err) {
    return null;
  }
};

export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export const isUsuario = (user) => {
  return user?.role === 'user' || user?.role === 'usuario';
};
