// CalculadorMarquesinas.jsx - Calculador de Marquesinas
// Datos de TARIFA_MARQUESINAS_v2 (Faraone) + Control Glass
import { useState, useEffect } from 'react';

// MODELOS disponibles
const MODELOS = [
  { id: 'LINEA 3 MINI', nombre: 'LINEA 3 MINI', espesores: ['8+8'], voladaMax: 1200 },
  { id: 'LINEA 3 MINI LED', nombre: 'LINEA 3 MINI LED', espesores: ['8+8'], voladaMax: 1200 },
  { id: 'LINEA 3 MAXI', nombre: 'LINEA 3 MAXI', espesores: ['10+10', '12+12'], voladaMax: { '10+10': 1500, '12+12': 1600 } },
  { id: 'LINEA 3 MAXI LED', nombre: 'LINEA 3 MAXI LED', espesores: ['10+10', '12+12'], voladaMax: { '10+10': 1500, '12+12': 1600 } }
];

// ACABADOS perfil
const ACABADOS_PERFIL = ['Raw', 'Silver 20', 'Ral 9010 mate', 'Ral 9005 mate', 'Color especial'];

// INTERCAPAS y acabados vidrio permitidos
const INTERCAPAS = {
  'SentryGlas': { acabados: ['Transparente'], nombre: 'SentryGlas (solo transparente)' },
  'DG41': { acabados: ['Transparente', 'Mate', 'Color'], nombre: 'DG41 (todos los acabados)' }
};

// PRECIOS PERFILES (Faraone)
const PRECIOS_PERFIL = {
  'LINEA 3 MINI': {
    '1500': { 'Raw': 264, 'Silver 20': 309, 'Ral 9010 mate': 334, 'Ral 9005 mate': 334 },
    '2000': { 'Raw': 352, 'Silver 20': 413, 'Ral 9010 mate': 446, 'Ral 9005 mate': 446 },
    '3000': { 'Raw': 527, 'Silver 20': 619, 'Ral 9010 mate': 669, 'Ral 9005 mate': 669 },
    '4000': { 'Raw': 703, 'Silver 20': 825, 'Ral 9010 mate': 891, 'Ral 9005 mate': 891 },
    '6000': { 'Raw': 1055, 'Silver 20': 1238, 'Ral 9010 mate': 1337, 'Ral 9005 mate': 1337 }
  },
  'LINEA 3 MINI LED': {
    '2000': { 'Raw': 394, 'Silver 20': 470, 'Ral 9010 mate': 506, 'Ral 9005 mate': 506 },
    '3000': { 'Raw': 591, 'Silver 20': 704, 'Ral 9010 mate': 759, 'Ral 9005 mate': 759 },
    '4000': { 'Raw': 787, 'Silver 20': 939, 'Ral 9010 mate': 1012, 'Ral 9005 mate': 1012 },
    '6000': { 'Raw': 1180, 'Silver 20': 1409, 'Ral 9010 mate': 1518, 'Ral 9005 mate': 1518 }
  },
  'LINEA 3 MAXI': {
    '10+10': {
      '1500': { 'Raw': 377, 'Silver 20': 442, 'Ral 9010 mate': 477, 'Ral 9005 mate': 477 },
      '2000': { 'Raw': 503, 'Silver 20': 590, 'Ral 9010 mate': 636, 'Ral 9005 mate': 636 },
      '3000': { 'Raw': 755, 'Silver 20': 883, 'Ral 9010 mate': 955, 'Ral 9005 mate': 955 },
      '4000': { 'Raw': 1005, 'Silver 20': 1178, 'Ral 9010 mate': 1273, 'Ral 9005 mate': 1273 },
      '6000': { 'Raw': 1508, 'Silver 20': 1768, 'Ral 9010 mate': 1909, 'Ral 9005 mate': 1909 }
    },
    '12+12': {
      '1500': { 'Raw': 371, 'Silver 20': 436, 'Ral 9010 mate': 471, 'Ral 9005 mate': 471 },
      '2000': { 'Raw': 496, 'Silver 20': 583, 'Ral 9010 mate': 629, 'Ral 9005 mate': 629 },
      '3000': { 'Raw': 745, 'Silver 20': 873, 'Ral 9010 mate': 945, 'Ral 9005 mate': 945 },
      '4000': { 'Raw': 992, 'Silver 20': 1165, 'Ral 9010 mate': 1260, 'Ral 9005 mate': 1260 },
      '6000': { 'Raw': 1488, 'Silver 20': 1748, 'Ral 9010 mate': 1889, 'Ral 9005 mate': 1889 }
    }
  }
};

