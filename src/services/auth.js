import { supabase } from './supabase'

/**
 * SIGN IN - Iniciar sesión con Supabase
 */
export const signIn = async (email, password) => {
  try {
    // Obtener usuario de Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      throw new Error('Email o contraseña incorrectos')
    }

    if (!user.is_active) {
      throw new Error('Usuario inactivo')
    }

    // Verificar contraseña (comparación simple)
    // NOTA: En producción, usar bcrypt en backend
    const passwordMatch = user.password_hash.includes(password) || 
                         verifySimpleHash(password, user.password_hash)

    if (!passwordMatch) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Guardar en localStorage
    const userData = {
      id: user.id,
      email: user.email,
      nombre: user.name,
      role: user.role === 'admin' ? 'admin' : 'usuario'
    }

    localStorage.setItem('rfAuthUser', JSON.stringify(userData))
    localStorage.setItem('rfAuthToken', `token_${user.id}`)

    return {
      user: userData,
      profile: userData
    }
  } catch (error) {
    throw new Error(error.message || 'Error en login')
  }
}

/**
 * SIGN OUT - Cerrar sesión
 */
export const signOut = async () => {
  localStorage.removeItem('rfAuthUser')
  localStorage.removeItem('rfAuthToken')
  return true
}

/**
 * GET CURRENT USER - Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const stored = localStorage.getItem('rfAuthUser')
    if (!stored) {
      return null
    }

    const user = JSON.parse(stored)

    // Verificar que el token existe
    const token = localStorage.getItem('rfAuthToken')
    if (!token) {
      localStorage.removeItem('rfAuthUser')
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    localStorage.removeItem('rfAuthUser')
    localStorage.removeItem('rfAuthToken')
    return null
  }
}

/**
 * IS ADMIN - Verificar si es administrador
 */
export const isAdmin = (user) => {
  if (!user) return false
  return user.role === 'admin'
}

/**
 * HELPER: Verificar hash simple
 * (Para bcrypt hasheado, comparar patrones básicos)
 */
const verifySimpleHash = (password, hash) => {
  // Si el hash contiene la contraseña en plain text (fallback)
  if (hash.includes(password)) {
    return true
  }

  // Para bcrypt, en cliente es difícil verificar
  // Esto es una fallback simple
  return false
}

/**
 * GET ALL USERS (solo para admin)
 */
export const getAllUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return users
  } catch (error) {
    throw new Error(error.message || 'Error obteniendo usuarios')
  }
}

/**
 * CREATE USER (solo para admin)
 */
export const createUser = async (email, password, nombre, role = 'user') => {
  try {
    // Hash simple de la contraseña
    const passwordHash = `hash_${password}_${Date.now()}`

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name: nombre,
          role,
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return newUser
  } catch (error) {
    throw new Error(error.message || 'Error creando usuario')
  }
}

/**
 * UPDATE USER (solo para admin)
 */
export const updateUser = async (userId, updates) => {
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return updatedUser
  } catch (error) {
    throw new Error(error.message || 'Error actualizando usuario')
  }
}

/**
 * DELETE USER (solo para admin)
 */
export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return true
  } catch (error) {
    throw new Error(error.message || 'Error eliminando usuario')
  }
}
