// App.jsx - Version minima para test
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';

// Componente Login simple
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="bg-blue-600 text-white font-bold text-2xl px-4 py-2 rounded inline-block mb-2">
            RF
          </div>
          <h1 className="text-xl font-bold text-gray-800">RF Presupuestos</h1>
          <p className="text-gray-500 text-sm">Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente Dashboard principal
function Dashboard() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-bold text-xl px-3 py-1 rounded">RF</div>
            <span className="font-semibold text-gray-800">RF Presupuestos</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Boton Admin - Solo visible para administradores */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentView === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel Admin
              </button>
            )}

            {/* Info usuario */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{profile?.nombre}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                {isAdmin ? 'Administrador' : 'Usuario'}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'admin' && isAdmin ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span> Panel de Administracion
            </h2>
            <p className="text-gray-600 mb-4">
              Aqui podras gestionar las tarifas y configuraciones del sistema.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 text-sm">
                <strong>Usuario:</strong> {user?.email}<br />
                <strong>Rol:</strong> Administrador
              </p>
            </div>
            {/* Aqui ira el AdminPanel completo */}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Bienvenido, {profile?.nombre}!</h2>
              <p className="text-gray-600">
                Selecciona un calculador para comenzar a crear presupuestos.
              </p>
            </div>

            {/* Grid de calculadores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { nombre: 'Vidrios', icono: '🪟', activo: true },
                { nombre: 'Marquesinas', icono: '☂️', activo: true },
                { nombre: 'Top Glass', icono: '🔒', activo: true },
                { nombre: 'Escaleras', icono: '🪜', activo: true },
                { nombre: 'All Glass', icono: '🛡️', activo: false },
                { nombre: "D'Opera", icono: '🎭', activo: false },
                { nombre: 'Escaleras RF', icono: '🔥', activo: false },
              ].map((calc, i) => (
                <button
                  key={i}
                  disabled={!calc.activo}
                  className={`p-4 rounded-xl text-center transition-all ${
                    calc.activo
                      ? 'bg-white shadow hover:shadow-md cursor-pointer'
                      : 'bg-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-3xl mb-2">{calc.icono}</div>
                  <div className="text-sm font-medium text-gray-700">{calc.nombre}</div>
                  {!calc.activo && <div className="text-xs text-gray-400 mt-1">Proximamente</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Contenido principal que decide que mostrar
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}

// App principal con Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
