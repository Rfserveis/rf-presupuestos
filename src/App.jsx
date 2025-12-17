// src/App.jsx - RF Presupuestos
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';

import CalculadorVidrios from './components/CalculadorVidrios';
import CalculadorMarquesinas from './components/CalculadorMarquesinas';
import CalculadorBarandillasTopGlass from './components/CalculadorBarandillasTopGlass';
import CalculadorEscalerasRetractiles from './components/CalculadorEscalerasRetractiles';
import AdminPanel from './components/AdminPanel';

// ============================================
// LOGIN
// ============================================
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white font-bold text-3xl px-6 py-3 rounded-xl inline-block mb-4">
            RF
          </div>
          <h1 className="text-2xl font-bold text-gray-800">RF Presupuestos</h1>
          <p className="text-gray-500">Sistema de presupuestos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// VISTA ACCESO (para admin y user)
// ============================================
function Acceso() {
  const { user, profile, isAdmin } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Acceso</h2>

      <div className="space-y-2 text-sm text-gray-700">
        <div><strong>Usuario:</strong> {profile?.nombre || '-'}</div>
        <div><strong>Email:</strong> {user?.email || '-'}</div>
        <div><strong>Rol:</strong> {isAdmin ? 'Administrador' : 'Usuario'}</div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        (Esto es solo una pantalla de información. Si luego quieres gestionar permisos, aquí meteremos cosas.)
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard() {
  const { profile, isAdmin, signOut } = useAuth();

  const [currentView, setCurrentView] = useState('calculadores'); // calculadores | acceso | admin
  const [calculadorActivo, setCalculadorActivo] = useState('vidrios');

  // ✅ SOLO los 4 activos
  const calculadores = [
    { id: 'vidrios', nombre: 'Vidrios', icono: '🪟' },
    { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️' },
    { id: 'topglass', nombre: 'Barandillas Top Glass', icono: '🔒' },
    { id: 'retractiles', nombre: 'Escaleras Retráctiles', icono: '🪜' },
  ];

  const renderCalculador = () => {
    switch (calculadorActivo) {
      case 'vidrios':
        return <CalculadorVidrios />;
      case 'marquesinas':
        return <CalculadorMarquesinas />;
      case 'topglass':
        return <CalculadorBarandillasTopGlass />;
      case 'retractiles':
        return <CalculadorEscalerasRetractiles />;
      default:
        return <CalculadorVidrios />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-800">RF Presupuestos</span>
            <span className="text-sm text-gray-500 hidden sm:block">Sistema de presupuestos</span>
          </div>

          <nav className="flex items-center gap-2">
            {/* Calculadores */}
            <button
              onClick={() => setCurrentView('calculadores')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentView === 'calculadores'
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calculadores
            </button>

            {/* ✅ ACCESO (admin y user) */}
            <button
              onClick={() => setCurrentView('acceso')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentView === 'acceso'
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Acceso
            </button>

            {/* Panel Admin (solo admin) */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  currentView === 'admin'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Panel Admin
              </button>
            )}

            <div className="ml-2 text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{profile?.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Usuario'}</p>
            </div>

            <button
              onClick={signOut}
              className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'admin' && isAdmin && <AdminPanel />}

        {currentView === 'acceso' && <Acceso />}

        {currentView === 'calculadores' && (
          <div className="space-y-6">
            {/* Selector de calculadores */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                {calculadores.map((calc) => (
                  <button
                    key={calc.id}
                    onClick={() => setCalculadorActivo(calc.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      calculadorActivo === calc.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{calc.icono}</span>
                    <span className="hidden sm:inline">{calc.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {renderCalculador()}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================
// APP CONTENT
// ============================================
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}

// ============================================
// APP PRINCIPAL
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
