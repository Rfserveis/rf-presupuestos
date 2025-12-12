import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwtsdtjiwfvurquddfqd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dHNkdGppd2Z2dXJxdWRkZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODMwNTIsImV4cCI6MjA4MDE1OTA1Mn0.aE9OqNLORZs1HhQsjfqNymabkNQJizAkwVanx0D19NU'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signIn = async (email, password) => {
  try {
    console.log('Intentando login con:', email)
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Respuesta Supabase:', { data, error })

    if (error) {
      console.error('Error Supabase:', error)
      throw new Error('Usuario no encontrado')
    }

    if (!data) {
      throw new Error('Usuario no encontrado')
    }

    // Comparar contraseña simple
    if (data.password_hash !== password) {
      throw new Error('Contraseña incorrecta')
    }

    const userData = {
      id: data.id,
      email: data.email,
      nombre: data.name,
      role: data.role === 'admin' ? 'admin' : 'usuario'
    }

    localStorage.setItem('rfAuthUser', JSON.stringify(userData))
    localStorage.setItem('rfAuthToken', `token_${data.id}`)

    console.log('Login exitoso:', userData)

    return {
      user: userData,
      profile: userData
    }
  } catch (error) {
    console.error('Error en signIn:', error)
    throw error
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
    const user = JSON.parse(stored)
    const token = localStorage.getItem('rfAuthToken')
    if (!token) {
      localStorage.removeItem('rfAuthUser')
      return null
    }
    return user
  } catch (error) {
    console.error('Error en getCurrentUser:', error)
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
