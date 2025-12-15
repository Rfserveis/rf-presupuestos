// App.jsx - RF Presupuestos FASE 2
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Calculadores
import CalculadorVidrios from './components/CalculadorVidrios';
import CalculadorBarandillasAllGlass from './components/CalculadorBarandillasAllGlass';
import CalculadorBarandillasTopGlass from './components/CalculadorBarandillasTopGlass';
import CalculadorMarquesinas from './components/CalculadorMarquesinas';
import CalculadorEscalerasOpera from './components/CalculadorEscalerasOpera';
import CalculadorEscalerasRF from './components/CalculadorEscalerasRF';
import CalculadorEscalerasRetractiles from './components/CalculadorEscalerasRetractiles';

// Categorías disponibles
const CATEGORIAS = [
  { id: 'vidrios', nombre: 'Vidrios', icono: '🪟', color: 'blue', componente: CalculadorVidrios },
  { id: 'barandillas_all', nombre: 'Barandillas All Glass', icono: '🛡️', color: 'emerald', componente: CalculadorBarandillasAllGlass },
  { id: 'barandillas_top', nombre: 'Barandillas Top Glass', icono: '🔒', color: 'purple', componente: CalculadorBarandillasTopGlass },
  { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️', color: 'amber', componente: CalculadorMarquesinas },
  { id: 'escaleras_opera', nombre: "Escaleras D'Opera", icono: '🪜', color: 'rose', componente: CalculadorEscalerasOpera },
  { id: 'escaleras_rf', nombre: 'Escaleras RF', icono: '🔥', color: 'red', componente: CalculadorEscalerasRF },
  { id: 'escaleras_retractiles', nombre: 'Escaleras Retráctiles', icono: '🪜', color: 'cyan', componente: CalculadorEscalerasRetractiles },
];

// Componente de Login
const LoginScreen = () => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Introduce email y contraseña');
      return;
    }

    const result = await signIn(email, password);
    if (!result.success) {
      setLocalError(result.error || 'Error de autenticación');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
          <div className="text-5xl mb-3">🏗️</div>
          <h1 className="text-2xl font-bold text-white">RF Presupuestos</h1>
          <p className="text-blue-100 mt-2">Sistema de presupuestos ágiles</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {(localError || error) && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {localError || error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Demo: demo@rfserveis.com</p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Principal (después de login)
const MainApp = () => {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const [categoriaActiva, setCategoriaActiva] = useState('vidrios');
  const [vistaActiva, setVistaActiva] = useState('calculador'); // calculador | presupuestos | clientes | proyectos
  const [menuAbierto, setMenuAbierto] = useState(false);

  const CategoriaActual = CATEGORIAS.find(c => c.id === categoriaActiva)?.componente;

  const handlePresupuestoGuardado = (presupuesto) => {
    console.log('Presupuesto guardado:', presupuesto);
    // Aquí podrías mostrar una notificación o redirigir
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏗️</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">RF Presupuestos</h1>
                <p className="text-xs text-gray-500">Sistema de presupuestos</p>
              </div>
            </div>

            {/* Nav Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setVistaActiva('calculador')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'calculador' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Calculadores
              </button>
              <button
                onClick={() => setVistaActiva('presupuestos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'presupuestos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Presupuestos
              </button>
              <button
                onClick={() => setVistaActiva('clientes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'clientes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                👥 Clientes
              </button>
              <button
                onClick={() => setVistaActiva('proyectos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'proyectos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📁 Proyectos
              </button>
              {isAdmin() && (
                <button
                  onClick={() => setVistaActiva('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaActiva === 'admin' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ⚙️ Admin
                </button>
              )}
            </nav>

            {/* Usuario */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile?.nombre || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userProfile?.rol || 'Usuario'}</p>
              </div>
              <button
                onClick={signOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {vistaActiva === 'calculador' && (
          <>
            {/* Selector de Categorías */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona una categoría</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 ${
                      categoriaActiva === cat.id
                        ? `bg-${cat.color}-100 border-2 border-${cat.color}-500 shadow-md`
                        : 'bg-white border-2 border-transparent hover:border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icono}</div>
                    <div className={`text-xs font-medium ${
                      categoriaActiva === cat.id ? `text-${cat.color}-700` : 'text-gray-700'
                    }`}>
                      {cat.nombre}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculador Activo */}
            {CategoriaActual && <CategoriaActual onGuardar={handlePresupuestoGuardado} />}
          </>
        )}

        {vistaActiva === 'presupuestos' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Mis Presupuestos</h2>
            <p className="text-gray-500">Aquí verás el listado de presupuestos guardados.</p>
            <p className="text-sm text-gray-400 mt-2">Funcionalidad en desarrollo...</p>
          </div>
        )}

        {vistaActiva === 'clientes' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">👥 Clientes</h2>
            <p className="text-gray-500">Gestión de clientes.</p>
            <p className="text-sm text-gray-400 mt-2">Funcionalidad en desarrollo...</p>
          </div>
        )}

        {vistaActiva === 'proyectos' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📁 Proyectos</h2>
            <p className="text-gray-500">Gestión de proyectos.</p>
            <p className="text-sm text-gray-400 mt-2">Funcionalidad en desarrollo...</p>
          </div>
        )}

        {vistaActiva === 'admin' && isAdmin() && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Panel de Administración</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">📤 Gestor Excel</h3>
                <p className="text-sm text-blue-600 mt-1">Subir y actualizar datos desde Excel</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Validador</h3>
                <p className="text-sm text-green-600 mt-1">Validar datos antes de actualizar</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">📊 Reportes</h3>
                <p className="text-sm text-purple-600 mt-1">Estadísticas y reportes</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Panel completo en desarrollo...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          RF Presupuestos © 2024 - Fase 2
        </div>
      </footer>
    </div>
  );
};

// App Root con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Contenido que decide qué mostrar
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏗️</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <LoginScreen />;
}

export default App;
