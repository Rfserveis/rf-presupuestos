import { supabase } from './supabase'

export const authService = {
  async login(email, code) {
    // Canvia el codi d'accés aquí
    if (code !== 'Rf123') {
      throw new Error("Codi d'accés incorrecte")
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      throw new Error('Email no autoritzat')
    }

    return user
  },

  async getCurrentUser() {
    const userStr = localStorage.getItem('rfAuthUser')
    if (!userStr) return null
    return JSON.parse(userStr)
  },

  logout() {
    localStorage.removeItem('rfAuthUser')
  },
}

