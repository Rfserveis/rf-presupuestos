import { useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, isAdmin } from './services/auth';
import CalculadorVidres from './components/CalculadorVidres';
import AdminPanel from './components/Admin/AdminPanel';
import { traductiones as t } from './locales/es';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
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
      // Los admins van directo al panel, usuarios a inicio
      if (user && user.role === 'admin') {
        setVistaActual('admin');
      } else if (user) {
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
        role: selectedRole === 'admin' ? 'admin' : 'user'
      };
      setCurrentUser(userWithRole);
      localStorage.setItem('rfAuthUser', JSON.stringify(userWithRole));
      setEmail('');
      setPassword('');
      setSelectedRole('user');
      
      // Redirigir según rol
      if (userWithRole.role === 'admin') {
        setVistaActual('admin');
      } else {
        setVistaActual('inicio');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
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
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // === PANTALLA DE LOGIN ===
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🪟</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">RF Serveis</h1>
            <p className="text-gray-600 mt-2">Presupuestos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="demo@rfserveis.com"
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
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

            {/* Selección de Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">👤 Usuario</option>
                <option value="admin">👨‍💼 Administrador</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedRole === 'user' 
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
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-2">🔐 Datos de prueba:</p>
            <p>Email: demo@rfserveis.com</p>
            <p>Pass: cualquiera</p>
            <p className="mt-2 text-xs text-gray-600">
              (Selecciona el rol que deseas usar)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === APLICACIÓN PRINCIPAL ===
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
              <span className="text-2xl">🪟</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">RF Serveis - Presupuestos</h1>
              <p className="text-sm text-gray-600">
                Bienvenido/a {currentUser.name}
                {isAdmin(currentUser) && (
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    👨‍💼 Administrador
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Salir
          </button>
        </div>
      </header>

      {/* NAVEGACIÓN */}
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
              🏠 Inicio
            </button>

            {/* Solo usuarios normales ven el calculador */}
            {!isAdmin(currentUser) && (
              <button
                onClick={() => setVistaActual('calculador')}
                className={`px-6 py-3 font-semibold transition ${
                  vistaActual === 'calculador'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🪟 Calculador de Vidrios
              </button>
            )}

            <button
              className="px-6 py-3 text-gray-400 cursor-not-allowed"
              disabled
            >
              📋 Presupuestos (Próximamente)
            </button>

            {/* Solo admins ven el panel de administración */}
            {isAdmin(currentUser) && (
              <button
                onClick={() => setVistaActual('admin')}
                className={`px-6 py-3 font-semibold transition ${
                  vistaActual === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚙️ Panel de Administración
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* VISTA: INICIO */}
        {vistaActual === 'inicio' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">📊 Crear Nuevo Presupuesto</h2>
            <p className="text-gray-600 mb-6">Selecciona la categoría del presupuesto:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Solo mostrar calculador si no es admin */}
              {!isAdmin(currentUser) && (
                <button
                  onClick={() => setVistaActual('calculador')}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
                >
                  <div className="text-5xl mb-3">🪟</div>
                  <h3 className="text-xl font-bold mb-2">Vidrios</h3>
                  <p className="text-blue-100 text-sm">Catálogo completo</p>
                </button>
              )}

              <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🛡️</div>
                <h3 className="text-xl font-bold mb-2">Barandilla All Glass</h3>
                <p className="text-purple-100 text-sm">Próximamente</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🔒</div>
                <h3 className="text-xl font-bold mb-2">Barandilla Top Glass</h3>
                <p className="text-indigo-100 text-sm">Próximamente</p>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">☂️</div>
                <h3 className="text-xl font-bold mb-2">Marquesinas</h3>
                <p className="text-orange-100 text-sm">Próximamente</p>
              </div>

              <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">Escaleras D'opera</h3>
                <p className="text-teal-100 text-sm">Próximamente</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">📐</div>
                <h3 className="text-xl font-bold mb-2">Escaleras RF</h3>
                <p className="text-cyan-100 text-sm">Próximamente</p>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-6 rounded-lg shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-5xl mb-3">🪜</div>
                <h3 className="text-xl font-bold mb-2">Escaleras Retráctiles</h3>
                <p className="text-amber-100 text-sm">Próximamente</p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-bold text-blue-800 mb-2">ℹ️ Estado del Sistema</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>✅ Login funcional</li>
                <li>✅ Base de datos configurada</li>
                <li>✅ Tarifas importadas</li>
                <li>✅ Calculador operativo</li>
                <li>✅ 7 categorías disponibles</li>
              </ul>
            </div>
          </div>
        )}

        {/* VISTA: CALCULADOR */}
        {vistaActual === 'calculador' && !isAdmin(currentUser) && (
          <CalculadorVidres />
        )}

        {/* VISTA: PANEL ADMIN */}
        {vistaActual === 'admin' && isAdmin(currentUser) && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

export default App;
