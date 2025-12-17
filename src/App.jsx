// App.jsx - RF Presupuestos Completo
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';

// ============================================
// COMPONENTE LOGIN
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
      setError(err.message || 'Error al iniciar sesion');
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Contrasena</label>
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
            {loading ? 'Entrando...' : 'Iniciar Sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// CALCULADOR DE VIDRIOS
// ============================================
const VIDRIOS_DATA = {
  'Laminado': {
    'Vallesglass': {
      '5+5': { 'Transparente': 35.54, 'Mate': 41.39 },
      '6+6': { 'Transparente': 38.33, 'Mate': 46.09, 'Gris': 63.95 },
      '8+8': { 'Transparente': 56.09, 'Mate': 65.85, 'Gris': 90.49 },
      '10+10': { 'Transparente': 75.39, 'Mate': 87.85, 'Gris': 113.59 },
      '12+12': { 'Transparente': 113.75, 'Mate': 128.75 }
    }
  },
  'Laminado Templado': {
    'Vallesglass': {
      '6+6': { 'Transparente': 125.75 },
      '8+8': { 'Transparente': 155.01 },
      '10+10': { 'Transparente': 179.26 }
    },
    'Baros Vision': {
      '6+6': { 'Transparente': 94.00, 'Optico': 109.00, 'Mate': 101.00 },
      '8+8': { 'Transparente': 110.00, 'Optico': 125.00 },
      '10+10': { 'Transparente': 145.00, 'Optico': 160.00 }
    }
  }
};

function CalculadorVidrios() {
  const [formData, setFormData] = useState({
    ancho: '', alto: '', cantidad: 1,
    tipo: 'Laminado', proveedor: 'Vallesglass',
    espesor: '6+6', acabado: 'Transparente',
    cantos: false, puntas: false, taladros: 0
  });
  const [resultado, setResultado] = useState(null);

  const getProveedores = () => Object.keys(VIDRIOS_DATA[formData.tipo] || {});
  const getEspesores = () => Object.keys(VIDRIOS_DATA[formData.tipo]?.[formData.proveedor] || {});
  const getAcabados = () => Object.keys(VIDRIOS_DATA[formData.tipo]?.[formData.proveedor]?.[formData.espesor] || {});

  const calcular = () => {
    const { ancho, alto, cantidad, tipo, proveedor, espesor, acabado, cantos, puntas, taladros } = formData;
    if (!ancho || !alto) return;

    const m2 = (parseFloat(ancho) / 1000) * (parseFloat(alto) / 1000) * parseInt(cantidad);
    const perimetro = 2 * (parseFloat(ancho) / 1000 + parseFloat(alto) / 1000) * parseInt(cantidad);
    const precioM2 = VIDRIOS_DATA[tipo]?.[proveedor]?.[espesor]?.[acabado] || 0;
    
    let total = m2 * precioM2;
    
    // Cantos
    if (cantos) {
      const precioCanto = proveedor === 'Baros Vision' ? 0 : 2.00;
      total += perimetro * precioCanto;
    }
    
    // Puntas roma
    if (puntas) {
      total += 4 * parseInt(cantidad) * 2.50;
    }
    
    // Taladros
    if (taladros > 0 && tipo === 'Laminado Templado') {
      const precioTaladro = proveedor === 'Baros Vision' ? 0 : 5.50;
      total += parseInt(taladros) * parseInt(cantidad) * precioTaladro;
    }

    const iva = total * 0.21;
    setResultado({ m2, precioM2, subtotal: total, iva, total: total + iva });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">🪟 Calculador de Vidrios</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Medidas */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                <input type="number" value={formData.ancho} onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="1000" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Alto (mm)</label>
                <input type="number" value={formData.alto} onChange={(e) => setFormData({...formData, alto: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="1500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                <input type="number" min="1" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de Vidrio</label>
              <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value, proveedor: 'Vallesglass'})}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="Laminado">Laminado</option>
                <option value="Laminado Templado">Laminado Templado</option>
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
              <select value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg">
                {getProveedores().map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Espesor y Acabado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  {getEspesores().map(e => <option key={e} value={e}>{e} mm</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                <select value={formData.acabado} onChange={(e) => setFormData({...formData, acabado: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  {getAcabados().map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Operaciones */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.cantos} onChange={(e) => setFormData({...formData, cantos: e.target.checked})} />
                <span className="text-sm">Cantos pulidos {formData.proveedor === 'Baros Vision' && '(Incluido)'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.puntas} onChange={(e) => setFormData({...formData, puntas: e.target.checked})} />
                <span className="text-sm">Puntas roma (4/pieza)</span>
              </label>
              {formData.tipo === 'Laminado Templado' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Taladros:</span>
                  <input type="number" min="0" value={formData.taladros} onChange={(e) => setFormData({...formData, taladros: e.target.value})}
                    className="w-16 px-2 py-1 border rounded" />
                  {formData.proveedor === 'Baros Vision' && <span className="text-xs text-green-600">(Incluido)</span>}
                </div>
              )}
            </div>

            <button onClick={calcular} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
              Calcular
            </button>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Resumen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>m² total:</span><span>{resultado.m2.toFixed(3)} m²</span></div>
                  <div className="flex justify-between"><span>Precio/m²:</span><span>{resultado.precioM2.toFixed(2)} €</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-gray-500"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                </div>
                <div className="mt-4 bg-blue-600 text-white rounded-lg p-4 flex justify-between">
                  <span className="font-bold">TOTAL:</span>
                  <span className="text-xl font-bold">{resultado.total.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Introduce los datos y pulsa Calcular</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CALCULADOR DE MARQUESINAS
// ============================================
function CalculadorMarquesinas() {
  const [formData, setFormData] = useState({
    modelo: 'LINEA 3 MINI', espesor: '8+8', longitud: 3000, numTrams: 1,
    volada: 1000, acabadoPerfil: 'Raw', intercapa: 'SentryGlas'
  });
  const [resultado, setResultado] = useState(null);

  const MODELOS = {
    'LINEA 3 MINI': { espesores: ['8+8'], voladaMax: 1200 },
    'LINEA 3 MINI LED': { espesores: ['8+8'], voladaMax: 1200 },
    'LINEA 3 MAXI': { espesores: ['10+10', '12+12'], voladaMax: 1500 },
    'LINEA 3 MAXI LED': { espesores: ['10+10', '12+12'], voladaMax: 1500 }
  };

  const PRECIOS = {
    'LINEA 3 MINI': { '3000': { 'Raw': 527, 'Silver 20': 619, 'Ral 9010 mate': 669 } },
    'LINEA 3 MAXI': { '3000': { 'Raw': 755, 'Silver 20': 883, 'Ral 9010 mate': 955 } }
  };

  const calcular = () => {
    const { modelo, longitud, numTrams, volada, acabadoPerfil } = formData;
    const modeloBase = modelo.replace(' LED', '');
    
    const precioPerfil = PRECIOS[modeloBase]?.['3000']?.[acabadoPerfil] || 500;
    const totalPerfiles = precioPerfil * numTrams;
    
    const precioTapas = 12 * 2 * numTrams;
    const numAntiPullOut = Math.ceil((longitud / 1000) * numTrams * 4);
    const totalAntiPullOut = numAntiPullOut * 6.60;
    
    const m2Vidrio = (longitud / 1000) * (volada / 1000) * numTrams;
    const totalVidrio = m2Vidrio * 95;
    
    const subtotal = totalPerfiles + precioTapas + totalAntiPullOut + totalVidrio;
    const iva = subtotal * 0.21;
    
    setResultado({
      perfiles: totalPerfiles, tapas: precioTapas,
      antiPullOut: totalAntiPullOut, vidrio: totalVidrio,
      subtotal, iva, total: subtotal + iva
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">☂️ Calculador de Marquesinas</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Modelo</label>
                <select value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  {Object.keys(MODELOS).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  {MODELOS[formData.modelo]?.espesores.map(e => <option key={e} value={e}>{e} mm</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Longitud (mm)</label>
                <input type="number" value={formData.longitud} onChange={(e) => setFormData({...formData, longitud: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Num. Tramos</label>
                <input type="number" min="1" value={formData.numTrams} onChange={(e) => setFormData({...formData, numTrams: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Volada (mm)</label>
                <input type="number" value={formData.volada} onChange={(e) => setFormData({...formData, volada: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Acabado Perfil</label>
                <select value={formData.acabadoPerfil} onChange={(e) => setFormData({...formData, acabadoPerfil: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="Raw">Raw</option>
                  <option value="Silver 20">Silver 20</option>
                  <option value="Ral 9010 mate">Ral 9010 mate</option>
                  <option value="Ral 9005 mate">Ral 9005 mate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Intercapa</label>
                <select value={formData.intercapa} onChange={(e) => setFormData({...formData, intercapa: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="SentryGlas">SentryGlas (solo transp.)</option>
                  <option value="DG41">DG41 (todos acabados)</option>
                </select>
              </div>
            </div>

            <button onClick={calcular} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg">
              Calcular Presupuesto
            </button>
          </div>

          <div>
            {resultado ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Presupuesto</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Perfiles:</span><span>{resultado.perfiles.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Tapas:</span><span>{resultado.tapas.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Anti Pull Out:</span><span>{resultado.antiPullOut.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Vidrio:</span><span>{resultado.vidrio.toFixed(2)} €</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-gray-500"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                </div>
                <div className="mt-4 bg-amber-500 text-white rounded-lg p-4 flex justify-between">
                  <span className="font-bold">TOTAL:</span>
                  <span className="text-xl font-bold">{resultado.total.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Configura la marquesina y pulsa Calcular</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CALCULADOR TOP GLASS
// ============================================
function CalculadorTopGlass() {
  const [formData, setFormData] = useState({
    metros: 3, altura: 1100, proveedor: 'Baros Vision',
    espesor: '8+8', acabado: 'Transparente', botones: 4
  });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const { metros, altura, proveedor, espesor, botones } = formData;
    const numVidrios = Math.ceil(metros);
    const m2 = (metros) * (altura / 1000);
    
    const preciosM2 = {
      'Baros Vision': { '6+6': 94, '8+8': 110, '10+10': 145 },
      'Vallesglass': { '6+6': 125.75, '8+8': 155.01, '10+10': 179.26 }
    };
    
    const totalVidrio = m2 * (preciosM2[proveedor]?.[espesor] || 100);
    const totalBotones = numVidrios * botones * 8.30;
    const totalAlineadores = numVidrios * 2 * 10;
    
    const subtotal = totalVidrio + totalBotones + totalAlineadores;
    const iva = subtotal * 0.21;
    
    setResultado({ vidrio: totalVidrio, botones: totalBotones, alineadores: totalAlineadores, subtotal, iva, total: subtotal + iva });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">🔒 Calculador Barandillas Top Glass</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Metros lineales</label>
                <input type="number" step="0.1" value={formData.metros} onChange={(e) => setFormData({...formData, metros: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Altura (mm)</label>
                <input type="number" value={formData.altura} onChange={(e) => setFormData({...formData, altura: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                <select value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="Baros Vision">Baros Vision</option>
                  <option value="Vallesglass">Vallesglass</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="6+6">6+6 mm</option>
                  <option value="8+8">8+8 mm</option>
                  <option value="10+10">10+10 mm</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Botones por vidrio</label>
              <input type="number" min="2" value={formData.botones} onChange={(e) => setFormData({...formData, botones: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <button onClick={calcular} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg">
              Calcular Presupuesto
            </button>
          </div>

          <div>
            {resultado ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Presupuesto</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Vidrio:</span><span>{resultado.vidrio.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Botones:</span><span>{resultado.botones.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Alineadores:</span><span>{resultado.alineadores.toFixed(2)} €</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-gray-500"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                </div>
                <div className="mt-4 bg-purple-600 text-white rounded-lg p-4 flex justify-between">
                  <span className="font-bold">TOTAL:</span>
                  <span className="text-xl font-bold">{resultado.total.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Configura la barandilla y pulsa Calcular</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CALCULADOR ESCALERAS RETRACTILES
// ============================================
function CalculadorEscaleras() {
  const [formData, setFormData] = useState({ modelo: 'ACI_SVEZIA', cantidad: 1, zona: 'peninsula' });
  const [resultado, setResultado] = useState(null);

  const MODELOS = {
    'ACI_SVEZIA': { nombre: 'ACI SVEZIA', precio: 395, transporte: { barcelona: 121, peninsula: 143, baleares: 231 } },
    'PARED_VERTICAL': { nombre: 'PARED VERTICAL', precio: 1033, transporte: { barcelona: 121, peninsula: 143, baleares: 231 } },
    'THERMOBOX_PREMIUM': { nombre: 'THERMOBOX Premium', precio: 2558, transporte: { barcelona: 143, peninsula: 176, baleares: 286 } },
    'THERMOBOX_BASIC': { nombre: 'THERMOBOX Basic', precio: 1975, transporte: { barcelona: 143, peninsula: 176, baleares: 286 } }
  };

  const calcular = () => {
    const modelo = MODELOS[formData.modelo];
    const totalProducto = modelo.precio * formData.cantidad;
    const transporte = modelo.transporte[formData.zona] || 0;
    const subtotal = totalProducto + transporte;
    const iva = subtotal * 0.21;
    setResultado({ producto: totalProducto, transporte, subtotal, iva, total: subtotal + iva });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">🪜 Calculador Escaleras Escamoteables</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {Object.entries(MODELOS).map(([id, m]) => (
              <label key={id} className={`block p-4 rounded-lg border-2 cursor-pointer ${formData.modelo === id ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}`}>
                <input type="radio" name="modelo" value={id} checked={formData.modelo === id}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="sr-only" />
                <div className="font-medium">{m.nombre}</div>
                <div className="text-cyan-600 font-bold">{m.precio.toFixed(2)} €</div>
              </label>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                <input type="number" min="1" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Zona envio</label>
                <select value={formData.zona} onChange={(e) => setFormData({...formData, zona: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="barcelona">Barcelona</option>
                  <option value="peninsula">Peninsula</option>
                  <option value="baleares">Baleares</option>
                </select>
              </div>
            </div>

            <button onClick={calcular} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg">
              Calcular Presupuesto
            </button>
          </div>

          <div>
            {resultado ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Presupuesto</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Producto:</span><span>{resultado.producto.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Transporte:</span><span>{resultado.transporte.toFixed(2)} €</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-gray-500"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                </div>
                <div className="mt-4 bg-cyan-600 text-white rounded-lg p-4 flex justify-between">
                  <span className="font-bold">TOTAL:</span>
                  <span className="text-xl font-bold">{resultado.total.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Selecciona un modelo y pulsa Calcular</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PLACEHOLDER PROXIMAMENTE
// ============================================
function PlaceholderProximamente({ titulo, icono, color }) {
  const colores = { emerald: 'from-emerald-500 to-emerald-600', rose: 'from-rose-500 to-rose-600', red: 'from-red-500 to-red-600' };
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${colores[color]} px-6 py-4`}>
        <h2 className="text-xl font-bold text-white">{icono} {titulo}</h2>
      </div>
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Proximamente</h3>
        <p className="text-gray-500">Este calculador esta en desarrollo.</p>
      </div>
    </div>
  );
}

// ============================================
// PANEL ADMIN
// ============================================
function AdminPanel() {
  const { user } = useAuth();
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚙️ Panel de Administracion
        </h2>
      </div>
      <div className="p-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-purple-800">
            <strong>Usuario:</strong> {user?.email}<br />
            <strong>Rol:</strong> Administrador
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">📊 Gestionar Tarifas</h3>
            <p className="text-sm text-gray-600 mb-3">Importar y actualizar tarifas desde Excel</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
              Subir Excel
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">👥 Usuarios</h3>
            <p className="text-sm text-gray-600 mb-3">Gestionar usuarios del sistema</p>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
              Ver usuarios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
function Dashboard() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('calculadores');
  const [calculadorActivo, setCalculadorActivo] = useState('vidrios');

  const calculadores = [
    { id: 'vidrios', nombre: 'Vidrios', icono: '🪟', color: 'blue', activo: true },
    { id: 'marquesinas', nombre: 'Marquesinas', icono: '☂️', color: 'amber', activo: true },
    { id: 'topglass', nombre: 'Top Glass', icono: '🔒', color: 'purple', activo: true },
    { id: 'escaleras', nombre: 'Escaleras', icono: '🪜', color: 'cyan', activo: true },
    { id: 'allglass', nombre: 'All Glass', icono: '🛡️', color: 'emerald', activo: false },
    { id: 'opera', nombre: "D'Opera", icono: '🎭', color: 'rose', activo: false },
    { id: 'rf', nombre: 'Escaleras RF', icono: '🔥', color: 'red', activo: false },
  ];

  const renderCalculador = () => {
    switch (calculadorActivo) {
      case 'vidrios': return <CalculadorVidrios />;
      case 'marquesinas': return <CalculadorMarquesinas />;
      case 'topglass': return <CalculadorTopGlass />;
      case 'escaleras': return <CalculadorEscaleras />;
      case 'allglass': return <PlaceholderProximamente titulo="Barandillas All Glass" icono="🛡️" color="emerald" />;
      case 'opera': return <PlaceholderProximamente titulo="Escaleras D'Opera" icono="🎭" color="rose" />;
      case 'rf': return <PlaceholderProximamente titulo="Escaleras RF" icono="🔥" color="red" />;
      default: return <CalculadorVidrios />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-bold text-xl px-3 py-1 rounded">RF</div>
            <span className="font-semibold text-gray-800 hidden sm:block">RF Presupuestos</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Boton Calculadores */}
            <button
              onClick={() => setCurrentView('calculadores')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentView === 'calculadores' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calculadores
            </button>

            {/* Boton Admin - Solo para administradores */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentView === 'admin' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Panel Admin</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{profile?.nombre}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                {isAdmin ? 'Administrador' : 'Usuario'}
              </p>
            </div>
            <button onClick={signOut} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'admin' && isAdmin ? (
          <AdminPanel />
        ) : (
          <div className="space-y-6">
            {/* Selector de calculadores */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                {calculadores.map((calc) => (
                  <button
                    key={calc.id}
                    onClick={() => calc.activo && setCalculadorActivo(calc.id)}
                    disabled={!calc.activo}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      calculadorActivo === calc.id
                        ? 'bg-blue-600 text-white'
                        : calc.activo
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{calc.icono}</span>
                    <span className="hidden sm:inline">{calc.nombre}</span>
                    {!calc.activo && <span className="text-xs">(Pronto)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculador activo */}
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
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
