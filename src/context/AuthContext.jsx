
import React, { createContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'

/**
 * AuthContext - Gestiona autenticación completa
 * - signup: Registrar nuevo usuario
 * - login: Iniciar sesión
 * - logout: Cerrar sesión
 * - resetPassword: Solicitar reset de contraseña
 * - getCurrentUser: Obtener usuario actual
 * - isAdmin: Verificar si es administrador
 */

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Cargar usuario actual desde localStorage
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Error cargando usuario:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * SIGNUP - Registrar nuevo usuario
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {object} { success, message, user }
   */
  const signup = useCallback(async (email, password, name) => {
    try {
      setError(null)
      setLoading(true)

      // Validaciones
      if (!email || !password || !name) {
        throw new Error('Todos los campos son requeridos')
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      if (!email.includes('@')) {
        throw new Error('Email inválido')
      }

      // Verificar si usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('El email ya está registrado')
      }

      // Hashear contraseña (bcrypt simple en cliente)
      // NOTA: En producción, usar bcrypt en backend
      const passwordHash = await hashPassword(password)

      // Crear usuario en BD
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: passwordHash,
            name,
            role: 'user',
            is_active: true
          }
        ])
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Guardar en localStorage
      const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }

      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('userToken', `token_${newUser.id}`)
      setUser(userData)

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        user: userData
      }
    } catch (err) {
      const message = err.message || 'Error en signup'
      setError(message)
      return {
        success: false,
        message,
        user: null
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * LOGIN - Iniciar sesión
   * @param {string} email
   * @param {string} password
   * @returns {object} { success, message, user }
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null)
      setLoading(true)

      if (!email || !password) {
        throw new Error('Email y contraseña requeridos')
      }

      // Obtener usuario de BD
      const { data: foundUser, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (queryError || !foundUser) {
        throw new Error('Email o contraseña incorrectos')
      }

      if (!foundUser.is_active) {
        throw new Error('Usuario inactivo')
      }

      // Verificar contraseña (bcrypt simple)
      const passwordMatch = await verifyPassword(password, foundUser.password_hash)

      if (!passwordMatch) {
        throw new Error('Email o contraseña incorrectos')
      }

      // Preparar datos usuario
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role
      }

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('userToken', `token_${foundUser.id}`)
      setUser(userData)

      return {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: userData
      }
    } catch (err) {
      const message = err.message || 'Error en login'
      setError(message)
      return {
        success: false,
        message,
        user: null
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * LOGOUT - Cerrar sesión
   */
  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
    setUser(null)
    setError(null)
  }, [])

  /**
   * RESET PASSWORD - Solicitar cambio de contraseña
   * @param {string} email
   * @returns {object} { success, message }
   */
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null)
      setLoading(true)

      if (!email) {
        throw new Error('Email requerido')
      }

      // Verificar que el email existe
      const { data: foundUser, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (queryError || !foundUser) {
        // Seguridad: No revelar si el email existe o no
        return {
          success: true,
          message: 'Si el email existe, recibirá un link de recuperación'
        }
      }

      // Generar token único
      const resetToken = generateToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

      // Guardar token en BD
      await supabase
        .from('password_reset_tokens')
        .insert([
          {
            user_id: foundUser.id,
            token: resetToken,
            expires_at: expiresAt.toISOString()
          }
        ])

      // NOTA: En producción, enviar email aquí
      console.log(`Reset link: /reset-password/${resetToken}`)

      return {
        success: true,
        message: 'Si el email existe, recibirá un link de recuperación'
      }
    } catch (err) {
      const message = err.message || 'Error en reset password'
      setError(message)
      return {
        success: false,
        message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * NEW PASSWORD - Cambiar contraseña con token
   * @param {string} token
   * @param {string} newPassword
   * @returns {object} { success, message }
   */
  const newPassword = useCallback(async (token, newPassword) => {
    try {
      setError(null)
      setLoading(true)

      if (!token || !newPassword) {
        throw new Error('Token y contraseña requeridos')
      }

      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // Buscar token válido
      const { data: resetToken, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .single()

      if (tokenError || !resetToken) {
        throw new Error('Token inválido')
      }

      // Verificar si expiró
      const now = new Date()
      const expiresAt = new Date(resetToken.expires_at)

      if (now > expiresAt) {
        throw new Error('Token expirado')
      }

      if (resetToken.used_at) {
        throw new Error('Token ya fue utilizado')
      }

      // Hashear nueva contraseña
      const passwordHash = await hashPassword(newPassword)

      // Actualizar contraseña usuario
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', resetToken.user_id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Marcar token como usado
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', resetToken.id)

      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      }
    } catch (err) {
      const message = err.message || 'Error al cambiar contraseña'
      setError(message)
      return {
        success: false,
        message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * GET CURRENT USER
   */
  const getCurrentUser = useCallback(() => {
    return user
  }, [user])

  /**
   * IS ADMIN - Verificar si es administrador
   */
  const isAdmin = useCallback(() => {
    return user?.role === 'admin'
  }, [user])

  /**
   * FUNCIONES HELPER
   */

  // Hash simple de contraseña (NOTA: usar bcrypt en producción)
  const hashPassword = async (password) => {
    // Simulación simple. En producción usar bcrypt backend
    return `hash_${password}_${Date.now()}`
  }

  // Verificar contraseña
  const verifyPassword = async (password, hash) => {
    // Simulación simple
    // En producción comparar con bcrypt en backend
    return hash.includes(password)
  }

  // Generar token aleatorio
  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Value del contexto
  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    newPassword,
    getCurrentUser,
    isAdmin
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook personalizado para usar AuthContext
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
