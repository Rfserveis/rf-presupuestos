// src/App.jsx - RF Presupuestos
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';

import CalculadorVidrios from './components/CalculadorVidrios';
import CalculadorMarquesinas from './components/CalculadorMarquesinas';
import CalculadorBarandillasTopGlass from './components/CalculadorBarandillasTopGlass';
import CalculadorEscalerasRetractiles from './components/CalculadorEscalerasRetractiles';
import AdminPanel from './components/AdminPanel';

// Admins fijos por email (fallback robusto)
const ADMIN_EMAILS = ['david@rfserveis.com', 'rafael@rfserveis.com'];

// ============================================
// LOGIN
// ============================================
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const signIn = async (e) => {
    e.preventDefault();
    setStatus('Entrando...');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus('OK');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-800">RF Presupuestos</h1>
        <p className="text-sm text-gray-500 mt-1">Accede con tu usuario</p>

        <form onSubmit={signIn} className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              className="w-full mt-1 border rounded-xl px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@rfserveis.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Password</label>
            <input
              className="w-full mt-1 border rounded-xl px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-medium"
            type="submit"
          >
            Entrar
          </button>

          {status && <div className="text-xs text-gray-600 mt-2">{status}</div>}
        </form>
      </div>
    </div>
  );
}

// ============================================
// ACCESO
// ============================================
function Acceso() {
  const { user, profile, isAdmin: isAdminCtx } = useAuth();
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  const isAdmin = !!isAdminCtx || ADMIN_EMAILS.includes(email);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Acceso</h2>

      <div className="space-y-2 text-sm text-gray-700">
        <div><strong>Usuario:</strong> {profile?.nombre || '-'}</div>
        <div><strong>Email:</strong> {user?.email || '-'}</div>
        <div><strong>Rol:</strong> {isAdmin ? 'Administrador' : 'Usuario'}</div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        (Pantalla informativa. Aquí luego podemos meter gestión de permisos, etc.)
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard() {
  const { user, profile, isAdmin: isAdminCtx, signOut } = useAuth();

  // ✅ Fallback admin por email (esto es lo que arregla tu botón)
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  const isAdmin = !!isAdminCtx || ADMIN_EMAILS.includes(email);

  const [currentView, setCurrentView] = useState('calculadores'); // calculadores | acceso | admin
  const [calculadorActivo, setCalculadorActivo] = useState('vidrios');
  const [banner, setBanner] = useState('');

  // ✅ Los 7 aparecen, pero solo 4 activos
  const calculadores = [
    { id: 'vidrios', nombre: 'Vidrios', icono: '🪟', activo: true },
    { id: 'allglass', nombre: 'Barandillas All Glass', icono: '🧊', activo: false },
    { id: 'topglass', nombre: 'Barandillas Top Glass', icono: '🔒', activo: true },
    { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️', activo: true },
    { id: 'opera', nombre: 'Escaleras D’Opera', icono: '🪜', activo: false },
    { id: 'rf', nombre: 'Escaleras RF', icono: '🪜', activo: false },
    { id: 'retractiles', nombre: 'Escaleras Retráctiles', icono: '🪜', activo: true },
  ];

  const selectCalculador = (calc) => {
    if (!calc.activo) {
      setBanner(`"${calc.nombre}" estará disponible próximamente.`);
      return;
    }
    setBanner('');
    setCalculadorActivo(calc.id);
  };

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
          <div>
            <h1 className="text-xl font-bold text-slate-800">RF Presupuestos</h1>
            <p className="text-xs text-gray-500">Sistema de presupuestos</p>
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

            {/* ✅ Panel Admin (solo admin) */}
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

            <div className="text-right ml-3">
              <div className="text-sm font-semibold text-slate-800">
                {profile?.nombre || 'Usuario'}
              </div>
              <div className="text-xs text-gray-500">
                {isAdmin ? 'Administrador' : 'Usuario'}
              </div>
            </div>

            <button
              onClick={signOut}
              className="ml-2 px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200"
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
            {banner && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
                {banner}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Selecciona una categoría
              </h2>

              <div className="flex flex-wrap gap-2">
                {calculadores.map((calc) => {
                  const isSelected = calculadorActivo === calc.id;

                  const base =
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2';
                  const enabled = isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                  const disabled =
                    'bg-gray-50 text-gray-400 border border-dashed border-gray-300 cursor-not-allowed';

                  return (
                    <button
                      key={calc.id}
                      onClick={() => selectCalculador(calc)}
                      className={`${base} ${calc.activo ? enabled : disabled}`}
                      title={calc.activo ? '' : 'Próximamente'}
                    >
                      <span>{calc.icono}</span>
                      <span>{calc.nombre}</span>
                      {!calc.activo && (
                        <span className="text-xs ml-2 px-2 py-0.5 rounded bg-white border">
                          Próximamente
                        </span>
                      )}
                    </button>
                  );
                })}
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
// APP CONTENT (decide Login o Dashboard)
// ============================================
function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;
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
