// CalculadorVidrios.jsx - Multi-vidrios + Guardado en Supabase (componentes/items)
// Mantiene TODA tu lógica original y añade: lista, añadir, editar, eliminar, guardar.

import { useEffect, useMemo, useState } from 'react';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';

// ==============================
// DATOS (los tuyos)
// ==============================
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

// Operaciones (los tuyos)
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

// ==============================
// HELPERS
// ==============================
const defaultForm = {
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
};

// Calcula 1 vidrio (tu lógica, pero en función pura)
// Devuelve { resultado, mensaje } (mensaje opcional warning/error)
function calcularVidrio(formData) {
  const {
    ancho, alto, cantidad, tipoVidrio, proveedor,
    espesor, acabado, forma, cantos, puntas,
    taladros, diametroTaladro
  } = formData;

  if (!ancho || !alto || parseFloat(ancho) <= 0 || parseFloat(alto) <= 0) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Introduce las medidas del vidrio' } };
  }

  const anchoM = parseFloat(ancho) / 1000;
  const altoM = parseFloat(alto) / 1000;
  const m2Unidad = anchoM * altoM;
  const m2Total = m2Unidad * parseInt(cantidad);
  const perimetroTotal = 2 * (anchoM + altoM) * parseInt(cantidad);

  // Precio base m2
  let precioM2 = 0;
  if (tipoVidrio === 'Laminado') {
    precioM2 = VIDRIOS_LAMINADOS[proveedor]?.[espesor]?.[acabado] || 0;
  } else {
    precioM2 = VIDRIOS_LAMINADO_TEMPLADO[proveedor]?.[espesor]?.[acabado] || 0;
  }

  if (precioM2 === 0) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Combinación no disponible' } };
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
    if (proveedor === 'Baros Vision') {
      extras.push({ nombre: 'Cantos pulidos', detalle: 'Incluido con Baros Vision', precio: 0 });
    } else {
      const cantosEsp = OPERACIONES.cantos['Vallesglass'][espesor];
      const precioCanto = cantosEsp?.[acabado] || cantosEsp?.default || 2.00;
      const costCantos = perimetroTotal * precioCanto;
      extras.push({
        nombre: 'Cantos pulidos',
        detalle: `${perimetroTotal.toFixed(2)} ml x ${precioCanto.toFixed(2)} €/ml`,
        precio: costCantos
      });
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
    extras.push({
      nombre: 'Puntas roma',
      detalle: `${numPuntas} ud x ${precioPunta.toFixed(2)} €/ud`,
      precio: costPuntas
    });
    totalExtras += costPuntas;
  }

  // Taladros
  let mensaje = null;
  if (taladros > 0) {
    if (tipoVidrio === 'Laminado') {
      mensaje = { tipo: 'warning', texto: 'Los taladros solo se pueden hacer en vidrio templado o laminado templado' };
    } else {
      const numTaladros = parseInt(taladros) * parseInt(cantidad);
      if (proveedor === 'Baros Vision') {
        extras.push({ nombre: `Taladros Ø${diametroTaladro}mm`, detalle: 'Incluido con Baros Vision', precio: 0 });
      } else {
        const precioTaladro = diametroTaladro <= 50 ? 5.50 : 8.00;
        const costTaladros = numTaladros * precioTaladro;
        extras.push({
          nombre: `Taladros Ø${diametroTaladro}mm`,
          detalle: `${numTaladros} ud x ${precioTaladro.toFixed(2)} €/ud`,
          precio: costTaladros
        });
        totalExtras += costTaladros;
      }
    }
  }

  const subtotal = precioBase + totalExtras;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const resultado = {
    medidas: `${ancho} x ${alto} mm`,
    cantidad: parseInt(cantidad),
    m2Unidad,
    m2Total,
    tipoVidrio,
    proveedor,
    espesor,
    acabado,
    forma:
      forma === 'rectangular'
        ? 'Rectangular'
        : forma === 'inclinado_pequeno'
          ? 'Inclinado (+16%)'
          : 'Inclinado grande (+32%)',
    precioM2,
    precioBase,
    extras,
    totalExtras,
    subtotal,
    iva,
    total
  };

  return { resultado, mensaje };
}

