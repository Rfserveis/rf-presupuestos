import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import CalculadorVidres from './components/CalculadorVidres';
import CalculadorMarquesinas from './components/CalculadorMarquesinas';
import AdminPanel from './components/Admin/AdminPanel';

/**
 * AppContent - Componente principal con lógica
 * Usa useAuth() para obtener usuario y funciones
 */
function AppContent() {
  const { user, loading, logout, isAdmin } = useAuth();
  const [vistaActual, setVistaActual] = useState('inicio');

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario, mostrar LoginForm
  if (!user) {
    return <LoginForm />;
  }

  // Si hay usuario, mostrar app
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">RF Presupuestos</h1>
            <span className="text-blue-200">
              {user.name} ({user.role})
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Home Button */}
            <button
              onClick={() => setVistaActual('inicio')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded transition"
            >
              🏠 Inicio
            </button>

            {/* Admin Button (solo si es admin) */}
            {isAdmin() && (
              <button
                onClick={() => setVistaActual('admin')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-800 rounded transition"
              >
                ⚙️ Admin
              </button>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-4">
        {vistaActual === 'inicio' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Bienvenido, {user.name}
              </h2>
              <p className="text-gray-600 mb-4">
                Selecciona qué deseas calcular:
              </p>

              {/* Botones categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setVistaActual('vidrios')}
                  className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg hover:bg-blue-200 transition text-left"
                >
                  <h3 className="text-xl font-bold text-blue-700">🪟 Vidrios</h3>
                  <p className="text-gray-600">Calcular presupuesto de vidrios</p>
                </button>

                <button
                  onClick={() => setVistaActual('marquesinas')}
                  className="p-4 bg-green-100 border-2 border-green-500 rounded-lg hover:bg-green-200 transition text-left"
                >
                  <h3 className="text-xl font-bold text-green-700">☂️ Marquesinas</h3>
                  <p className="text-gray-600">Calcular presupuesto de marquesinas</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {vistaActual === 'vidrios' && (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setVistaActual('inicio')}
              className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
            >
              ← Volver
            </button>
            <CalculadorVidres />
          </div>
        )}

        {vistaActual === 'marquesinas' && (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setVistaActual('inicio')}
              className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
            >
              ← Volver
            </button>
            <CalculadorMarquesinas />
          </div>
        )}

        {vistaActual === 'admin' && isAdmin() && (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setVistaActual('inicio')}
              className="mb-4 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
            >
              ← Volver
            </button>
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * App - Componente raíz con AuthProvider
 */
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
