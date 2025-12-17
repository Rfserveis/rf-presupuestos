import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import CalculadorVidrios from './components/CalculadorVidrios'
import CalculadorMarquesinas from './components/CalculadorMarquesinas'
import CalculadorTopGlass from './components/CalculadorTopGlass'
import CalculadorEscaleras from './components/CalculadorEscaleras'
import AdminPanel from './components/AdminPanel'

function Dashboard() {
  const { isAdmin } = useAuth()

  const [currentView, setCurrentView] = useState('calculadores')
  const [calculadorActivo, setCalculadorActivo] = useState('vidrios')

  const calculadores = [
    { id: 'vidrios', nombre: 'Vidrios', icono: '🪟' },
    { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️' },
    { id: 'topglass', nombre: 'Top Glass', icono: '🔒' },
    { id: 'escaleras', nombre: 'Escaleras', icono: '🪜' },
  ]

  const renderCalculador = () => {
    switch (calculadorActivo) {
      case 'vidrios':
        return <CalculadorVidrios />
      case 'marquesinas':
        return <CalculadorMarquesinas />
      case 'topglass':
        return <CalculadorTopGlass />
      case 'escaleras':
        return <CalculadorEscaleras />
      default:
        return <CalculadorVidrios />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">
            RF Presupuestos
          </h1>

          <nav className="flex gap-2">
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

            {/* 🔑 NUEVO BOTÓN ACCESO (PASO 1) */}
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
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'admin' && isAdmin ? (
          <AdminPanel />
        ) : (
          <div className="space-y-6">
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
                    <span className="hidden sm:inline">
                      {calc.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {renderCalculador()}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
