import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { signIn, signOut, getCurrentUser } from './services/auth';
import CalculadorVidres from './components/CalculadorVidres';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vistaActual, setVistaActual] = useState('inici');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, profile } = await signIn(email, password);
      setCurrentUser(profile);
    } catch (err) {
      setError(err.message || 'Error al iniciar sessió');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setVistaActual('inici');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregant...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🪟</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">RF Serveis</h1>
            <p className="text-gray-600 mt-2">Pressupostos</p>
          </div>

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
                Contrasenya
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrant...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
              <span className="text-2xl">🪟</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">RF Serveis - Pressupostos</h1>
              <p className="text-sm text-gray-600">Benvingut/da, {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Sortir
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setVistaActual('inici')}
              className={`px-6 py-3 font-semibold transition ${
                vistaActual === 'inici'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 Inici
            </button>
            <button
              onClick={() => setVistaActual('calculador')}
              className={`px-6 py-3 font-semibold transition ${
                vistaActual === 'calculador'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🪟 Calculador de Vidres
            </button>
            <button
              className="px-6 py-3 text-gray-400 cursor-not-allowed"
              disabled
            >
              📋 Pressupostos (Pròximament)
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {vistaActual === 'inici' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">📊 Crear Nou Pressupost</h2>
            <p className="text-gray-600 mb-6">Selecciona la categoria del pressupost:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <button
                onClick={() => setVistaActual('calculador')}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="text-5xl mb-3">🪟</div>
                <h3 className="text-xl font-bold mb-2">Vidres</h3>
                <p className="text-blue-100 text-sm">Catàleg complet</p>
              </button>

              <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🛡️</div>
                <h3 className="text-xl font-bold mb-2">Barandilla All Glass</h3>
                <p className="text-purple-100 text-sm">Pròximament</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🔒</div>
                <h3 className="text-xl font-bold mb-2">Barandilla Top Glass</h3>
                <p className="text-indigo-100 text-sm">Pròximament</p>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">☂️</div>
                <h3 className="text-xl font-bold mb-2">Marquesines</h3>
                <p className="text-orange-100 text-sm">Pròximament</p>
              </div>

              <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">Escaleras D'opera</h3>
                <p className="text-teal-100 text-sm">Pròximament</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">📐</div>
                <h3 className="text-xl font-bold mb-2">Escaleras RF</h3>
                <p className="text-cyan-100 text-sm">Pròximament</p>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">Escaleras Escamoteables</h3>
                <p className="text-amber-100 text-sm">Pròximament</p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-800 mb-2">ℹ️ Estat del Sistema</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>✅ Login funcional</li>
                <li>✅ Base de dades configurada</li>
                <li>✅ Tarifes Vallesglass importades</li>
                <li>✅ Calculador de vidres operatiu</li>
                <li>🔄 7 categories disponibles</li>
              </ul>
            </div>
          </div>
        )}

        {vistaActual === 'calculador' && (
          <CalculadorVidres />
        )}
      </main>
    </div>
  );
}

export default App;
