import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * LoginForm - Componente con 3 tabs:
 * 1. Login
 * 2. Signup (registrar nuevo usuario)
 * 3. Reset Password (recuperar contraseña)
 */

export const LoginForm = () => {
  const { login, signup, resetPassword } = useAuth()
  

  // Estados
  const [tab, setTab] = useState('login') // 'login' | 'signup' | 'reset'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // LOGIN
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // SIGNUP
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')
  const [signupName, setSignupName] = useState('')

  // RESET
  const [resetEmail, setResetEmail] = useState('')

  /**
   * HANDLE LOGIN
   */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await login(loginEmail, loginPassword)

    if (result.success) {
      setSuccess('Inicio de sesión exitoso')
      setTimeout(() => {
        window.location.href = '/dashboard''/dashboard')
      }, 1000)
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  /**
   * HANDLE SIGNUP
   */
  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Validaciones
    if (signupPassword !== signupPasswordConfirm) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    const result = await signup(signupEmail, signupPassword, signupName)

    if (result.success) {
      setSuccess('Cuenta creada exitosamente. Iniciando sesión...')
      setTimeout(() => {
        window.location.href = '/dashboard''/dashboard')
      }, 1500)
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  /**
   * HANDLE RESET PASSWORD
   */
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await resetPassword(resetEmail)

    if (result.success) {
      setSuccess(result.message)
      setResetEmail('')
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">RF Presupuestos</h1>
          <p className="text-gray-600 mt-2">Sistema de presupuestos</p>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => {
              setTab('login')
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-2 font-semibold transition ${
              tab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setTab('signup')
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-2 font-semibold transition ${
              tab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Registrarse
          </button>
          <button
            onClick={() => {
              setTab('reset')
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-2 font-semibold transition ${
              tab === 'reset'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Recuperar
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* TAB: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Demo users:
              <br />
              📧 rafael@rfserveis.com (admin)
              <br />
              📧 igor@rfserveis.com (user)
              <br />
              🔑 Contraseña: Rf123
            </p>
          </form>
        )}

        {/* TAB: SIGNUP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={signupPasswordConfirm}
                onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>

            <p className="text-center text-xs text-gray-600">
              El registro es directo, sin validación de email.
            </p>
          </form>
        )}

        {/* TAB: RESET PASSWORD */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
            </button>

            <p className="text-center text-xs text-gray-600">
              Recibirás un link para cambiar tu contraseña.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
