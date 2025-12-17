// CalculadorVidrios.jsx - Calculador de Vidrios
// Datos de TARIFA_VIDRIOS_MASTER
import { useState, useEffect } from 'react';

// Datos de los Excels
const VIDRIOS_LAMINADOS = {
  'Vallesglass': {
    '5+5': { 'Transparente': 35.54, 'Mate': 41.39 },
    '6+6': { 'Transparente': 38.33, 'Mate': 46.09, 'Gris': 63.95 },
    '8+8': { 'Transparente': 56.09, 'Mate': 65.85, 'Gris': 90.49 },
    '10+10': { 'Transparente': 75.39, 'Mate': 87.85, 'Gris': 113.59 },
    '12+12': { 'Transparente': 113.75, 'Mate': 128.75 }
  }
};

const VIDRIOS_LAMINADO_TEMPLADO = {
  'Vallesglass': {
    '6+6': { 'Transparente': 125.75 },
    '8+8': { 'Transparente': 155.01 },
    '10+10': { 'Transparente': 179.26 }
  },
  'Baros Vision': {
    '6+6': { 'Transparente': 94.00, 'Óptico': 109.00, 'Mate': 101.00 },
    '8+8': { 'Transparente': 110.00, 'Óptico': 125.00 },
    '10+10': { 'Transparente': 145.00, 'Óptico': 160.00 }
  }
};

// Operaciones
const OPERACIONES = {
  cantos: {
    'Vallesglass': {
      '5+5': { 'Transparente': 1.20, 'Mate': 1.20, 'Gris': 4.27 },
      '6+6': { 'Transparente': 1.20, 'Mate': 1.20, 'Gris': 4.27 },
      '8+8': { default: 2.00 },
      '10+10': { default: 2.00 },
      '12+12': { default: 2.00 }
    },
    'Baros Vision': { default: 0 }
  },
  puntas: {
    'Vallesglass': { 'Transparente': 2.00, 'Mate': 2.00, 'Gris': 2.40, 'templado': 2.80 },
    'Baros Vision': { default: 2.80 }
  },
  taladros: {
    'Vallesglass': { '<=50': 5.50, '>50': 8.00 },
    'Baros Vision': { default: 0 }
  },
  recargos_forma: {
    'Laminado': { pequeno: 16, grande: 32 },
    'Templado': { pequeno: 20, grande: 40 }
  }
};

