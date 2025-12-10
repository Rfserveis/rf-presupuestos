// ============================================================
// AUTH.JS - CONECTADO A SUPABASE
// ============================================================
// Valida usuarios contra la tabla "users" de Supabase
// ============================================================

import { supabase } from './supabase';

// Iniciar sesión - valida contra BD
export const signIn = async (email, password) => {
  try {
    // Buscar usuario en la tabla users de Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar contraseña
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }

    // Preparar objeto de usuario para guardar
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.rol  // 'admin' o 'user'
    };

    // Guardar en localStorage
    localStorage.setItem('rfAuthUser', JSON.stringify(userProfile));

    return {
      user: user.id,
      profile: userProfile
    };

  } catch (err) {
    console.error('Error en signIn:', err);
    throw err;
  }
};

// Cerrar sesión
export const signOut = async () => {
  localStorage.removeItem('rfAuthUser');
};

// Obtener usuario actual desde localStorage
export const getCurrentUser = async () => {
  const stored = localStorage.getItem('rfAuthUser');
  return stored ? JSON.parse(stored) : null;
};

// Verificar si es admin
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

// Verificar si es usuario normal
export const isUsuario = (user) => {
  return user?.role === 'user';
};

// ============================================================
// FUNCIONES ADICIONALES PARA GESTIÓN DE USUARIOS
// ============================================================

// Obtener todos los usuarios (solo para admins)
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, rol, activo, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Crear nuevo usuario (solo para admins)
export const createUser = async (email, password, name, rol = 'user') => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password, name, rol, activo: true }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Actualizar usuario (solo para admins)
export const updateUser = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Desactivar usuario (solo para admins)
export const deactivateUser = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
