// CalculadorVidrios.jsx - Calculador de Vidrios RF Presupuestos
// Amb espessors correctes per laminat (5+5, 6+6, etc.)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

// Tipus de vidre amb els seus espessors disponibles
const TIPOS_VIDRIO = [
  { 
    id: 'laminado', 
    nombre: 'Laminado', 
    espesores: ['5+5', '6+6', '8+8', '10+10', '12+12'],
    descripcion: 'Dos vidres units amb butiral'
  },
  { 
    id: 'laminado_templado', 
    nombre: 'Laminado Templado', 
    espesores: ['6+6', '8+8', '10+10'],
    descripcion: 'Laminat amb vidres templats'
  },
  { 
    id: 'templado', 
    nombre: 'Templado', 
    espesores: ['6', '8', '10', '12'],
    descripcion: 'Vidre temperat monolític'
  },
  { 
    id: 'float', 
    nombre: 'Float / Monolítico', 
    espesores: ['4', '5', '6', '8', '10'],
    descripcion: 'Vidre simple'
  },
];

// Preus base per m2 segons tipus i espesor (de TARIFA_VIDRIOS_MASTER)
const PRECIOS_VIDRIO = {
  'laminado': {
    '5+5': { transparente: 35.54, mate: 41.39 },
    '6+6': { transparente: 38.33, mate: 46.09, gris: 63.95 },
    '8+8': { transparente: 56.09, mate: 65.85, gris: 90.49 },
    '10+10': { transparente: 75.39, mate: 87.85, gris: 113.59 },
    '12+12': { transparente: 113.75, mate: 128.75 }
  },
  'laminado_templado': {
    '6+6': { transparente: 94.00, optico: 109.00, mate: 109.00 },
    '8+8': { transparente: 110.00, mate: 125.00 },
    '10+10': { transparente: 135.00, mate: 150.00 }
  },
  'templado': {
    '6': { transparente: 28.00 },
    '8': { transparente: 35.00 },
    '10': { transparente: 45.00 },
    '12': { transparente: 58.00 }
  },
  'float': {
    '4': { transparente: 12.00 },
    '5': { transparente: 15.00 },
    '6': { transparente: 18.00 },
    '8': { transparente: 25.00 },
    '10': { transparente: 32.00 }
  }
};

// Acabats disponibles segons tipus
const ACABADOS_POR_TIPO = {
  'laminado': ['transparente', 'mate', 'gris'],
  'laminado_templado': ['transparente', 'optico', 'mate'],
  'templado': ['transparente'],
  'float': ['transparente']
};

// Preus de cantos segons espesor (de OPERACIONES_VIDRIOS)
const PRECIOS_CANTOS = {
  'laminado': {
    '5+5': { transparente: 1.20, mate: 1.20, gris: 4.27 },
    '6+6': { transparente: 1.20, mate: 1.20, gris: 4.27 },
    '8+8': { normal: 2.00 },
    '10+10': { normal: 2.00 },
    '12+12': { normal: 2.00 }
  },
  'templado': { normal: 2.40 },
  'laminado_templado': { normal: 0 } // Baros Vision inclou cantos gratis
};

// Preus de puntes
const PRECIOS_PUNTAS = {
  'laminado': { transparente: 2.00, mate: 2.00, gris: 2.40 },
  'templado': { normal: 2.80 },
  'laminado_templado': { normal: 2.80 }
};

