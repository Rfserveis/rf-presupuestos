import { supabase } from './supabase'

/**
 * Sistema de autenticación mejorado con soporte para roles
 * Usuarios pueden ser 'usuario' o 'admin'
 */

export const signIn = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email y contraseña son obligatorios')
    }

    // Buscar usuario en la tabla users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, nombre, rol, activo')
      .eq('email', email.toLowerCase())
      .eq('activo', true)
      .single()

    if (userError || !user) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Validar contraseña (en un escenario real, esto sería un hash bcrypt)
    // Por ahora, asumimos que Supabase Auth maneja las contraseñas
    // O usamos una tabla de password hashes
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })

    if (authError) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Preparar datos del usuario para almacenar
    const userData = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol || 'usuario',
      autenticado: true
    }

    // Guardar en localStorage
    localStorage.setItem('rfAuthUser', JSON.stringify(userData))

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
  try {
    await supabase.auth.signOut()
    localStorage.removeItem('rfAuthUser')
  } catch (error) {
    console.error('Error en signOut:', error)
    localStorage.removeItem('rfAuthUser')
  }
}

export const getCurrentUser = async () => {
  try {
    const userStr = localStorage.getItem('rfAuthUser')
    if (!userStr) return null
    
    const user = JSON.parse(userStr)
    
    // Validar que el usuario sigue siendo válido en BD
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, nombre, rol, activo')
      .eq('id', user.id)
      .single()

    if (error || !dbUser || !dbUser.activo) {
      localStorage.removeItem('rfAuthUser')
      return null
    }

    return {
      ...user,
      rol: dbUser.rol || 'usuario'
    }
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    localStorage.removeItem('rfAuthUser')
    return null
  }
}

export const isAdmin = (user) => {
  return user && user.rol === 'admin'
}

export const isUsuario = (user) => {
  return user && user.rol === 'usuario'
}

export const cambiarContrasena = async (emailUsuario, contrasenaAntigua, contrasenaNueva) => {
  try {
    // Primero verificar que la contraseña antigua es correcta
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: emailUsuario,
      password: contrasenaAntigua
    })

    if (verifyError) {
      throw new Error('Contraseña actual incorrecta')
    }

    // Cambiar contraseña
    const { error } = await supabase.auth.updateUser({
      password: contrasenaNueva
    })

    if (error) {
      throw error
    }

    return { exito: true, mensaje: 'Contraseña actualizada correctamente' }
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    throw error
  }
}
