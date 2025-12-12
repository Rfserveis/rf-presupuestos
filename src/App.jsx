import { useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, isAdmin } from './services/auth';
import CalculadorVidres from './components/CalculadorVidres';
import AdminPanel from './components/Admin/AdminPanel';
import { traductiones as t } from './locales/es';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('usuario');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vistaActual, setVistaActual] = useState('inicio');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user && !isAdmin(user)) {
        setVistaActual('inicio');
      }
    } catch (err) {
      console.error('Error verificando usuario:', err);
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
      const userWithRole = {
        ...profile,
        rol: selectedRole
      };
      setCurrentUser(userWithRole);
      localStorage.setItem('rfAuthUser', JSON.stringify(userWithRole));
      setEmail('');
      setPassword('');
      setSelectedRole('usuario');
      setVistaActual('inicio');
    } catch (err) {
      setError(err.message || t.auth.errorAutenticacion);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setVistaActual('inicio');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.auth.cargando}</p>
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
            <h1 className="text-3xl font-bold text-gray-800">{t.auth.titulo}</h1>
            <p className="text-gray-600 mt-2">{t.auth.subtitulo}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.auth.emailPlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.contrasena}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.auth.contrasenaPlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.header.rol}
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="usuario">👤 {t.header.usuario}</option>
                <option value="admin">👨‍💼 {t.header.administrador}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedRole === 'usuario' 
                  ? '📊 Acceso a Calculador de Vidrios'
                  : '⚙️ Acceso a Panel de Administración'
                }
              </p>
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
              {loading ? t.auth.entrando : t.auth.entrar}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-2">🔐 Datos de prueba:</p>
            <p>Email: demo@rfserveis.com</p>
            <p>Pass: demo123</p>
            <p className="mt-2 text-xs text-gray-600">
              (Selecciona el rol que deseas usar abajo)
            </p>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-800">RF Serveis - {t.auth.subtitulo}</h1>
              <p className="text-sm text-gray-600">
                {t.header.bienvenida} {currentUser.nombre} 
                {isAdmin(currentUser) && (
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    👨‍💼 {t.header.administrador}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            {t.auth.salir}
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setVistaActual('inicio')}
              className={`px-6 py-3 font-semibold transition ${
                vistaActual === 'inicio'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 {t.nav.inicio}
            </button>

            {!isAdmin(currentUser) && (
              <button
                onClick={() => setVistaActual('calculador')}
                className={`px-6 py-3 font-semibold transition ${
                  vistaActual === 'calculador'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🪟 {t.nav.calculadorVidres}
              </button>
            )}

            <button
              className="px-6 py-3 text-gray-400 cursor-not-allowed"
              disabled
            >
              📋 {t.nav.presupuestos} ({t.nav.proximamente})
            </button>

            {isAdmin(currentUser) && (
              <button
                onClick={() => setVistaActual('admin')}
                className={`px-6 py-3 font-semibold transition ${
                  vistaActual === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚙️ {t.nav.panelAdmin}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {vistaActual === 'inicio' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">📊 {t.home.titulo}</h2>
            <p className="text-gray-600 mb-6">{t.home.descripcion}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {!isAdmin(currentUser) && (
                <button
                  onClick={() => setVistaActual('calculador')}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
                >
                  <div className="text-5xl mb-3">🪟</div>
                  <h3 className="text-xl font-bold mb-2">{t.home.vidrios}</h3>
                  <p className="text-blue-100 text-sm">{t.home.catalogoCompleto}</p>
                </button>
              )}

              <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🛡️</div>
                <h3 className="text-xl font-bold mb-2">{t.home.barandillaAllGlass}</h3>
                <p className="text-purple-100 text-sm">{t.nav.proximamente}</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🔒</div>
                <h3 className="text-xl font-bold mb-2">{t.home.barandillaTopGlass}</h3>
                <p className="text-indigo-100 text-sm">{t.nav.proximamente}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">☂️</div>
                <h3 className="text-xl font-bold mb-2">{t.home.marquesinas}</h3>
                <p className="text-orange-100 text-sm">{t.nav.proximamente}</p>
              </div>

              <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">{t.home.escalerasOpera}</h3>
                <p className="text-teal-100 text-sm">{t.nav.proximamente}</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">📐</div>
                <h3 className="text-xl font-bold mb-2">{t.home.escalerasRF}</h3>
                <p className="text-cyan-100 text-sm">{t.nav.proximamente}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">{t.home.escalerasRetractiles}</h3>
                <p className="text-amber-100 text-sm">{t.nav.proximamente}</p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-800 mb-2">ℹ️ {t.home.estadoSistema}</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>✅ {t.home.loginFuncional}</li>
                <li>✅ {t.home.baseDatosCofigurada}</li>
                <li>✅ {t.home.tarifasImportadas}</li>
                <li>✅ {t.home.calculadorOperativo}</li>
                <li>🔄 {t.home.categoriasDisponibles}</li>
              </ul>
            </div>
          </div>
        )}

        {vistaActual === 'calculador' && !isAdmin(currentUser) && (
          <CalculadorVidres />
        )}

        {vistaActual === 'admin' && isAdmin(currentUser) && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

export default App;