const CalculadorVidrios = ({ onGuardar }) => {
  const { user } = useAuth();
  
  // Estat del formulari
  const [formData, setFormData] = useState({
    ancho: '',
    alto: '',
    cantidad: 1,
    tipo: 'laminado',
    espesor: '6+6',
    acabado: 'transparente',
    forma: 'rectangular',
    cantos: false,
    puntas: false,
    taladros: 0,
    diametroTaladro: 50,
  });

  // Espessors disponibles per al tipus seleccionat
  const [espesoresDisponibles, setEspesoresDisponibles] = useState([]);
  const [acabadosDisponibles, setAcabadosDisponibles] = useState([]);
  
  // Resultat
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Actualitzar espessors quan canvia el tipus
  useEffect(() => {
    const tipoSeleccionado = TIPOS_VIDRIO.find(t => t.id === formData.tipo);
    if (tipoSeleccionado) {
      setEspesoresDisponibles(tipoSeleccionado.espesores);
      // Si l'espesor actual no està disponible, seleccionar el primer
      if (!tipoSeleccionado.espesores.includes(formData.espesor)) {
        setFormData(prev => ({ ...prev, espesor: tipoSeleccionado.espesores[0] }));
      }
    }
    
    // Actualitzar acabats
    const acabados = ACABADOS_POR_TIPO[formData.tipo] || ['transparente'];
    setAcabadosDisponibles(acabados);
    if (!acabados.includes(formData.acabado)) {
      setFormData(prev => ({ ...prev, acabado: acabados[0] }));
    }
  }, [formData.tipo]);

  // Calcular
  const calcular = () => {
    const { ancho, alto, cantidad, tipo, espesor, acabado, forma, cantos, puntas, taladros } = formData;
    
    if (!ancho || !alto || parseFloat(ancho) <= 0 || parseFloat(alto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introdueix les mides del vidre' });
      return;
    }

    // Calcular m2
    const anchoM = parseFloat(ancho) / 1000;
    const altoM = parseFloat(alto) / 1000;
    const m2Unidad = anchoM * altoM;
    const m2Total = m2Unidad * parseInt(cantidad);
    
    // Perímetre per cantos
    const perimetroUnidad = 2 * (anchoM + altoM);
    const perimetroTotal = perimetroUnidad * parseInt(cantidad);

    // Obtenir preu base
    const preciosEspesor = PRECIOS_VIDRIO[tipo]?.[espesor];
    if (!preciosEspesor) {
      setMensaje({ tipo: 'error', texto: 'Combinació tipus/espesor no disponible' });
      return;
    }
    
    const precioM2 = preciosEspesor[acabado] || preciosEspesor['transparente'] || Object.values(preciosEspesor)[0];
    let precioBase = precioM2 * m2Total;
    
    // Factor forma
    const factorForma = forma === 'rectangular' ? 1.0 : forma === 'inclinado_pequeño' ? 1.16 : 1.32;
    precioBase *= factorForma;

    // Extras
    const extras = [];
    let totalExtras = 0;

    // Cantos
    if (cantos) {
      let precioCanto = 2.00; // Per defecte
      
      if (tipo === 'laminado') {
        const preciosCantoEspesor = PRECIOS_CANTOS.laminado[espesor];
        if (preciosCantoEspesor) {
          precioCanto = preciosCantoEspesor[acabado] || preciosCantoEspesor['normal'] || 2.00;
        }
      } else if (tipo === 'templado') {
        precioCanto = 2.40;
      } else if (tipo === 'laminado_templado') {
        precioCanto = 0; // Inclòs
      }
      
      const costoCantos = perimetroTotal * precioCanto;
      if (costoCantos > 0) {
        extras.push({
          nombre: 'Cantos pulits',
          detalle: `${perimetroTotal.toFixed(2)} ml x ${precioCanto.toFixed(2)} €/ml`,
          precio: costoCantos
        });
        totalExtras += costoCantos;
      } else if (tipo === 'laminado_templado') {
        extras.push({
          nombre: 'Cantos pulits',
          detalle: 'Inclòs amb Baros Vision',
          precio: 0
        });
      }
    }

    // Puntes
    if (puntas) {
      const numPuntas = 4 * parseInt(cantidad);
      let precioPunta = 2.00;
      
      if (tipo === 'laminado' && acabado === 'gris') {
        precioPunta = 2.40;
      } else if (tipo === 'templado' || tipo === 'laminado_templado') {
        precioPunta = 2.80;
      }
      
      const costoPuntas = numPuntas * precioPunta;
      extras.push({
        nombre: 'Puntes roma',
        detalle: `${numPuntas} uds x ${precioPunta.toFixed(2)} €/ud`,
        precio: costoPuntas
      });
      totalExtras += costoPuntas;
    }

    // Taladros (només templat o laminat templat)
    if (taladros > 0 && (tipo === 'templado' || tipo === 'laminado_templado')) {
      const numTaladros = parseInt(taladros) * parseInt(cantidad);
      const precioTaladro = formData.diametroTaladro <= 50 ? 5.50 : 8.00;
      const costoTaladros = numTaladros * precioTaladro;
      
      extras.push({
        nombre: `Forats Ø${formData.diametroTaladro}mm`,
        detalle: `${numTaladros} uds x ${precioTaladro.toFixed(2)} €/ud`,
        precio: costoTaladros
      });
      totalExtras += costoTaladros;
    }

    const subtotal = precioBase + totalExtras;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      medidas: `${ancho} x ${alto} mm`,
      cantidad: parseInt(cantidad),
      m2Unidad,
      m2Total,
      tipo: TIPOS_VIDRIO.find(t => t.id === tipo)?.nombre,
      espesor,
      acabado: acabado.charAt(0).toUpperCase() + acabado.slice(1),
      forma: forma === 'rectangular' ? 'Rectangular' : forma === 'inclinado_pequeño' ? 'Inclinat petit (+16%)' : 'Inclinat gran (+32%)',
      precioM2,
      precioBase,
      extras,
      totalExtras,
      subtotal,
      iva,
      total
    });
    
    setMensaje(null);
  };

  // Netejar
  const limpiar = () => {
    setFormData({
      ancho: '',
      alto: '',
      cantidad: 1,
      tipo: 'laminado',
      espesor: '6+6',
      acabado: 'transparente',
      forma: 'rectangular',
      cantos: false,
      puntas: false,
      taladros: 0,
      diametroTaladro: 50,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🪟 Calculador de Vidres
        </h2>
        <p className="text-blue-100 text-sm mt-1">Preus segons TARIFA_VIDRIOS_MASTER</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna esquerra - Formulari */}
          <div className="space-y-4">
            {/* Mides */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Mides</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ample (mm)</label>
                  <input
                    type="number"
                    value={formData.ancho}
                    onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    placeholder="1000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Alt (mm)</label>
                  <input
                    type="number"
                    value={formData.alto}
                    onChange={(e) => setFormData({...formData, alto: e.target.value})}
                    placeholder="1500"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantitat</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tipus de vidre */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔍 Tipus de Vidre</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {TIPOS_VIDRIO.map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => setFormData({...formData, tipo: tipo.id})}
                    className={`p-3 rounded-lg text-left transition-all ${
                      formData.tipo === tipo.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{tipo.nombre}</div>
                    <div className="text-xs text-gray-500">{tipo.descripcion}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Espesor i Acabat */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📏 Especificacions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor}
                    onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {espesoresDisponibles.map(esp => (
                      <option key={esp} value={esp}>{esp} mm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabat</label>
                  <select
                    value={formData.acabado}
                    onChange={(e) => setFormData({...formData, acabado: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {acabadosDisponibles.map(ac => (
                      <option key={ac} value={ac}>
                        {ac.charAt(0).toUpperCase() + ac.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Forma */}
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Forma</label>
                <select
                  value={formData.forma}
                  onChange={(e) => setFormData({...formData, forma: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rectangular">Rectangular (sense recàrrec)</option>
                  <option value="inclinado_pequeño">Inclinat petit (+16%)</option>
                  <option value="inclinado_grande">Inclinat gran (+32%)</option>
                </select>
              </div>
            </div>

            {/* Processos adicionals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Processos Adicionals</h3>
              <div className="space-y-3">
                {/* Cantos */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cantos}
                    onChange={(e) => setFormData({...formData, cantos: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Cantos pulits</span>
                  {formData.tipo === 'laminado_templado' && (
                    <span className="text-xs text-green-600 ml-2">(Inclòs amb Baros Vision)</span>
                  )}
                </label>

                {/* Puntes */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.puntas}
                    onChange={(e) => setFormData({...formData, puntas: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Puntes roma (4 per peça)</span>
                </label>

                {/* Taladros (només templat) */}
                {(formData.tipo === 'templado' || formData.tipo === 'laminado_templado') && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Forats:</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.taladros}
                      onChange={(e) => setFormData({...formData, taladros: e.target.value})}
                      className="w-20 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.taladros > 0 && (
                      <select
                        value={formData.diametroTaladro}
                        onChange={(e) => setFormData({...formData, diametroTaladro: parseInt(e.target.value)})}
                        className="px-2 py-1 border rounded-lg text-sm"
                      >
                        <option value="50">Ø ≤50mm (5.50€)</option>
                        <option value="100">Ø 50-100mm (8.00€)</option>
                      </select>
                    )}
                  </div>
                )}
                
                {formData.tipo === 'laminado' && formData.taladros > 0 && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Els forats només es poden fer en vidre templat
                  </p>
                )}
              </div>
            </div>

            {/* Missatge */}
            {mensaje && (
              <div className={`p-3 rounded-lg ${
                mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {mensaje.texto}
              </div>
            )}

            {/* Botons */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                📊 Calcular
              </button>
              <button
                onClick={limpiar}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                🗑️ Netejar
              </button>
            </div>
          </div>

          {/* Columna dreta - Resultat */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Resum del Pressupost</h3>
                
                {/* Desglossament */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Tipus:</div>
                    <div className="font-medium">{resultado.tipo}</div>
                    <div className="text-gray-600">Espesor:</div>
                    <div className="font-medium">{resultado.espesor} mm</div>
                    <div className="text-gray-600">Acabat:</div>
                    <div className="font-medium">{resultado.acabado}</div>
                    <div className="text-gray-600">Forma:</div>
                    <div className="font-medium">{resultado.forma}</div>
                    <div className="text-gray-600">Mides:</div>
                    <div className="font-medium">{resultado.medidas}</div>
                    <div className="text-gray-600">Quantitat:</div>
                    <div className="font-medium">{resultado.cantidad} uds</div>
                    <div className="text-gray-600">m² per unitat:</div>
                    <div className="font-medium">{resultado.m2Unidad.toFixed(3)} m²</div>
                    <div className="text-gray-600">m² total:</div>
                    <div className="font-medium">{resultado.m2Total.toFixed(3)} m²</div>
                    <div className="text-gray-600">Preu/m²:</div>
                    <div className="font-medium">{resultado.precioM2.toFixed(2)} €/m²</div>
                  </div>
                </div>

                {/* Preus */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Vidre base ({resultado.m2Total.toFixed(2)} m²):</span>
                    <span className="font-medium">{resultado.precioBase.toFixed(2)} €</span>
                  </div>
                  
                  {resultado.extras.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm text-gray-600 mb-1">Extras:</div>
                      {resultado.extras.map((extra, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-2">
                          <span className="text-gray-600">
                            {extra.nombre}
                            <span className="text-xs text-gray-400 ml-1">({extra.detalle})</span>
                          </span>
                          <span>{extra.precio.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">{resultado.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>IVA (21%):</span>
                      <span>{resultado.iva.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-blue-600 text-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 h-full flex items-center justify-center min-h-[400px]">
                <div>
                  <div className="text-5xl mb-3">📊</div>
                  <p>Introdueix les dades i prem <strong>Calcular</strong></p>
                  <p className="text-sm mt-2">El resultat apareixerà aquí</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadorVidrios;