const CalculadorVidrios = () => {
  const [formData, setFormData] = useState({
    ancho: '',
    alto: '',
    cantidad: 1,
    tipoVidrio: 'Laminado',
    proveedor: 'Vallesglass',
    espesor: '6+6',
    acabado: 'Transparente',
    forma: 'rectangular',
    cantos: false,
    puntas: false,
    taladros: 0,
    diametroTaladro: 50
  });

  const [espesoresDisp, setEspesoresDisp] = useState([]);
  const [acabadosDisp, setAcabadosDisp] = useState([]);
  const [proveedoresDisp, setProveedoresDisp] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Actualizar opciones cuando cambia tipo/proveedor
  useEffect(() => {
    const { tipoVidrio, proveedor } = formData;
    
    if (tipoVidrio === 'Laminado') {
      setProveedoresDisp(['Vallesglass']);
      const espesores = Object.keys(VIDRIOS_LAMINADOS['Vallesglass']);
      setEspesoresDisp(espesores);
      
      const espesorActual = espesores.includes(formData.espesor) ? formData.espesor : espesores[0];
      const acabados = Object.keys(VIDRIOS_LAMINADOS['Vallesglass'][espesorActual]);
      setAcabadosDisp(acabados);
      
      if (!espesores.includes(formData.espesor)) {
        setFormData(prev => ({ ...prev, espesor: espesores[0], proveedor: 'Vallesglass' }));
      }
    } else if (tipoVidrio === 'Laminado Templado') {
      setProveedoresDisp(['Vallesglass', 'Baros Vision']);
      const provActual = VIDRIOS_LAMINADO_TEMPLADO[proveedor] ? proveedor : 'Vallesglass';
      const espesores = Object.keys(VIDRIOS_LAMINADO_TEMPLADO[provActual]);
      setEspesoresDisp(espesores);
      
      const espesorActual = espesores.includes(formData.espesor) ? formData.espesor : espesores[0];
      const acabados = Object.keys(VIDRIOS_LAMINADO_TEMPLADO[provActual][espesorActual]);
      setAcabadosDisp(acabados);
    }
  }, [formData.tipoVidrio, formData.proveedor, formData.espesor]);

  const calcular = () => {
    const { ancho, alto, cantidad, tipoVidrio, proveedor, espesor, acabado, forma, cantos, puntas, taladros, diametroTaladro } = formData;

    if (!ancho || !alto || parseFloat(ancho) <= 0 || parseFloat(alto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce las medidas del vidrio' });
      return;
    }

    // Calculos basicos
    const anchoM = parseFloat(ancho) / 1000;
    const altoM = parseFloat(alto) / 1000;
    const m2Unidad = anchoM * altoM;
    const m2Total = m2Unidad * parseInt(cantidad);
    const perimetroTotal = 2 * (anchoM + altoM) * parseInt(cantidad);

    // Precio base
    let precioM2 = 0;
    if (tipoVidrio === 'Laminado') {
      precioM2 = VIDRIOS_LAMINADOS[proveedor]?.[espesor]?.[acabado] || 0;
    } else {
      precioM2 = VIDRIOS_LAMINADO_TEMPLADO[proveedor]?.[espesor]?.[acabado] || 0;
    }

    if (precioM2 === 0) {
      setMensaje({ tipo: 'error', texto: 'Combinacion no disponible' });
      return;
    }

    let precioBase = precioM2 * m2Total;

    // Recargo forma
    if (forma !== 'rectangular') {
      const recargos = OPERACIONES.recargos_forma[tipoVidrio === 'Laminado' ? 'Laminado' : 'Templado'];
      const recargo = forma === 'inclinado_pequeno' ? recargos.pequeno : recargos.grande;
      precioBase *= (1 + recargo / 100);
    }

    // Extras
    const extras = [];
    let totalExtras = 0;

    // Cantos
    if (cantos) {
      let precioCanto = 0;
      if (proveedor === 'Baros Vision') {
        precioCanto = 0;
        extras.push({ nombre: 'Cantos pulidos', detalle: 'Incluido con Baros Vision', precio: 0 });
      } else {
        const cantosEsp = OPERACIONES.cantos['Vallesglass'][espesor];
        precioCanto = cantosEsp?.[acabado] || cantosEsp?.default || 2.00;
        const costCantos = perimetroTotal * precioCanto;
        extras.push({ nombre: 'Cantos pulidos', detalle: `${perimetroTotal.toFixed(2)} ml x ${precioCanto.toFixed(2)} €/ml`, precio: costCantos });
        totalExtras += costCantos;
      }
    }

    // Puntas roma
    if (puntas) {
      const numPuntas = 4 * parseInt(cantidad);
      let precioPunta = 2.00;
      if (proveedor === 'Baros Vision') {
        precioPunta = 2.80;
      } else if (acabado === 'Gris') {
        precioPunta = 2.40;
      } else if (tipoVidrio === 'Laminado Templado') {
        precioPunta = 2.80;
      }
      const costPuntas = numPuntas * precioPunta;
      extras.push({ nombre: 'Puntas roma', detalle: `${numPuntas} ud x ${precioPunta.toFixed(2)} €/ud`, precio: costPuntas });
      totalExtras += costPuntas;
    }

    // Taladros (solo templado o laminado templado)
    if (taladros > 0) {
      if (tipoVidrio === 'Laminado') {
        setMensaje({ tipo: 'warning', texto: 'Los taladros solo se pueden hacer en vidrio templado o laminado templado' });
      } else {
        const numTaladros = parseInt(taladros) * parseInt(cantidad);
        let precioTaladro = 0;
        if (proveedor === 'Baros Vision') {
          precioTaladro = 0;
          extras.push({ nombre: `Taladros Ø${diametroTaladro}mm`, detalle: 'Incluido con Baros Vision', precio: 0 });
        } else {
          precioTaladro = diametroTaladro <= 50 ? 5.50 : 8.00;
          const costTaladros = numTaladros * precioTaladro;
          extras.push({ nombre: `Taladros Ø${diametroTaladro}mm`, detalle: `${numTaladros} ud x ${precioTaladro.toFixed(2)} €/ud`, precio: costTaladros });
          totalExtras += costTaladros;
        }
      }
    }

    const subtotal = precioBase + totalExtras;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      medidas: `${ancho} x ${alto} mm`,
      cantidad: parseInt(cantidad),
      m2Unidad,
      m2Total,
      tipoVidrio,
      proveedor,
      espesor,
      acabado,
      forma: forma === 'rectangular' ? 'Rectangular' : forma === 'inclinado_pequeno' ? 'Inclinado (+16%)' : 'Inclinado grande (+32%)',
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

  const limpiar = () => {
    setFormData({
      ancho: '', alto: '', cantidad: 1, tipoVidrio: 'Laminado', proveedor: 'Vallesglass',
      espesor: '6+6', acabado: 'Transparente', forma: 'rectangular',
      cantos: false, puntas: false, taladros: 0, diametroTaladro: 50
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🪟 Calculador de Vidrios</h2>
        <p className="text-blue-100 text-sm">Precios segun TARIFA_VIDRIOS_MASTER</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            {/* Medidas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <input type="number" value={formData.ancho} onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    placeholder="1000" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Alto (mm)</label>
                  <input type="number" value={formData.alto} onChange={(e) => setFormData({...formData, alto: e.target.value})}
                    placeholder="1500" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                  <input type="number" min="1" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔍 Tipo de Vidrio</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['Laminado', 'Laminado Templado'].map(tipo => (
                  <button key={tipo} onClick={() => setFormData({...formData, tipoVidrio: tipo})}
                    className={`p-3 rounded-lg text-left transition-all ${formData.tipoVidrio === tipo
                      ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-medium text-sm">{tipo}</div>
                    <div className="text-xs text-gray-500">
                      {tipo === 'Laminado' ? '5+5 a 12+12' : '6+6 a 10+10 (con taladros)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Proveedor, Espesor, Acabado */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📋 Especificaciones</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                  <select value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {proveedoresDisp.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select value={formData.espesor} onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {espesoresDisp.map(e => <option key={e} value={e}>{e} mm</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                  <select value={formData.acabado} onChange={(e) => setFormData({...formData, acabado: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {acabadosDisp.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Forma</label>
                <select value={formData.forma} onChange={(e) => setFormData({...formData, forma: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="rectangular">Rectangular (sin recargo)</option>
                  <option value="inclinado_pequeno">Inclinado pequeno (+16/20%)</option>
                  <option value="inclinado_grande">Inclinado grande (+32/40%)</option>
                </select>
              </div>
            </div>

            {/* Operaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Operaciones</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.cantos} onChange={(e) => setFormData({...formData, cantos: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">Cantos pulidos</span>
                  {formData.proveedor === 'Baros Vision' && <span className="text-xs text-green-600">(Incluido)</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.puntas} onChange={(e) => setFormData({...formData, puntas: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">Puntas roma (4 por pieza)</span>
                </label>
                {formData.tipoVidrio === 'Laminado Templado' && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm">Taladros:</label>
                    <input type="number" min="0" value={formData.taladros} onChange={(e) => setFormData({...formData, taladros: e.target.value})}
                      className="w-16 px-2 py-1 border rounded-lg" />
                    {formData.taladros > 0 && (
                      <select value={formData.diametroTaladro} onChange={(e) => setFormData({...formData, diametroTaladro: parseInt(e.target.value)})}
                        className="px-2 py-1 border rounded-lg text-sm">
                        <option value="50">Ø≤50mm</option>
                        <option value="100">Ø50-100mm</option>
                      </select>
                    )}
                    {formData.proveedor === 'Baros Vision' && <span className="text-xs text-green-600">(Incluido)</span>}
                  </div>
                )}
                {formData.tipoVidrio === 'Laminado' && (
                  <p className="text-xs text-orange-600">⚠️ Taladros solo disponibles en Laminado Templado</p>
                )}
              </div>
            </div>

            {mensaje && (
              <div className={`p-3 rounded-lg ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {mensaje.texto}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={calcular} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
                📊 Calcular
              </button>
              <button onClick={limpiar} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Resumen</h3>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Tipo:</div><div className="font-medium">{resultado.tipoVidrio}</div>
                    <div className="text-gray-600">Proveedor:</div><div className="font-medium">{resultado.proveedor}</div>
                    <div className="text-gray-600">Espesor:</div><div className="font-medium">{resultado.espesor} mm</div>
                    <div className="text-gray-600">Acabado:</div><div className="font-medium">{resultado.acabado}</div>
                    <div className="text-gray-600">Forma:</div><div className="font-medium">{resultado.forma}</div>
                    <div className="text-gray-600">Medidas:</div><div className="font-medium">{resultado.medidas}</div>
                    <div className="text-gray-600">Cantidad:</div><div className="font-medium">{resultado.cantidad} uds</div>
                    <div className="text-gray-600">m² total:</div><div className="font-medium">{resultado.m2Total.toFixed(3)} m²</div>
                    <div className="text-gray-600">Precio/m²:</div><div className="font-medium">{resultado.precioM2.toFixed(2)} €</div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Vidrio base:</span>
                    <span className="font-medium">{resultado.precioBase.toFixed(2)} €</span>
                  </div>
                  {resultado.extras.length > 0 && (
                    <div className="border-t pt-2">
                      {resultado.extras.map((e, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{e.nombre} <span className="text-xs">({e.detalle})</span></span>
                          <span>{e.precio.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between"><span className="font-medium">Subtotal:</span><span className="font-semibold">{resultado.subtotal.toFixed(2)} €</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                  </div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                <div>
                  <div className="text-5xl mb-3">📊</div>
                  <p>Introduce los datos y pulsa <strong>Calcular</strong></p>
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
