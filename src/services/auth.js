import { supabase } from './supabase'

export const signIn = async (email, password) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      throw new Error('Email no encontrado')
    }

    // Comparación simple de contraseña
    if (user.password_hash !== password) {
      throw new Error('Contraseña incorrecta')
    }

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

export const signOut = async () => {
  localStorage.removeItem('rfAuthUser')
  localStorage.removeItem('rfAuthToken')
  return true
}

export const getCurrentUser = async () => {
  try {
    const stored = localStorage.getItem('rfAuthUser')
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    localStorage.removeItem('rfAuthUser')
    localStorage.removeItem('rfAuthToken')
    return null
  }
}

export const isAdmin = (user) => {
  if (!user) return false
  return user.role === 'admin'
}

export const getAllUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return users
  } catch (error) {
    throw new Error(error.message || 'Error obteniendo usuarios')
  }
}

export const createUser = async (email, password, nombre, role = 'user') => {
  try {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: password,
          name: nombre,
          role,
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return newUser
  } catch (error) {
    throw new Error(error.message || 'Error creando usuario')
  }
}

export const updateUser = async (userId, updates) => {
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return updatedUser
  } catch (error) {
    throw new Error(error.message || 'Error actualizando usuario')
  }
}

export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw new Error(error.message)
    return true
  } catch (error) {
    throw new Error(error.message || 'Error eliminando usuario')
  }
}
