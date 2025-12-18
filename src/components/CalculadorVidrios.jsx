// CalculadorVidrios.jsx - Layout de ayer (igual) + datos reales desde Supabase
// - Mantiene el layout/UX (cabecera azul, formulario izq, lista lateral)
// - Carga proveedores/tipos/espesores/acabados desde public.tarifas_vidrios
// - Mantiene lógica de extras (cantos/puntas/taladros/forma) como ayer (por ahora)
// - Multi-vidrios: añadir, seleccionar, actualizar, eliminar, guardar

import { useEffect, useMemo, useState } from 'react';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';
import { supabase } from '../services/supabase';

// ==============================
// Reglas (por ahora como ayer)
// ==============================
const REGLAS = {
  ivaPct: 21,
  recargos_forma: {
    Laminado: { pequeno: 16, grande: 32 },
    Templado: { pequeno: 20, grande: 40 },
  },
  // Restricción de taladros (como ayer)
  taladrosSoloTemplado: true,
};

// ==============================
// Helpers
// ==============================
const defaultForm = {
  ancho: '',
  alto: '',
  cantidad: 1,
  tipoVidrio: '', // se setea al cargar tarifas
  proveedor: '',
  espesor: '',
  acabado: '',
  forma: 'rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 50,
};

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Normalizaciones suaves para compatibilidad con datos antiguos
const normalizeTipoLookup = (tipoUI) => {
  // Si tu BD guarda "Templado" pero UI usa "Laminado Templado", probamos ambos
  if (tipoUI === 'Laminado Templado') return ['Laminado Templado', 'Templado'];
  return [tipoUI];
};