// PRECIOS TAPAS
const PRECIOS_TAPAS = {
  'LINEA 3 MINI': { 'Raw': 10.80, 'Silver 20': 13.40, 'Ral 9010 mate': 14.40, 'Ral 9005 mate': 14.40, 'Color especial': 21.20 },
  'LINEA 3 MINI LED': { 'Raw': 11.60, 'Silver 20': 14.60, 'Ral 9010 mate': 15.80, 'Ral 9005 mate': 15.80, 'Color especial': 23.30 },
  'LINEA 3 MAXI': { 'Raw': 12.20, 'Silver 20': 14.90, 'Ral 9010 mate': 16.00, 'Ral 9005 mate': 16.00, 'Color especial': 23.50 },
  'LINEA 3 MAXI LED': { 'Raw': 13.20, 'Silver 20': 15.70, 'Ral 9010 mate': 17.10, 'Ral 9005 mate': 17.10, 'Color especial': 25.00 }
};

// ANTI PULL OUT
const PRECIO_ANTIPULLOUT = {
  'LINEA 3 MINI': 6.60,
  'LINEA 3 MINI LED': 6.60,
  'LINEA 3 MAXI': 7.70,
  'LINEA 3 MAXI LED': 7.70
};

// OPERACIONES VIDRIO (Control Glass)
const OPERACIONES_VIDRIO = {
  cantoPulido: 5.96,
  cantoRepolido: 7.68,
  puntaRoma: 6.26
};

