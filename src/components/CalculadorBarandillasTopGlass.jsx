// CalculadorBarandillasTopGlass.jsx - Calculador Barandillas Top Glass
// Datos de TARIFA_TOP_GLASS (herrajes + vidrio laminado templado)
import { useState, useEffect } from 'react';

// VIDRIOS LAMINADO TEMPLADO (de TARIFA_TOP_GLASS)
const VIDRIOS = {
  'Vallesglass': {
    '6+6': { 'Transparente': 125.75 },
    '8+8': { 'Transparente': 155.01 },
    '10+10': { 'Transparente': 179.26 }
  },
  'Baros Vision': {
    '6+6': { 
      '2 butirales': { 'Transparente': 94.00, 'Optico': 109.00, 'Mate + Transparente': 101.00, 'Mate + Color': 109.00 },
      '4 butirales': { 'Transparente': 100.00, 'Optico': 115.00, 'Mate + Transparente': 107.00, 'Mate + Color': 115.00 }
    },
    '8+8': { 
      '2 butirales': { 'Transparente': 110.00, 'Optico': 125.00 },
      '4 butirales': { 'Transparente': 116.00, 'Optico': 131.00 }
    },
    '10+10': { 
      '2 butirales': { 'Transparente': 145.00, 'Optico': 160.00 },
      '4 butirales': { 'Transparente': 151.00, 'Optico': 166.00 }
    }
  }
};

// HERRAJES (de TARIFA_TOP_GLASS)
const HERRAJES = {
  botones: {
    'India 50mm Inox Satinado': 8.30,
    'India 50mm Inox Brillo': 8.56,
    'India 50mm RAL 9010': 16.10,
    'India 50mm RAL 9005': 16.10
  },
  alineadores: {
    'India Redondo Inox Satinado': 10.00,
    'India Redondo RAL 9010': 17.50,
    'India Redondo RAL 9005': 17.50,
    'RX Polska Rectangular Inox': 8.57,
    'RX Polska Rectangular RAL 9010': 16.07,
    'RX Polska Rectangular RAL 9005': 16.07
  },
  fijaciones: {
    'Tamiz M10x80': 1.10,
    'Tornillo M10x30': 0.27
  }
};

// OPERACIONES
const OPERACIONES = {
  cantoVallesglass: 2.40,
  cantoBaros: 0,
  puntaRoma: 2.80,
  taladroVallesglass: 5.50,
  taladroBaros: 0,
  cnc: 18.00
};

