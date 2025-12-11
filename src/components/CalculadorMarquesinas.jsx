// ============================================================
// CALCULADOR DE MARQUESINAS - RF PRESUPUESTOS
// ============================================================
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const CalculadorMarquesinas = () => {
  // ============================================================
  // STATE
  // ============================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  
  // Dades carregades
  const [componentes, setComponentes] = useState([]);
  const [vidriosMarquesinas, setVidriosMarquesinas] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  
  // Configuració marquesina
  const [config, setConfig] = useState({
    longitudTotal: '', // mm
    volada: '', // mm
    modelo: '',
    espesor: '',
    pvb: 'SentryGlas', // SentryGlas o DG
    acabadoVidrio: 'Transparente',
    acabadoPerfil: 'Raw',
    conLed: false,
    cantoPulido: true,
    cantoRepulido: false, // Ara es pot marcar juntament amb pulido
    puntasRoma: true,
    cantidadPuntas: 4 // por vidrio
  });

  // ============================================================
  // CONSTANTS
  // ============================================================
  const MODELOS = [
    { value: 'LINEA 3 MINI', label: 'LINEA 3 MINI', espesores: ['8+8'], voladaMax: 1200 },
    { value: 'LINEA 3 MINI LED', label: 'LINEA 3 MINI LED', espesores: ['8+8'], voladaMax: 1200 },
    { value: 'LINEA 3 MAXI', label: 'LINEA 3 MAXI', espesores: ['10+10', '12+12'], voladaMax: { '10+10': 1500, '12+12': 1600 } },
    { value: 'LINEA 3 MAXI LED', label: 'LINEA 3 MAXI LED', espesores: ['10+10', '12+12'], voladaMax: { '10+10': 1500, '12+12': 1600 } }
  ];

  const ACABADOS_PERFIL = [
    { value: 'Raw', label: 'Raw (Aluminio natural)' },
    { value: 'Silver 20', label: 'Silver 20' },
    { value: 'Ral 9010 mate', label: 'RAL 9010 Mate (Blanco)' },
    { value: 'Ral 9005 mate', label: 'RAL 9005 Mate (Negro)' },
    { value: 'Color especial', label: 'Color Especial' }
  ];

  const LONGITUDES_PERFIL = [1500, 2000, 3000, 4000, 6000];

  // ============================================================
  // CARGAR DATOS
  // ============================================================
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar componentes marquesinas
      const { data: compData, error: compError } = await supabase
        .from('componentes_marquesinas')
        .select('*')
        .eq('activo', true);
      
      if (compError) throw compError;
      setComponentes(compData || []);
      
      // Cargar vidrios marquesinas
      const { data: vidData, error: vidError } = await supabase
        .from('vidrios_master')
        .select('*')
        .eq('categoria', 'MARQUESINAS')
        .eq('activo', true);
      
      if (vidError) throw vidError;
      setVidriosMarquesinas(vidData || []);
      
      // Cargar operaciones marquesinas
      const { data: opData, error: opError } = await supabase
        .from('operaciones')
        .select('*')
        .eq('aplica_a', 'MARQUESINAS')
        .eq('activo', true);
      
      if (opError) throw opError;
      setOperaciones(opData || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando datos de marquesinas');
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (field, value) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Si cambia modelo, ajustar espesor
      if (field === 'modelo') {
        const modelo = MODELOS.find(m => m.value === value);
        if (modelo) {
          newConfig.espesor = modelo.espesores[0];
          newConfig.conLed = value.includes('LED');
        }
      }
      
      // Si cambia PVB, ajustar acabado vidrio
      if (field === 'pvb') {
        if (value === 'SentryGlas') {
          newConfig.acabadoVidrio = 'Transparente';
        }
      }
      
      return newConfig;
    });
    setResultado(null);
    setError(null);
  };

  // ============================================================
  // CALCULAR PRESUPUESTO
  // ============================================================
  const calcularPresupuesto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { longitudTotal, volada, modelo, espesor, pvb, acabadoVidrio, acabadoPerfil, cantoPulido, cantoRepulido, puntasRoma, cantidadPuntas } = config;
      
      // Validaciones
      if (!longitudTotal || longitudTotal <= 0) {
        throw new Error('Introduce la longitud total de la marquesina');
      }
      if (!volada || volada <= 0) {
        throw new Error('Introduce la volada de la marquesina');
      }
      if (!modelo) {
        throw new Error('Selecciona un modelo de marquesina');
      }
      
      // Validar volada máxima
      const modeloData = MODELOS.find(m => m.value === modelo);
      const voladaMaxima = typeof modeloData.voladaMax === 'object' 
        ? modeloData.voladaMax[espesor] 
        : modeloData.voladaMax;
      
      if (parseInt(volada) > voladaMaxima) {
        throw new Error(`La volada máxima para ${modelo} con vidrio ${espesor} es ${voladaMaxima}mm`);
      }
      
      // ============================================================
      // CÁLCULO DE TRAMS
      // ============================================================
      const longTotal = parseInt(longitudTotal);
      const trams = [];
      let longitudRestante = longTotal;
      
      // Ordenar longitudes de mayor a menor
      const longitudesOrdenadas = [...LONGITUDES_PERFIL].sort((a, b) => b - a);
      
      while (longitudRestante > 0) {
        // Buscar la longitud de perfil más adecuada
        let longitudPerfil = longitudesOrdenadas.find(l => l <= longitudRestante) || 1500;
        
        // Si es menor a 1500, es corte a medida
        const esCorteAMedida = longitudRestante < 1500;
        
        if (esCorteAMedida) {
          longitudPerfil = longitudRestante;
        }
        
        trams.push({
          longitud: Math.min(longitudPerfil, longitudRestante),
          esCorteAMedida
        });
        
        longitudRestante -= longitudPerfil;
      }
      
      // ============================================================
      // CÁLCULO DE VIDRIOS POR TRAM
      // ============================================================
      const MAX_LONGITUD_VIDRIO = 1500;
      const voladaMm = parseInt(volada);
      
      const vidriosPorTram = trams.map(tram => {
        const numVidrios = Math.ceil(tram.longitud / MAX_LONGITUD_VIDRIO);
        const longitudVidrio = Math.round(tram.longitud / numVidrios);
        return {
          ...tram,
          numVidrios,
          longitudVidrio,
          alturaVidrio: voladaMm
        };
      });
      
      // ============================================================
      // BUSCAR PRECIOS
      // ============================================================
      
      // Modelo base para buscar (sin LED, se añade después)
      const modeloBase = modelo.replace(' LED', '');
      const modeloBusqueda = config.conLed ? modelo : modeloBase;
      
      // 1. PERFILES
      let totalPerfiles = 0;
      const detallePerfiles = [];
      
      for (const tram of vidriosPorTram) {
        // Buscar perfil
        const perfil = componentes.find(c => 
          c.tipo === 'PERFIL' &&
          c.modelo.trim() === modeloBusqueda.trim() &&
          c.longitud === tram.longitud &&
          c.espesor_mm === espesor &&
          c.acabado === acabadoPerfil
        );
        
        if (perfil) {
          totalPerfiles += perfil.precio;
          detallePerfiles.push({
            descripcion: `Perfil ${modeloBusqueda} ${tram.longitud}mm ${acabadoPerfil}`,
            cantidad: 1,
            precioUnitario: perfil.precio,
            total: perfil.precio
          });
        } else if (tram.esCorteAMedida) {
          // Buscar el perfil de 1500 y aplicar corte a medida
          const perfilBase = componentes.find(c => 
            c.tipo === 'PERFIL' &&
            c.modelo.trim() === modeloBusqueda.trim() &&
            c.longitud === 1500 &&
            c.espesor_mm === espesor &&
            c.acabado === acabadoPerfil
          );
          
          if (perfilBase) {
            totalPerfiles += perfilBase.precio;
            detallePerfiles.push({
              descripcion: `Perfil ${modeloBusqueda} 1500mm (corte a ${tram.longitud}mm) ${acabadoPerfil}`,
              cantidad: 1,
              precioUnitario: perfilBase.precio,
              total: perfilBase.precio
            });
          }
        }
      }
      
      // 2. TAPAS (1 izq + 1 der por tram)
      let totalTapas = 0;
      const detalleTapas = [];
      
      const tapaIzq = componentes.find(c => 
        c.tipo === 'TAPA IZQUIERDA' &&
        c.modelo.trim().includes(modeloBase) &&
        c.acabado === acabadoPerfil
      );
      
      const tapaDer = componentes.find(c => 
        c.tipo === 'TAPA DERECHA' &&
        c.modelo.trim().includes(modeloBase) &&
        c.acabado === acabadoPerfil
      );
      
      if (tapaIzq && tapaDer) {
        const numTrams = vidriosPorTram.length;
        totalTapas = (tapaIzq.precio + tapaDer.precio) * numTrams;
        detalleTapas.push({
          descripcion: `Tapas ${modeloBase} ${acabadoPerfil} (izq + der)`,
          cantidad: numTrams,
          precioUnitario: tapaIzq.precio + tapaDer.precio,
          total: totalTapas
        });
      }
      
      // 3. ANTI PULL OUT (4 por metro)
      let totalAntiPullOut = 0;
      const detalleAntiPullOut = [];
      
      const antiPullOut = componentes.find(c => 
        c.tipo === 'ANTI PULL OUT KIT' &&
        c.modelo.trim().includes(modeloBase)
      );
      
      if (antiPullOut) {
        const metrosTotales = longTotal / 1000;
        const cantidadAPO = Math.ceil(metrosTotales * 4);
        totalAntiPullOut = antiPullOut.precio * cantidadAPO;
        detalleAntiPullOut.push({
          descripcion: `Anti Pull Out Kit ${modeloBase}`,
          cantidad: cantidadAPO,
          precioUnitario: antiPullOut.precio,
          total: totalAntiPullOut
        });
      }
      
      // 4. VIDRIOS
      let totalVidrios = 0;
      const detalleVidrios = [];
      
      const vidrio = vidriosMarquesinas.find(v => 
        v.espesor_mm === espesor &&
        v.pvb === pvb &&
        (pvb === 'SentryGlas' ? v.acabado === 'Transparente' : v.acabado.includes(acabadoVidrio))
      );
      
      if (vidrio) {
        let m2TotalVidrios = 0;
        
        for (const tram of vidriosPorTram) {
          const m2Vidrio = (tram.longitudVidrio / 1000) * (tram.alturaVidrio / 1000);
          m2TotalVidrios += m2Vidrio * tram.numVidrios;
        }
        
        totalVidrios = vidrio.precio_m2 * m2TotalVidrios;
        
        const totalPiezasVidrio = vidriosPorTram.reduce((acc, t) => acc + t.numVidrios, 0);
        
        detalleVidrios.push({
          descripcion: `Vidrio ${espesor} ${pvb} ${vidrio.acabado}`,
          cantidad: `${m2TotalVidrios.toFixed(2)} m² (${totalPiezasVidrio} piezas)`,
          precioUnitario: vidrio.precio_m2,
          total: totalVidrios
        });
      }
      
      // 5. OPERACIONES VIDRIO
      let totalOperaciones = 0;
      const detalleOperaciones = [];
      
      // Perímetro total de vidrios
      let perimetroTotal = 0;
      let numPuntasTotal = 0;
      
      for (const tram of vidriosPorTram) {
        const perimetroVidrio = 2 * (tram.longitudVidrio + tram.alturaVidrio) / 1000;
        perimetroTotal += perimetroVidrio * tram.numVidrios;
        numPuntasTotal += cantidadPuntas * tram.numVidrios;
      }
      
      // Canto pulido (es pot combinar amb repulido)
      if (cantoPulido) {
        const opCanto = operaciones.find(o => o.descripcion.toLowerCase().includes('canto pulido') && !o.descripcion.toLowerCase().includes('repulido'));
        if (opCanto) {
          const costoCanto = opCanto.precio * perimetroTotal;
          totalOperaciones += costoCanto;
          detalleOperaciones.push({
            descripcion: 'Canto pulido',
            cantidad: `${perimetroTotal.toFixed(2)} ml`,
            precioUnitario: opCanto.precio,
            total: costoCanto
          });
        }
      }
      
      // Canto repulido (es pot combinar amb pulido)
      if (cantoRepulido) {
        const opRepulido = operaciones.find(o => o.descripcion.toLowerCase().includes('repulido'));
        if (opRepulido) {
          const costoRepulido = opRepulido.precio * perimetroTotal;
          totalOperaciones += costoRepulido;
          detalleOperaciones.push({
            descripcion: 'Canto repulido',
            cantidad: `${perimetroTotal.toFixed(2)} ml`,
            precioUnitario: opRepulido.precio,
            total: costoRepulido
          });
        }
      }
      
      // Puntas roma
      if (puntasRoma && cantidadPuntas > 0) {
        const opPuntas = operaciones.find(o => o.descripcion.toLowerCase().includes('punta'));
        if (opPuntas) {
          const costoPuntas = opPuntas.precio * numPuntasTotal;
          totalOperaciones += costoPuntas;
          detalleOperaciones.push({
            descripcion: 'Puntas roma',
            cantidad: numPuntasTotal,
            precioUnitario: opPuntas.precio,
            total: costoPuntas
          });
        }
      }
      
      // ============================================================
      // TOTAL
      // ============================================================
      const subtotalComponentes = totalPerfiles + totalTapas + totalAntiPullOut;
      const subtotalVidrios = totalVidrios + totalOperaciones;
      const total = subtotalComponentes + subtotalVidrios;
      
      setResultado({
        config: { ...config, longitudTotal: longTotal, volada: voladaMm },
        trams: vidriosPorTram,
        desglose: {
          perfiles: { items: detallePerfiles, total: totalPerfiles },
          tapas: { items: detalleTapas, total: totalTapas },
          antiPullOut: { items: detalleAntiPullOut, total: totalAntiPullOut },
          vidrios: { items: detalleVidrios, total: totalVidrios },
          operaciones: { items: detalleOperaciones, total: totalOperaciones }
        },
        subtotales: {
          componentes: subtotalComponentes,
          vidrios: subtotalVidrios
        },
        total
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error calculando:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const modeloSeleccionado = MODELOS.find(m => m.value === config.modelo);
  const espesoresDisponibles = modeloSeleccionado?.espesores || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        🏗️ Calculador de Marquesinas
      </h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-medium">⚠️ Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA - CONFIGURACIÓN */}
        <div className="space-y-6">
          {/* MEDIDAS */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">1. Medidas</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitud Total (mm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={config.longitudTotal}
                  onChange={(e) => handleChange('longitudTotal', e.target.value)}
                  placeholder="Ej: 5000"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volada (mm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={config.volada}
                  onChange={(e) => handleChange('volada', e.target.value)}
                  placeholder="Ej: 1200"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {modeloSeleccionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máx: {typeof modeloSeleccionado.voladaMax === 'object' 
                      ? modeloSeleccionado.voladaMax[config.espesor] 
                      : modeloSeleccionado.voladaMax}mm
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* MODELO Y ACABADOS */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">2. Modelo y Acabados</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona modelo...</option>
                  {MODELOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Espesor Vidrio
                  </label>
                  <select
                    value={config.espesor}
                    onChange={(e) => handleChange('espesor', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!config.modelo}
                  >
                    {espesoresDisponibles.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acabado Perfil
                  </label>
                  <select
                    value={config.acabadoPerfil}
                    onChange={(e) => handleChange('acabadoPerfil', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {ACABADOS_PERFIL.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* VIDRIO */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-purple-800 mb-4">3. Vidrio</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intercapa (PVB)
                </label>
                <select
                  value={config.pvb}
                  onChange={(e) => handleChange('pvb', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SentryGlas">SentryGlas (Transparente)</option>
                  <option value="DG">DG - Structural Grade</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Acabado Vidrio
                </label>
                <select
                  value={config.acabadoVidrio}
                  onChange={(e) => handleChange('acabadoVidrio', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={config.pvb === 'SentryGlas'}
                >
                  <option value="Transparente">Transparente</option>
                  {config.pvb === 'DG' && (
                    <option value="Mate + Color">Mate / Color</option>
                  )}
                </select>
                {config.pvb === 'SentryGlas' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ SentryGlas solo disponible en Transparente
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* OPERACIONES */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-orange-800 mb-4">4. Operaciones Vidrio</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.cantoPulido}
                  onChange={(e) => handleChange('cantoPulido', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span>Canto pulido</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.cantoRepulido}
                  onChange={(e) => handleChange('cantoRepulido', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span>Canto repulido (mayor calidad)</span>
              </label>
              
              {config.cantoPulido && config.cantoRepulido && (
                <p className="text-xs text-blue-600 ml-8">
                  ✓ Se aplicarán ambos procesos (pulido + repulido)
                </p>
              )}
              
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={config.puntasRoma}
                  onChange={(e) => handleChange('puntasRoma', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span>Puntas roma</span>
                {config.puntasRoma && (
                  <input
                    type="number"
                    value={config.cantidadPuntas}
                    onChange={(e) => handleChange('cantidadPuntas', parseInt(e.target.value) || 0)}
                    min="0"
                    max="8"
                    className="w-20 p-2 border rounded-lg text-center"
                  />
                )}
                <span className="text-sm text-gray-500">por vidrio</span>
              </div>
            </div>
          </div>
          
          {/* BOTÓN CALCULAR */}
          <button
            onClick={calcularPresupuesto}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Calculando...' : '🧮 Calcular Presupuesto'}
          </button>
        </div>
        
        {/* COLUMNA DERECHA - RESULTADO */}
        <div>
          {resultado && (
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Resumen del Presupuesto</h2>
              
              {/* Info general */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium">{resultado.config.modelo}</p>
                <p className="text-sm text-gray-600">
                  {resultado.config.longitudTotal}mm × {resultado.config.volada}mm volada
                </p>
                <p className="text-sm text-gray-600">
                  Vidrio {resultado.config.espesor} {resultado.config.pvb}
                </p>
                <p className="text-sm text-gray-600">
                  {resultado.trams.length} tram(s) - {resultado.trams.reduce((a, t) => a + t.numVidrios, 0)} vidrios
                </p>
              </div>
              
              {/* Desglose */}
              <div className="space-y-4">
                {/* Componentes Faraone */}
                <div>
                  <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">
                    Componentes (Faraone)
                  </h3>
                  
                  {resultado.desglose.perfiles.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.descripcion}</span>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  
                  {resultado.desglose.tapas.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.descripcion} ×{item.cantidad}</span>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  
                  {resultado.desglose.antiPullOut.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.descripcion} ×{item.cantidad}</span>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between font-semibold text-blue-700 border-t pt-2 mt-2">
                    <span>Subtotal Componentes</span>
                    <span>{resultado.subtotales.componentes.toFixed(2)}€</span>
                  </div>
                </div>
                
                {/* Vidrios Control Glass */}
                <div>
                  <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">
                    Vidrios (Control Glass)
                  </h3>
                  
                  {resultado.desglose.vidrios.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.descripcion}</span>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  
                  {resultado.desglose.operaciones.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{item.descripcion} ({item.cantidad})</span>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between font-semibold text-purple-700 border-t pt-2 mt-2">
                    <span>Subtotal Vidrios</span>
                    <span>{resultado.subtotales.vidrios.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
              
              {/* TOTAL */}
              <div className="bg-blue-600 text-white rounded-lg p-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">TOTAL</span>
                  <span className="text-2xl font-bold">{resultado.total.toFixed(2)}€</span>
                </div>
              </div>
              
              {/* Botón guardar */}
              <button
                className="w-full mt-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
              >
                💾 Guardar Presupuesto
              </button>
            </div>
          )}
          
          {!resultado && !loading && (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500 text-lg">
                Configura la marquesina y pulsa<br />
                <strong>"Calcular Presupuesto"</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadorMarquesinas;
