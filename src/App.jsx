import { useState, useEffect } from 'react'
import { authService } from './services/auth'
import CalculadorVidres from './components/CalculadorVidres'

function App() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vistaActual, setVistaActual] = useState('inici')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        setCurrentUser(user)
      } catch (err) {
        console.error('Error checking user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await authService.login(email, code)
      setCurrentUser(user)
      localStorage.setItem('rfAuthUser', JSON.stringify(user))
    } catch (err) {
      setError(err.message || 'Error al iniciar sessió')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setVistaActual('inici')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Carregant...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">RF Serveis</h1>
          <p className="text-gray-500 mb-6">Pressupostos</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="david@rfserveis.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codi d&apos;accés
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Entrant...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // DESPRÉS DEL LOGIN: ADMIN vs USUARI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              RF Serveis - Pressupostos
            </h1>