const CalculadorBarandillasTopGlass = () => {
  const [formData, setFormData] = useState({
    metrosLineales: 3,
    alturaVidrio: 1100,
    proveedor: 'Baros Vision',
    espesor: '8+8',
    pvb: '2 butirales',
    acabadoVidrio: 'Transparente',
    tipoBoton: 'India 50mm Inox Satinado',
    botonesXVidrio: 4,
    tipoAlineador: 'India Redondo Inox Satinado',
    alineadoresXVidrio: 2,
    cantos: true,
    puntas: true,
    taladros: 4,
    formaIrregular: false
  });

  const [acabadosDisp, setAcabadosDisp] = useState(['Transparente']);
  const [pvbDisp, setPvbDisp] = useState(['2 butirales', '4 butirales']);
  const [resultado, setResultado] = useState(null);

  // Actualizar opciones segun proveedor
  useEffect(() => {
    const { proveedor, espesor, pvb } = formData;
    
    if (proveedor === 'Vallesglass') {
      setAcabadosDisp(['Transparente']);
      setPvbDisp([]);
      setFormData(prev => ({ ...prev, acabadoVidrio: 'Transparente', pvb: '' }));
    } else {
      setPvbDisp(['2 butirales', '4 butirales']);
      const acabados = VIDRIOS['Baros Vision']?.[espesor]?.[pvb || '2 butirales'];
      if (acabados) {
        setAcabadosDisp(Object.keys(acabados));
      }
    }
  }, [formData.proveedor, formData.espesor, formData.pvb]);

  const calcular = () => {
    const { metrosLineales, alturaVidrio, proveedor, espesor, pvb, acabadoVidrio, 
            tipoBoton, botonesXVidrio, tipoAlineador, alineadoresXVidrio,
            cantos, puntas, taladros, formaIrregular } = formData;

    // Vidrios: asumimos piezas de ~1000mm ancho
    const anchoVidrio = 1000;
    const numVidrios = Math.ceil((metrosLineales * 1000) / anchoVidrio);
    const m2Vidrio = (anchoVidrio / 1000) * (alturaVidrio / 1000) * numVidrios;
    const perimetroTotal = 2 * (anchoVidrio / 1000 + alturaVidrio / 1000) * numVidrios;

    // Precio vidrio
    let precioM2 = 0;
    if (proveedor === 'Vallesglass') {
      precioM2 = VIDRIOS['Vallesglass']?.[espesor]?.['Transparente'] || 0;
    } else {
      precioM2 = VIDRIOS['Baros Vision']?.[espesor]?.[pvb]?.[acabadoVidrio] || 0;
    }
    let totalVidrio = m2Vidrio * precioM2;

    // CNC si forma irregular
    if (formaIrregular) {
      totalVidrio += numVidrios * OPERACIONES.cnc;
    }

    // Herrajes
    const numBotones = numVidrios * botonesXVidrio;
    const precioBoton = HERRAJES.botones[tipoBoton] || 8.30;
    const totalBotones = numBotones * precioBoton;

    const numAlineadores = numVidrios * alineadoresXVidrio;
    const precioAlineador = HERRAJES.alineadores[tipoAlineador] || 10.00;
    const totalAlineadores = numAlineadores * precioAlineador;

    // Fijaciones (2 por boton)
    const numTamiz = numBotones * 2;
    const numTornillos = numBotones * 2;
    const totalFijaciones = numTamiz * HERRAJES.fijaciones['Tamiz M10x80'] + numTornillos * HERRAJES.fijaciones['Tornillo M10x30'];

    // Operaciones vidrio
    let totalCantos = 0;
    if (cantos) {
      const precioCanto = proveedor === 'Baros Vision' ? OPERACIONES.cantoBaros : OPERACIONES.cantoVallesglass;
      totalCantos = perimetroTotal * precioCanto;
    }

    let totalPuntas = 0;
    if (puntas) {
      totalPuntas = numVidrios * 4 * OPERACIONES.puntaRoma;
    }

    let totalTaladros = 0;
    if (taladros > 0) {
      const precioTaladro = proveedor === 'Baros Vision' ? OPERACIONES.taladroBaros : OPERACIONES.taladroVallesglass;
      totalTaladros = numVidrios * taladros * precioTaladro;
    }

    // Totales
    const subtotal = totalVidrio + totalBotones + totalAlineadores + totalFijaciones + totalCantos + totalPuntas + totalTaladros;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      metrosLineales,
      alturaVidrio,
      numVidrios,
      m2Vidrio,
      proveedor,
      espesor,
      acabadoVidrio,
      vidrio: { m2: m2Vidrio, precioM2, total: totalVidrio, cnc: formaIrregular },
      botones: { qty: numBotones, tipo: tipoBoton, unitario: precioBoton, total: totalBotones },
      alineadores: { qty: numAlineadores, tipo: tipoAlineador, unitario: precioAlineador, total: totalAlineadores },
      fijaciones: { tamiz: numTamiz, tornillos: numTornillos, total: totalFijaciones },
      cantos: { ml: perimetroTotal, total: totalCantos, gratis: proveedor === 'Baros Vision' },
      puntas: { qty: numVidrios * 4, total: totalPuntas },
      taladros: { qty: numVidrios * taladros, total: totalTaladros, gratis: proveedor === 'Baros Vision' },
      subtotal,
      iva,
      total
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🔒 Calculador Barandillas Top Glass</h2>
        <p className="text-purple-100 text-sm">Vidrio laminado templado + herrajes</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            {/* Dimensiones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📏 Dimensiones</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Metros lineales</label>
                  <input type="number" step="0.1" value={formData.metrosLineales} 
                    onChange={(e) => setFormData({...formData, metrosLineales: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Altura vidrio (mm)</label>
                  <input type="number" value={formData.alturaVidrio} 
                    onChange={(e) => setFormData({...formData, alturaVidrio: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>

            {/* Vidrio */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪟 Vidrio Laminado Templado</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                  <select value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="Baros Vision">Baros Vision (cantos/taladros incluidos)</option>
                    <option value="Vallesglass">Vallesglass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="6+6">6+6 mm</option>
                    <option value="8+8">8+8 mm</option>
                    <option value="10+10">10+10 mm</option>
                  </select>
                </div>
              </div>
              {formData.proveedor === 'Baros Vision' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">PVB</label>
                    <select value={formData.pvb} onChange={(e) => setFormData({...formData, pvb: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                      {pvbDisp.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                    <select value={formData.acabadoVidrio} onChange={(e) => setFormData({...formData, acabadoVidrio: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                      {acabadosDisp.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={formData.formaIrregular} 
                  onChange={(e) => setFormData({...formData, formaIrregular: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded" />
                <span className="text-sm">Forma irregular CNC (+18€/pieza)</span>
              </label>
            </div>

            {/* Herrajes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔩 Herrajes</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo boton</label>
                  <select value={formData.tipoBoton} onChange={(e) => setFormData({...formData, tipoBoton: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                    {Object.keys(HERRAJES.botones).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Botones/vidrio</label>
                  <input type="number" min="2" value={formData.botonesXVidrio}
                    onChange={(e) => setFormData({...formData, botonesXVidrio: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo alineador</label>
                  <select value={formData.tipoAlineador} onChange={(e) => setFormData({...formData, tipoAlineador: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                    {Object.keys(HERRAJES.alineadores).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Alineadores/vidrio</label>
                  <input type="number" min="0" value={formData.alineadoresXVidrio}
                    onChange={(e) => setFormData({...formData, alineadoresXVidrio: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>

            {/* Operaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Operaciones vidrio</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.cantos} 
                    onChange={(e) => setFormData({...formData, cantos: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm">Cantos pulidos</span>
                  {formData.proveedor === 'Baros Vision' && <span className="text-xs text-green-600">(Incluido)</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.puntas} 
                    onChange={(e) => setFormData({...formData, puntas: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm">Puntas roma (4/vidrio)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Taladros/vidrio:</label>
                  <input type="number" min="0" value={formData.taladros}
                    onChange={(e) => setFormData({...formData, taladros: parseInt(e.target.value)})}
                    className="w-16 px-2 py-1 border rounded-lg" />
                  {formData.proveedor === 'Baros Vision' && <span className="text-xs text-green-600">(Incluido)</span>}
                </div>
              </div>
            </div>

            <button onClick={calcular} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg">
              📊 Calcular Presupuesto
            </button>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Presupuesto Barandilla</h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <p><strong>{resultado.metrosLineales} ml</strong> x {resultado.alturaVidrio}mm</p>
                  <p>{resultado.numVidrios} vidrios - {resultado.m2Vidrio.toFixed(2)} m²</p>
                  <p>{resultado.proveedor} {resultado.espesor} {resultado.acabadoVidrio}</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Vidrio ({resultado.vidrio.m2.toFixed(2)} m² x {resultado.vidrio.precioM2}€)</span>
                    <span className="font-medium">{resultado.vidrio.total.toFixed(2)} €</span>
                  </div>
                  {resultado.vidrio.cnc && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>+ CNC forma irregular</span>
                      <span>incluido</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Botones ({resultado.botones.qty} uds)</span>
                    <span className="font-medium">{resultado.botones.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alineadores ({resultado.alineadores.qty} uds)</span>
                    <span className="font-medium">{resultado.alineadores.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Fijaciones (tamiz + tornillos)</span>
                    <span>{resultado.fijaciones.total.toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>Cantos ({resultado.cantos.ml.toFixed(2)} ml)</span>
                      <span>{resultado.cantos.gratis ? <span className="text-green-600">Incluido</span> : `${resultado.cantos.total.toFixed(2)} €`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Puntas roma ({resultado.puntas.qty} uds)</span>
                      <span>{resultado.puntas.total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taladros ({resultado.taladros.qty} uds)</span>
                      <span>{resultado.taladros.gratis ? <span className="text-green-600">Incluido</span> : `${resultado.taladros.total.toFixed(2)} €`}</span>
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

                <div className="bg-purple-600 text-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                <div>
                  <div className="text-5xl mb-3">🔒</div>
                  <p>Configura la barandilla y pulsa <strong>Calcular</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadorBarandillasTopGlass;