function formToTitulo(formData) {
  const { ancho, alto, tipoVidrio, proveedor, espesor, acabado, forma, cantos, puntas, taladros } = formData;
  const extras = [
    forma !== 'rectangular' ? 'inclinado' : null,
    cantos ? 'cantos' : null,
    puntas ? 'puntas' : null,
    taladros > 0 ? `taladros:${taladros}` : null
  ].filter(Boolean).join(', ');

  return `Vidrio ${ancho}x${alto} · ${tipoVidrio} · ${proveedor} · ${espesor} · ${acabado}${extras ? ` · ${extras}` : ''}`;
}

// ==============================
// COMPONENTE
// ==============================
export default function CalculadorVidrios() {
  const [formData, setFormData] = useState({ ...defaultForm });

  const [espesoresDisp, setEspesoresDisp] = useState([]);
  const [acabadosDisp, setAcabadosDisp] = useState([]);
  const [proveedoresDisp, setProveedoresDisp] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Lista de vidrios (ítems)
  const [items, setItems] = useState([]); // [{ formData, resultado, nombre }]
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Modal guardar
  const [openSave, setOpenSave] = useState(false);

  // Actualizar combos según tipo/proveedor/espesor (tu lógica)
  useEffect(() => {
    const { tipoVidrio, proveedor } = formData;

    if (tipoVidrio === 'Laminado') {
      setProveedoresDisp(['Vallesglass']);
      const espesores = Object.keys(VIDRIOS_LAMINADOS['Vallesglass']);
      setEspesoresDisp(espesores);

      const espesorActual = espesores.includes(formData.espesor) ? formData.espesor : espesores[0];
      const acabados = Object.keys(VIDRIOS_LAMINADOS['Vallesglass'][espesorActual]);
      setAcabadosDisp(acabados);

      if (!espesores.includes(formData.espesor) || proveedor !== 'Vallesglass') {
        setFormData(prev => ({
          ...prev,
          proveedor: 'Vallesglass',
          espesor: espesores[0],
          acabado: Object.keys(VIDRIOS_LAMINADOS['Vallesglass'][espesores[0]])[0]
        }));
      }
    } else if (tipoVidrio === 'Laminado Templado') {
      setProveedoresDisp(['Vallesglass', 'Baros Vision']);
      const provActual = VIDRIOS_LAMINADO_TEMPLADO[proveedor] ? proveedor : 'Vallesglass';
      const espesores = Object.keys(VIDRIOS_LAMINADO_TEMPLADO[provActual]);
      setEspesoresDisp(espesores);

      const espesorActual = espesores.includes(formData.espesor) ? formData.espesor : espesores[0];
      const acabados = Object.keys(VIDRIOS_LAMINADO_TEMPLADO[provActual][espesorActual]);
      setAcabadosDisp(acabados);

      // Ajustes si el proveedor/espesor/acabado ya no existe
      if (provActual !== proveedor) {
        setFormData(prev => ({ ...prev, proveedor: provActual }));
      }
      if (!espesores.includes(formData.espesor)) {
        setFormData(prev => ({ ...prev, espesor: espesores[0] }));
      }
      if (!acabados.includes(formData.acabado)) {
        setFormData(prev => ({ ...prev, acabado: acabados[0] }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoVidrio, formData.proveedor, formData.espesor]);

  const calcular = () => {
    const { resultado: res, mensaje: msg } = calcularVidrio(formData);
    setResultado(res);
    setMensaje(msg);
  };

  const limpiar = () => {
    setFormData({ ...defaultForm });
    setResultado(null);
    setMensaje(null);
    setSelectedIndex(-1);
  };

  const addToList = () => {
    // Debe estar calculado (así garantizamos consistencia)
    const { resultado: res, mensaje: msg } = calcularVidrio(formData);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }

    const nombre = formToTitulo(formData);
    setItems(prev => [...prev, { formData: { ...formData }, resultado: res, nombre }]);
    setMensaje({ tipo: 'success', texto: 'Vidrio añadido a la lista' });

    // opcional: limpiar para siguiente
    limpiar();
  };

  const updateSelected = () => {
    if (selectedIndex < 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un vidrio de la lista para actualizar' });
      return;
    }

    const { resultado: res, mensaje: msg } = calcularVidrio(formData);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }

    const nombre = formToTitulo(formData);
    setItems(prev => prev.map((it, idx) => (idx === selectedIndex ? { formData: { ...formData }, resultado: res, nombre } : it)));
    setMensaje({ tipo: 'success', texto: 'Vidrio actualizado' });
    setResultado(res);
    setMensaje(msg);
  };

  const selectItem = (idx) => {
    const it = items[idx];
    setSelectedIndex(idx);
    setFormData({ ...it.formData });
    setResultado(it.resultado);
    setMensaje(null);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (selectedIndex === idx) {
      limpiar();
    } else if (selectedIndex > idx) {
      setSelectedIndex(prev => prev - 1);
    }
  };

  const totalLista = useMemo(() => {
    // total con IVA (lo que ves en pantalla)
    return items.reduce((sum, it) => sum + (it.resultado?.total || 0), 0);
  }, [items]);

  const guardarPresupuesto = async ({ cliente_id, proyecto_id, impuestos }) => {
    if (items.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Añade al menos un vidrio a la lista antes de guardar' });
      return;
    }

    // número simple (luego hacemos secuencial de verdad)
    const year = new Date().getFullYear();
    const numero = `VID-${year}-${String(Date.now()).slice(-6)}`;

    // Convertimos cada vidrio a presupuesto_item (subtotal sin IVA)
    const itemsDB = items.map((it, idx) => {
      const qty = it.formData?.cantidad ? parseInt(it.formData.cantidad) : 1;
      const subtotal = it.resultado?.subtotal ?? 0;
      const precio_unitario = qty > 0 ? subtotal / qty : subtotal;

      return {
        nombre: it.nombre || `Vidrio ${idx + 1}`,
        cantidad: qty,
        precio_unitario: Number(precio_unitario.toFixed(2)),
        posicion: idx,
        // Guardamos TODO: opciones + desglose calculado
        datos: {
          form: it.formData,
          desglose: it.resultado
        }
      };
    });

    try {
      await savePresupuestoConItems({
        numero,
        cliente_id,
        proyecto_id,
        impuestos, // en tu BD es "impuestos"
        componente_tipo: 'vidrios',
        componente_titulo: 'Vidrios',
        items: itemsDB
      });

      setMensaje({ tipo: 'success', texto: 'Presupuesto guardado correctamente' });
      setItems([]);
      limpiar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message || 'Error guardando en Supabase' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🪟 Calculador de Vidrios</h2>
        <p className="text-blue-100 text-sm">Multi-vidrios + Guardado por componentes</p>
      </div>

      <div className="p-6">
        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              mensaje.tipo === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : mensaje.tipo === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO (igual, pero con botones extra) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Medidas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <input
                    type="number"
                    value={formData.ancho}
                    onChange={(e) => setFormData({ ...formData, ancho: e.target.value })}
                    placeholder="1000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Alto (mm)</label>
                  <input
                    type="number"
                    value={formData.alto}
                    onChange={(e) => setFormData({ ...formData, alto: e.target.value })}
                    placeholder="1500"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔍 Tipo de Vidrio</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Laminado', 'Laminado Templado'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFormData({ ...formData, tipoVidrio: tipo })}
                    className={`p-3 rounded-lg text-left transition-all ${
                      formData.tipoVidrio === tipo
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{tipo}</div>
                    <div className="text-xs text-gray-500">
                      {tipo === 'Laminado' ? '5+5 a 12+12' : '6+6 a 10+10 (con taladros)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Especificaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📋 Especificaciones</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                  <select
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {proveedoresDisp.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor}
                    onChange={(e) => setFormData({ ...formData, espesor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {espesoresDisp.map(e => <option key={e} value={e}>{e} mm</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                  <select
                    value={formData.acabado}
                    onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {acabadosDisp.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Forma + Extras */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800">🧰 Forma y Extras</h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">Forma</label>
                  <select
                    value={formData.forma}
                    onChange={(e) => setFormData({ ...formData, forma: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rectangular">Rectangular</option>
                    <option value="inclinado_pequeno">Inclinado pequeño</option>
                    <option value="inclinado_grande">Inclinado grande</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.cantos}
                    onChange={(e) => setFormData({ ...formData, cantos: e.target.checked })}
                  />
                  <span className="text-sm">
                    Cantos pulidos {formData.proveedor === 'Baros Vision' ? '(Incluido)' : ''}
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.puntas}
                    onChange={(e) => setFormData({ ...formData, puntas: e.target.checked })}
                  />
                  <span className="text-sm">Puntas roma (4/pieza)</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium">Taladros:</div>
                <input
                  type="number"
                  min="0"
                  value={formData.taladros}
                  onChange={(e) => setFormData({ ...formData, taladros: e.target.value })}
                  className="w-20 px-2 py-1 border rounded"
                />
                <div className="text-sm">Diámetro (mm)</div>
                <input
                  type="number"
                  min="10"
                  value={formData.diametroTaladro}
                  onChange={(e) => setFormData({ ...formData, diametroTaladro: e.target.value })}
                  className="w-24 px-2 py-1 border rounded"
                />
                {formData.proveedor === 'Baros Vision' && (
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                    Taladros incluidos
                  </span>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={calcular}
                className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Calcular
              </button>

              <button
                onClick={addToList}
                className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Añadir este vidrio a la lista
              </button>

              <button
                onClick={updateSelected}
                className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Actualizar vidrio seleccionado
              </button>

              <button
                onClick={limpiar}
                className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
              >
                Limpiar
              </button>
            </div>

            {/* Resultado del vidrio actual */}
            <div>
              {resultado ? (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Resumen (vidrio actual)</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Medidas:</span><span>{resultado.medidas}</span></div>
                    <div className="flex justify-between"><span>Cantidad:</span><span>{resultado.cantidad}</span></div>
                    <div className="flex justify-between"><span>m² unidad:</span><span>{resultado.m2Unidad.toFixed(3)} m²</span></div>
                    <div className="flex justify-between"><span>m² total:</span><span>{resultado.m2Total.toFixed(3)} m²</span></div>
                    <div className="flex justify-between"><span>Precio/m²:</span><span>{resultado.precioM2.toFixed(2)} €</span></div>
                    <div className="flex justify-between"><span>Base:</span><span>{resultado.precioBase.toFixed(2)} €</span></div>

                    {resultado.extras?.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="font-semibold mb-1">Extras</div>
                        <div className="space-y-1">
                          {resultado.extras.map((ex, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span>{ex.nombre} <span className="text-gray-500">({ex.detalle})</span></span>
                              <span>{ex.precio.toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Total extras:</span><span>{resultado.totalExtras.toFixed(2)} €</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-2"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                    <div className="flex justify-between text-gray-500"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                  </div>

                  <div className="mt-4 bg-blue-600 text-white rounded-lg p-4 flex justify-between">
                    <span className="font-bold">TOTAL:</span>
                    <span className="text-xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400">
                  Introduce los datos y pulsa Calcular
                </div>
              )}
            </div>
          </div>

          {/* LISTA DE VIDRIOS */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Lista de vidrios</h3>
                <span className="text-xs text-gray-500">{items.length} item(s)</span>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-gray-500">Aún no has añadido vidrios.</div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        idx === selectedIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => selectItem(idx)}
                      title="Click para editar"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-sm font-medium">{it.nombre}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Subtotal: {it.resultado?.subtotal?.toFixed(2)} € · Total: {it.resultado?.total?.toFixed(2)} €
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t pt-3 flex justify-between text-sm">
                <span className="font-semibold">TOTAL lista (IVA incl.)</span>
                <span className="font-bold">{totalLista.toFixed(2)} €</span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => setOpenSave(true)}
                  disabled={items.length === 0}
                  className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
                >
                  Guardar presupuesto (todos los vidrios)
                </button>

                <button
                  onClick={() => { setItems([]); limpiar(); }}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                >
                  No guardar (vaciar lista)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuardarPresupuestoModal
        open={openSave}
        onClose={() => setOpenSave(false)}
        onConfirm={guardarPresupuesto}
        defaultImpuestos={21}
      />
    </div>
  );
}
