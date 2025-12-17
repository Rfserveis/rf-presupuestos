// App.jsx - Aplicacion principal RF Presupuestos
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import CalculadorVidrios from './components/CalculadorVidrios';
import CalculadorMarquesinas from './components/CalculadorMarquesinas';
import CalculadorBarandillasTopGlass from './components/CalculadorBarandillasTopGlass';
import CalculadorEscalerasRetractiles from './components/CalculadorEscalerasRetractiles';
import { 
  CalculadorBarandillasAllGlass, 
  CalculadorEscalerasOpera, 
  CalculadorEscalerasRF 
} from './components/PlaceholderProximamente';

// Componente principal de la aplicacion
function AppContent() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('calculadores');
  const [calculadorActivo, setCalculadorActivo] = useState('vidrios');

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no esta autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Navegacion entre vistas
  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Lista de calculadores
  const calculadores = [
    { id: 'vidrios', nombre: 'Vidrios', icono: '🪟', color: 'blue', activo: true },
    { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️', color: 'amber', activo: true },
    { id: 'topglass', nombre: 'Barandillas Top Glass', icono: '🔒', color: 'purple', activo: true },
    { id: 'escaleras-retractiles', nombre: 'Escaleras Escamoteables', icono: '🪜', color: 'cyan', activo: true },
    { id: 'allglass', nombre: 'Barandillas All Glass', icono: '🛡️', color: 'emerald', activo: false },
    { id: 'escaleras-opera', nombre: "Escaleras D'Opera", icono: '🎭', color: 'rose', activo: false },
    { id: 'escaleras-rf', nombre: 'Escaleras RF', icono: '🔥', color: 'red', activo: false },
  ];

  // Renderizar calculador activo
  const renderCalculador = () => {
    switch (calculadorActivo) {
      case 'vidrios':
        return <CalculadorVidrios />;
      case 'marquesinas':
        return <CalculadorMarquesinas />;
      case 'topglass':
        return <CalculadorBarandillasTopGlass />;
      case 'escaleras-retractiles':
        return <CalculadorEscalerasRetractiles />;
      case 'allglass':
        return <CalculadorBarandillasAllGlass />;
      case 'escaleras-opera':
        return <CalculadorEscalerasOpera />;
      case 'escaleras-rf':
        return <CalculadorEscalerasRF />;
      default:
        return <CalculadorVidrios />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con navegacion */}
      <Header onNavigate={handleNavigate} currentView={currentView} />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'admin' && isAdmin ? (
          // Panel de administracion
          <AdminPanel />
        ) : (
          // Vista de calculadores
          <div className="space-y-6">
            {/* Selector de calculadores */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Selecciona un calculador</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                {calculadores.map((calc) => (
                  <button
                    key={calc.id}
                    onClick={() => setCalculadorActivo(calc.id)}
                    disabled={!calc.activo}
                    className={`p-3 rounded-lg text-left transition-all relative ${
                      calculadorActivo === calc.id
                        ? `bg-${calc.color}-100 border-2 border-${calc.color}-500 shadow-sm`
                        : calc.activo
                        ? 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                        : 'bg-gray-50 border-2 border-transparent opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-2xl mb-1">{calc.icono}</div>
                    <div className="text-xs font-medium text-gray-700 leading-tight">
                      {calc.nombre}
                    </div>
                    {!calc.activo && (
                      <span className="absolute top-1 right-1 text-xs bg-gray-200 text-gray-500 px-1 rounded">
                        Pronto
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculador activo */}
            {renderCalculador()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            RF Presupuestos © 2024 - RF Serveis
          </p>
        </div>
      </footer>
    </div>
  );
}

// Wrapper con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
