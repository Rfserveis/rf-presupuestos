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
            <p className="text-sm text-gray-500">
              Benvingut/da, {currentUser.name || currentUser.email} (
              {currentUser.role === 'admin' ? 'Admin' : 'Usuari'})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Sortir
          </button>
        </div>
      </header>

      {/* SI ÉS ADMIN: panell complet */}
      {currentUser.role === 'admin' ? (
        <>
          {/* MENÚ DE NAVEGACIÓ ADMIN */}
          <nav className="bg-gray-100 border-b">
            <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
              <button
                onClick={() => setVistaActual('inici')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  vistaActual === 'inici'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Inici
              </button>

              <button
                onClick={() => setVistaActual('calculador')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  vistaActual === 'calculador'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Calculador de Vidres
              </button>

              <button
                disabled
                className="px-6 py-2 rounded-lg font-semibold text-gray-400 cursor-not-allowed"
              >
                Pressupostos (Pròximament)
              </button>
            </div>
          </nav>

          {/* CONTINGUT ADMIN */}
          <main className="max-w-6xl mx-auto px-4 py-6">
            {vistaActual === 'inici' && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-lg font-semibold mb-2">
                    Crear Nou Pressupost
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona la categoria del pressupost:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setVistaActual('calculador')}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-[1.01] text-left"
                    >
                      <h3 className="text-lg font-semibold mb-1">Vidres</h3>
                      <p className="text-sm text-blue-100">
                        Catàleg complet de vidres
                      </p>
                    </button>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Barandilla All Glass
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Barandilla Top Glass
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">Marquesines</h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Escaleras D&apos;opera
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">Escaleras RF</h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Escaleras Escamoteables
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-lg border p-4 text-sm text-gray-600">
                  <h4 className="font-semibold mb-2">ℹ️ Estat del Sistema</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ Login funcional</li>
                    <li>✅ Base de dades configurada</li>
                    <li>✅ Tarifes Vallesglass importades</li>
                    <li>✅ Calculador de vidres operatiu</li>
                    <li>7 categories disponibles (1 activa, 6 pròximament)</li>
                  </ul>
                </section>
              </div>
            )}

            {vistaActual === 'calculador' && <CalculadorVidres />}
          </main>
        </>
      ) : (
        // SI ÉS USUARI: només el calculador
        <main className="max-w-6xl mx-auto px-4 py-6">
          <CalculadorVidres />
        </main>
      )}
    </div>
  )
}

export default App