const CalculadorMarquesinas = () => {
  const [formData, setFormData] = useState({
    modelo: 'LINEA 3 MINI',
    espesor: '8+8',
    longitudTram: 3000,
    numTrams: 1,
    volada: 1000,
    acabadoPerfil: 'Raw',
    intercapa: 'SentryGlas',
    acabadoVidrio: 'Transparente',
    cantoRepolido: false
  });

  const [espesoresDisp, setEspesoresDisp] = useState(['8+8']);
  const [acabadosVidrioDisp, setAcabadosVidrioDisp] = useState(['Transparente']);
  const [voladaMax, setVoladaMax] = useState(1200);
  const [resultado, setResultado] = useState(null);
  const [errores, setErrores] = useState([]);

  // Actualizar opciones segun modelo
  useEffect(() => {
    const modeloData = MODELOS.find(m => m.id === formData.modelo);
    if (modeloData) {
      setEspesoresDisp(modeloData.espesores);
      if (!modeloData.espesores.includes(formData.espesor)) {
        setFormData(prev => ({ ...prev, espesor: modeloData.espesores[0] }));
      }
      
      if (typeof modeloData.voladaMax === 'number') {
        setVoladaMax(modeloData.voladaMax);
      } else {
        setVoladaMax(modeloData.voladaMax[formData.espesor] || 1500);
      }
    }
  }, [formData.modelo, formData.espesor]);

  // Actualizar acabados vidrio segun intercapa
  useEffect(() => {
    const intercapaData = INTERCAPAS[formData.intercapa];
    if (intercapaData) {
      setAcabadosVidrioDisp(intercapaData.acabados);
      if (!intercapaData.acabados.includes(formData.acabadoVidrio)) {
        setFormData(prev => ({ ...prev, acabadoVidrio: intercapaData.acabados[0] }));
      }
    }
  }, [formData.intercapa]);

  const calcular = () => {
    const errs = [];
    const { modelo, espesor, longitudTram, numTrams, volada, acabadoPerfil, intercapa, acabadoVidrio, cantoRepolido } = formData;

    if (volada > voladaMax) {
      errs.push(`Volada maxima para ${modelo} ${espesor}: ${voladaMax}mm`);
    }
    if (longitudTram < 1000) {
      errs.push('Longitud minima del tramo: 1000mm');
    }

    if (errs.length > 0) {
      setErrores(errs);
      setResultado(null);
      return;
    }
    setErrores([]);

    // Determinar longitud perfil estandar
    const longitudesEstandar = [1500, 2000, 3000, 4000, 6000];
    let longitudPerfil = longitudesEstandar.find(l => l >= longitudTram) || 6000;

    // PRECIO PERFIL
    let precioPerfil = 0;
    if (modelo.includes('MAXI')) {
      precioPerfil = PRECIOS_PERFIL[modelo.replace(' LED', '')]?.[espesor]?.[longitudPerfil.toString()]?.[acabadoPerfil] || 0;
    } else {
      precioPerfil = PRECIOS_PERFIL[modelo]?.[longitudPerfil.toString()]?.[acabadoPerfil] || 0;
    }
    const totalPerfiles = precioPerfil * numTrams;

    // PRECIO TAPAS (2 por tramo)
    const precioTapaUd = PRECIOS_TAPAS[modelo]?.[acabadoPerfil] || PRECIOS_TAPAS[modelo]?.['Raw'] || 10;
    const totalTapas = precioTapaUd * 2 * numTrams;

    // ANTI PULL OUT (4 por metro)
    const metrosTotales = (longitudTram / 1000) * numTrams;
    const numAntiPullOut = Math.ceil(metrosTotales * 4);
    const precioAntiPullOut = PRECIO_ANTIPULLOUT[modelo] || 6.60;
    const totalAntiPullOut = numAntiPullOut * precioAntiPullOut;

    // VIDRIO (Control Glass)
    const numVidriosPorTram = Math.ceil(longitudTram / 1500);
    const longitudVidrioPieza = longitudTram / numVidriosPorTram;
    const numVidriosTotales = numVidriosPorTram * numTrams;
    
    const m2VidrioPieza = (longitudVidrioPieza / 1000) * (volada / 1000);
    const m2VidrioTotal = m2VidrioPieza * numVidriosTotales;
    
    const precioVidrioM2 = espesor === '8+8' ? 95 : espesor === '10+10' ? 120 : 145;
    const totalVidrio = m2VidrioTotal * precioVidrioM2;

    // Cantos
    const perimetroVidrio = 2 * (longitudVidrioPieza / 1000 + volada / 1000);
    const perimetroTotalVidrios = perimetroVidrio * numVidriosTotales;
    const precioCanto = cantoRepolido ? OPERACIONES_VIDRIO.cantoRepolido : OPERACIONES_VIDRIO.cantoPulido;
    const totalCantos = perimetroTotalVidrios * precioCanto;

    // Puntas roma (4 por vidrio)
    const totalPuntas = numVidriosTotales * 4 * OPERACIONES_VIDRIO.puntaRoma;

    // TOTALES
    const subtotal = totalPerfiles + totalTapas + totalAntiPullOut + totalVidrio + totalCantos + totalPuntas;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      modelo,
      espesor,
      longitudTram,
      numTrams,
      volada,
      acabadoPerfil,
      intercapa,
      acabadoVidrio,
      perfiles: { qty: numTrams, longitud: longitudPerfil, unitario: precioPerfil, total: totalPerfiles },
      tapas: { qty: numTrams * 2, unitario: precioTapaUd, total: totalTapas },
      antiPullOut: { qty: numAntiPullOut, unitario: precioAntiPullOut, total: totalAntiPullOut },
      vidrios: { qty: numVidriosTotales, m2: m2VidrioTotal, precioM2: precioVidrioM2, total: totalVidrio },
      cantos: { ml: perimetroTotalVidrios, precio: precioCanto, total: totalCantos },
      puntas: { qty: numVidriosTotales * 4, total: totalPuntas },
      subtotal,
      iva,
      total
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">☂️ Calculador de Marquesinas</h2>
        <p className="text-amber-100 text-sm">Faraone LINEA 3 + Control Glass</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            {/* Modelo y Espesor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Modelo y Espesor</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Modelo</label>
                  <select value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                    {MODELOS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor vidrio</label>
                  <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                    {espesoresDisp.map(e => <option key={e} value={e}>{e} mm</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Volada maxima: {voladaMax}mm</p>
            </div>

            {/* Dimensiones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📏 Dimensiones</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Longitud tramo (mm)</label>
                  <input type="number" value={formData.longitudTram} onChange={(e) => setFormData({...formData, longitudTram: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Num. Tramos</label>
                  <input type="number" min="1" value={formData.numTrams} onChange={(e) => setFormData({...formData, numTrams: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Volada (mm)</label>
                  <input type="number" value={formData.volada} onChange={(e) => setFormData({...formData, volada: parseInt(e.target.value)})}
                    max={voladaMax} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
            </div>

            {/* Acabados */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🎨 Acabados</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado perfil</label>
                  <select value={formData.acabadoPerfil} onChange={(e) => setFormData({...formData, acabadoPerfil: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                    {ACABADOS_PERFIL.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Intercapa vidrio</label>
                  <select value={formData.intercapa} onChange={(e) => setFormData({...formData, intercapa: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                    {Object.entries(INTERCAPAS).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Acabado vidrio</label>
                <select value={formData.acabadoVidrio} onChange={(e) => setFormData({...formData, acabadoVidrio: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                  {acabadosVidrioDisp.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {formData.intercapa === 'SentryGlas' && formData.acabadoVidrio !== 'Transparente' && (
                <p className="text-xs text-red-600 mt-2">⚠️ SentryGlas SOLO permite Transparente</p>
              )}
            </div>

            {/* Opciones vidrio */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Opciones vidrio</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.cantoRepolido} onChange={(e) => setFormData({...formData, cantoRepolido: e.target.checked})}
                  className="w-4 h-4 text-amber-600 rounded" />
                <span className="text-sm">Canto repolido (+1.72 €/ml)</span>
              </label>
            </div>

            {errores.length > 0 && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                {errores.map((e, i) => <p key={i}>⚠️ {e}</p>)}
              </div>
            )}

            <button onClick={calcular} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg">
              📊 Calcular Presupuesto
            </button>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Presupuesto Marquesina</h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <p><strong>{resultado.modelo}</strong> - {resultado.espesor}mm</p>
                  <p>{resultado.numTrams} tramo(s) x {resultado.longitudTram}mm</p>
                  <p>Volada: {resultado.volada}mm | Acabado: {resultado.acabadoPerfil}</p>
                  <p>Vidrio: {resultado.intercapa} {resultado.acabadoVidrio}</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Perfiles ({resultado.perfiles.qty}x {resultado.perfiles.longitud}mm)</span>
                    <span className="font-medium">{resultado.perfiles.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tapas ({resultado.tapas.qty} uds)</span>
                    <span className="font-medium">{resultado.tapas.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anti Pull Out ({resultado.antiPullOut.qty} uds)</span>
                    <span className="font-medium">{resultado.antiPullOut.total.toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>Vidrios ({resultado.vidrios.qty} pcs - {resultado.vidrios.m2.toFixed(2)} m²)</span>
                      <span className="font-medium">{resultado.vidrios.total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Cantos ({resultado.cantos.ml.toFixed(2)} ml)</span>
                      <span>{resultado.cantos.total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Puntas roma ({resultado.puntas.qty} uds)</span>
                      <span>{resultado.puntas.total.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>{resultado.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IVA (21%):</span>
                      <span>{resultado.iva.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500 text-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                <div>
                  <div className="text-5xl mb-3">☂️</div>
                  <p>Configura la marquesina y pulsa <strong>Calcular</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadorMarquesinas;