function formToTitulo(formData) {
  const { ancho, alto, tipoVidrio, proveedor, espesor, acabado, forma, cantos, puntas, taladros } = formData;
  const extras = [
    forma !== 'rectangular' ? 'inclinado' : null,
    cantos ? 'cantos' : null,
    puntas ? 'puntas' : null,
    toNum(taladros) > 0 ? `taladros:${taladros}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `Vidrio ${ancho}x${alto} · ${tipoVidrio} · ${proveedor} · ${espesor} · ${acabado}${extras ? ` · ${extras}` : ''}`;
}

// ==============================
// Cálculo (misma estructura que ayer)
// Ahora el precio/m² sale de tarifasIndex (Supabase)
// ==============================
function calcularVidrio(formData, tarifasIndex) {
  const {
    ancho, alto, cantidad, tipoVidrio, proveedor,
    espesor, acabado, forma, cantos, puntas,
    taladros, diametroTaladro
  } = formData;

  // Validaciones duras
  if (!tipoVidrio || !proveedor || !espesor || !acabado) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Completa tipo, proveedor, espesor y acabado' } };
  }

  if (!ancho || !alto || toNum(ancho) <= 0 || toNum(alto) <= 0) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Introduce las medidas del vidrio' } };
  }

  const qty = Math.max(1, parseInt(cantidad || 1, 10));
  const anchoM = toNum(ancho) / 1000;
  const altoM = toNum(alto) / 1000;

  const m2Unidad = anchoM * altoM;
  const m2Total = m2Unidad * qty;
  const perimetroTotal = 2 * (anchoM + altoM) * qty;

  // Precio base m2 desde tarifasIndex
  let precioM2 = 0;
  const tiposToTry = normalizeTipoLookup(tipoVidrio);

  for (const t of tiposToTry) {
    const p = tarifasIndex?.[t]?.[proveedor]?.[espesor]?.[acabado];
    if (p) {
      precioM2 = p;
      break;
    }
  }

  if (!precioM2) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Combinación no disponible (según tarifas)' } };
  }

  let precioBase = precioM2 * m2Total;

  // Recargo forma (igual que ayer)
  if (forma !== 'rectangular') {
    const family = tipoVidrio === 'Laminado' ? 'Laminado' : 'Templado';
    const recargos = REGLAS.recargos_forma[family];
    const recargo = forma === 'inclinado_pequeno' ? recargos.pequeno : recargos.grande;
    precioBase *= (1 + recargo / 100);
  }

  // Extras (igual que ayer, pero sin depender de excel todavía)
  // Nota: mañana conectamos operaciones/restricciones desde el “archivo escrito”
  const extras = [];
  let totalExtras = 0;

  // Cantos: coste por ml (valores provisionales por ahora: mantenemos el comportamiento)
  if (cantos) {
    // Si en tus tarifas quieres que Baros incluya, lo traeremos de reglas más adelante.
    // De momento, dejamos cantos = 2 €/ml como fallback si no hay nada.
    const precioCanto = 2.0;
    const costCantos = perimetroTotal * precioCanto;
    extras.push({
      nombre: 'Cantos pulidos',
      detalle: `${perimetroTotal.toFixed(2)} ml x ${precioCanto.toFixed(2)} €/ml`,
      precio: costCantos,
    });
    totalExtras += costCantos;
  }

  // Puntas roma: 4 por pieza
  if (puntas) {
    const numPuntas = 4 * qty;
    const precioPunta = 2.8; // fallback (lo afinaremos con reglas)
    const costPuntas = numPuntas * precioPunta;
    extras.push({
      nombre: 'Puntas roma',
      detalle: `${numPuntas} ud x ${precioPunta.toFixed(2)} €/ud`,
      precio: costPuntas,
    });
    totalExtras += costPuntas;
  }

  // Taladros: restricción (como ayer)
  let mensaje = null;
  if (toNum(taladros) > 0) {
    if (REGLAS.taladrosSoloTemplado && tipoVidrio === 'Laminado') {
      mensaje = { tipo: 'warning', texto: 'Los taladros solo se pueden hacer en vidrio templado o laminado templado' };
    } else {
      const numTaladros = Math.max(0, parseInt(taladros, 10)) * qty;
      const precioTaladro = toNum(diametroTaladro) <= 50 ? 5.5 : 8.0;
      const costTaladros = numTaladros * precioTaladro;

      extras.push({
        nombre: `Taladros Ø${diametroTaladro}mm`,
        detalle: `${numTaladros} ud x ${precioTaladro.toFixed(2)} €/ud`,
        precio: costTaladros,
      });
      totalExtras += costTaladros;
    }
  }

  const subtotal = precioBase + totalExtras;
  const iva = subtotal * (REGLAS.ivaPct / 100);
  const total = subtotal + iva;

  const resultado = {
    medidas: `${ancho} x ${alto} mm`,
    cantidad: qty,
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
    total,
  };

  return { resultado, mensaje };
}

// ==============================
// COMPONENTE
// ==============================
export default function CalculadorVidrios() {
  const [formData, setFormData] = useState({ ...defaultForm });

  // Index de tarifas desde Supabase:
  // tarifasIndex[tipo][proveedor][espesor][acabado] = precio_m2
  const [tarifasIndex, setTarifasIndex] = useState({});
  const [loadingTarifas, setLoadingTarifas] = useState(true);

  // Combos
  const [tiposDisp, setTiposDisp] = useState([]);
  const [proveedoresDisp, setProveedoresDisp] = useState([]);
  const [espesoresDisp, setEspesoresDisp] = useState([]);
  const [acabadosDisp, setAcabadosDisp] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Lista de vidrios
  const [items, setItems] = useState([]); // [{ formData, resultado, nombre }]
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Modal guardar
  const [openSave, setOpenSave] = useState(false);

  // 1) Cargar tarifas desde Supabase (una vez)
  useEffect(() => {
    const load = async () => {
      setLoadingTarifas(true);
      try {
        const { data, error } = await supabase
          .from('tarifas_vidrios')
          .select('proveedor,tipo,espesor_mm,acabado,precio_m2')
          .eq('activo', true);

        if (error) throw error;

        const idx = {};
        for (const row of data || []) {
          const tipo = row.tipo;
          const prov = row.proveedor;
          const esp = row.espesor_mm;
          const ac = row.acabado;
          const precio = toNum(row.precio_m2);

          if (!tipo || !prov || !esp || !ac || !precio) continue;

          idx[tipo] ??= {};
          idx[tipo][prov] ??= {};
          idx[tipo][prov][esp] ??= {};
          idx[tipo][prov][esp][ac] = precio;
        }

        setTarifasIndex(idx);

        // Set tipos iniciales
        const tipos = Object.keys(idx).sort();
        setTiposDisp(tipos);

        // Inicializar selección si está vacía
        setFormData((prev) => {
          if (prev.tipoVidrio) return prev;
          const tipo0 = tipos[0] || '';
          const provs0 = tipo0 ? Object.keys(idx[tipo0] || {}).sort() : [];
          const prov0 = provs0[0] || '';
          const esps0 = prov0 ? Object.keys(idx[tipo0]?.[prov0] || {}).sort() : [];
          const esp0 = esps0[0] || '';
          const acs0 = esp0 ? Object.keys(idx[tipo0]?.[prov0]?.[esp0] || {}).sort() : [];
          const ac0 = acs0[0] || '';
          return { ...prev, tipoVidrio: tipo0, proveedor: prov0, espesor: esp0, acabado: ac0 };
        });
      } catch (e) {
        console.error('Error cargando tarifas_vidrios:', e);
        setMensaje({ tipo: 'error', texto: 'No se han podido cargar las tarifas de vidrios (Supabase)' });
      } finally {
        setLoadingTarifas(false);
      }
    };

    load();
  }, []);

  // 2) Recalcular combos dependientes (tipo->proveedor->espesor->acabado)
  useEffect(() => {
    if (loadingTarifas) return;

    const tipo = formData.tipoVidrio;
    const tipoBucket = tarifasIndex?.[tipo] || {};

    const provs = Object.keys(tipoBucket).sort();
    setProveedoresDisp(provs);

    let prov = formData.proveedor;
    if (!prov || !tipoBucket[prov]) prov = provs[0] || '';

    const espBucket = prov ? (tipoBucket?.[prov] || {}) : {};
    const esps = Object.keys(espBucket).sort();
    setEspesoresDisp(esps);

    let esp = formData.espesor;
    if (!esp || !espBucket[esp]) esp = esps[0] || '';

    const acBucket = (prov && esp) ? (tipoBucket?.[prov]?.[esp] || {}) : {};
    const acs = Object.keys(acBucket).sort();
    setAcabadosDisp(acs);

    let ac = formData.acabado;
    if (!ac || !acBucket[ac]) ac = acs[0] || '';

    // Aplicar correcciones si había selecciones inválidas
    if (prov !== formData.proveedor || esp !== formData.espesor || ac !== formData.acabado) {
      setFormData((prev) => ({
        ...prev,
        proveedor: prov,
        espesor: esp,
        acabado: ac,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoVidrio, formData.proveedor, formData.espesor, formData.acabado, loadingTarifas, tarifasIndex]);

  const calcular = () => {
    const { resultado: res, mensaje: msg } = calcularVidrio(formData, tarifasIndex);
    setResultado(res);
    setMensaje(msg);
  };

  const limpiar = () => {
    setFormData((prev) => ({
      ...defaultForm,
      // mantenemos las selecciones base para no dejarlo vacío
      tipoVidrio: prev.tipoVidrio,
      proveedor: prev.proveedor,
      espesor: prev.espesor,
      acabado: prev.acabado,
    }));
    setResultado(null);
    setMensaje(null);
    setSelectedIndex(-1);
  };

  const addToList = () => {
    const { resultado: res, mensaje: msg } = calcularVidrio(formData, tarifasIndex);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }

    const nombre = formToTitulo(formData);
    setItems((prev) => [...prev, { formData: { ...formData }, resultado: res, nombre }]);
    setMensaje({ tipo: 'success', texto: 'Vidrio añadido a la lista' });

    limpiar();
  };

  const updateSelected = () => {
    if (selectedIndex < 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un vidrio de la lista para actualizar' });
      return;
    }

    const { resultado: res, mensaje: msg } = calcularVidrio(formData, tarifasIndex);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }

    const nombre = formToTitulo(formData);
    setItems((prev) =>
      prev.map((it, idx) => (idx === selectedIndex ? { formData: { ...formData }, resultado: res, nombre } : it))
    );
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
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (selectedIndex === idx) {
      limpiar();
    } else if (selectedIndex > idx) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  const totalLista = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.resultado?.total || 0), 0);
  }, [items]);

  const guardarPresupuesto = async ({ cliente_id, proyecto_id, impuestos }) => {
    if (items.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Añade al menos un vidrio a la lista antes de guardar' });
      return;
    }

    const year = new Date().getFullYear();
    const numero = `VID-${year}-${String(Date.now()).slice(-6)}`;

    const itemsDB = items.map((it, idx) => {
      const qty = it.formData?.cantidad ? parseInt(it.formData.cantidad, 10) : 1;
      const subtotal = it.resultado?.subtotal ?? 0;
      const precio_unitario = qty > 0 ? subtotal / qty : subtotal;

      return {
        nombre: it.nombre || `Vidrio ${idx + 1}`,
        cantidad: qty,
        precio_unitario: Number(precio_unitario.toFixed(2)),
        posicion: idx,
        datos: {
          form: it.formData,
          desglose: it.resultado,
        },
      };
    });

    try {
      await savePresupuestoConItems({
        numero,
        cliente_id,
        proyecto_id,
        impuestos,
        componente_tipo: 'vidrios',
        componente_titulo: 'Vidrios',
        items: itemsDB,
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

        {loadingTarifas && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-slate-50 border text-slate-700">
            Cargando tarifas de vidrios...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO */}
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

            {/* Tipo (ahora dinámico) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔍 Tipo de Vidrio</h3>

              <div className="grid grid-cols-2 gap-2">
                {(tiposDisp.length ? tiposDisp : ['Laminado', 'Laminado Templado']).map((tipo) => (
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
                      (según tarifas)
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
                    {proveedoresDisp.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor}
                    onChange={(e) => setFormData({ ...formData, espesor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {espesoresDisp.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado / Color</label>
                  <select
                    value={formData.acabado}
                    onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {acabadosDisp.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
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
                  <span className="text-sm">Cantos pulidos</span>
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

            {/* Resultado */}
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
                    <div className="flex justify-between text-gray-500"><span>IVA ({REGLAS.ivaPct}%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
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
