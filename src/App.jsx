import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Lock, Unlock, Home, LogOut, Settings, Eye } from 'lucide-react';
import { authService } from './services/auth';
import { presupuestosService, itemsService } from './services/presupuestos';

const RFQuoteSystem = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [currentPresupuesto, setCurrentPresupuesto] = useState(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const categorias = [
    { id: 'vidrios', nombre: 'Vidrios', icon: '🪟', color: 'from-blue-500 to-blue-600', implementado: true },
    { id: 'barandilla-all-glass', nombre: 'Barandilla All Glass', icon: '🛡️', color: 'from-green-500 to-green-600', implementado: false },
    { id: 'barandilla-top-glass', nombre: 'Barandilla Top Glass', icon: '🔒', color: 'from-purple-500 to-purple-600', implementado: false },
    { id: 'marquesinas', nombre: 'Marquesinas', icon: '🏠', color: 'from-orange-500 to-orange-600', implementado: false },
    { id: 'escaleras-dopera', nombre: 'Escaleras D\'opera', icon: '🪜', color: 'from-red-500 to-red-600', implementado: false },
    { id: 'escaleras-rf', nombre: 'Escaleras RF', icon: '📐', color: 'from-indigo-500 to-indigo-600', implementado: false }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      cargarPresupuestos();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const cargarPresupuestos = async () => {
    try {
      setLoading(true);
      const data = await presupuestosService.getAll();
      setPresupuestos(data);
    } catch (error) {
      console.error('Error carregant pressupostos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await authService.login(loginEmail, loginCode);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('rfAuthUser', JSON.stringify(user));
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('home');
  };

  const crearPresupuesto = async (categoria, nombreCliente) => {
    try {
      setLoading(true);
      const nuevoPresupuesto = await presupuestosService.create({
        nombreCliente,
        categoria,
        createdBy: currentUser.id
      });
      
      setCurrentPresupuesto(nuevoPresupuesto);
      setSelectedCategory(categoria);
      setCurrentView('create');
      await cargarPresupuestos();
    } catch (error) {
      console.error('Error creant pressupost:', error);
      alert('Error creant pressupost');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPresupuesto = async (id) => {
    if (!window.confirm('Segur que vols eliminar aquest pressupost?')) return;
    
    try {
      setLoading(true);
      await presupuestosService.delete(id);
      await cargarPresupuestos();
    } catch (error) {
      console.error('Error eliminant pressupost:', error);
      alert('Error eliminant pressupost');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">RF Serveis</h1>
            <p className="text-gray-600">Sistema de Pressupostos</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Codi d'Accés</label>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                placeholder="RF123"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-mono uppercase"
                maxLength={5}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="tu@rfserveis.com"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Iniciar Sessió
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Usuaris autoritzats: rafael, david, esther, igor, carme
            </p>
          </div>
        </div>
      </div>
    );
  }

  const HomeView = () => {
    const [nombreCliente, setNombreCliente] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    const iniciarPresupuesto = async () => {
      if (!nombreCliente.trim()) {
        alert('Introdueix el nom del client');
        return;
      }
      if (!categoriaSeleccionada) {
        alert('Selecciona una categoria');
        return;
      }
      await crearPresupuesto(categoriaSeleccionada, nombreCliente);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white shadow-lg border-b-4 border-blue-600">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">RF Serveis - Pressupostos</h1>
                  <p className="text-sm text-gray-600">Benvingut/da, {currentUser?.nombre}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sortir
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Crear Nou Pressupost</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom del Client</label>
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Nom del client o projecte"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Selecciona Categoria</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaSeleccionada(cat.id)}
                    className={`relative p-6 rounded-xl border-3 transition-all duration-200 ${
                      categoriaSeleccionada === cat.id
                        ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-xl scale-105`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    <div className={`text-5xl mb-3 ${categoriaSeleccionada === cat.id ? '' : 'opacity-70'}`}>
                      {cat.icon}
                    </div>
                    <h3 className={`text-lg font-bold ${categoriaSeleccionada === cat.id ? 'text-white' : 'text-gray-800'}`}>
                      {cat.nombre}
                    </h3>
                    {!cat.implementado && (
                      <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-semibold">
                        Pròximament
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={iniciarPresupuesto}
              disabled={!nombreCliente.trim() || !categoriaSeleccionada || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  Crear Pressupost
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregant pressupostos...</p>
            </div>
          ) : presupuestos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pressupostos Recents</h2>
              <div className="space-y-3">
                {presupuestos.map((p) => {
                  const cat = categorias.find(c => c.id === p.categoria);
                  const fecha = new Date(p.created_at).toLocaleDateString('ca-ES');
                  
                  return (
                    <div
                      key={p.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`bg-gradient-to-br ${cat?.color} w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg`}>
                            {cat?.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold text-gray-800">{p.nombre_cliente}</h3>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                #{p.numero}
                              </span>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>📁 {cat?.nombre}</span>
                              <span>📅 {fecha}</span>
                              <span>👤 {p.created_by_user?.nombre}</span>
                              <span>📦 {p.items?.length || 0} items</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentPresupuesto(p);
                              setSelectedCategory(p.categoria);
                              setCurrentView('create');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Obrir
                          </button>
                          {currentUser.rol === 'admin' && (
                            <button
                              onClick={() => eliminarPresupuesto(p.id)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (currentView === 'create' && currentPresupuesto) {
    const categoria = categorias.find(c => c.id === selectedCategory);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className={`bg-gradient-to-r ${categoria?.color} text-white shadow-lg sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setCurrentPresupuesto(null);
                  setSelectedCategory(null);
                  cargarPresupuestos();
                }}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{categoria?.icon}</span>
                  <div>
                    <h1 className="text-2xl font-bold">{categoria?.nombre}</h1>
                    <p className="text-white/90 text-sm">Pressupost #{currentPresupuesto.numero} - {currentPresupuesto.nombre_cliente}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-8xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Categoria en Desenvolupament</h2>
            <p className="text-gray-600">El mòdul de {categoria?.nombre} estarà disponible properament</p>
          </div>
        </div>
      </div>
    );
  }

  return <HomeView />;
};

export default RFQuoteSystem;