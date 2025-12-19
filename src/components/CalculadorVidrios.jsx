// src/components/CalculadorVidrios.jsx
// Multi-vidrios + Guardado por componentes
// IMPORTANTE: Combos + precio base salen SOLO de BD (public.tarifas_vidrios)

import { useEffect, useMemo, useState } from 'react';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';
import {
  getTiposVidrio,
  getProveedoresVidrio,
  getEspesoresVidrio,
  getAcabadosVidrio,
  getPrecioM2Vidrio
} from '../services/tarifasVidrios';

// Operaciones (luego las conectamos a operaciones_vidrios; hoy NO tocamos eso)
const OPERACIONES = {
  recargos_forma: {
    Laminado: { pequeno: 16, grande: 32 },
    'Laminado Templado': { pequeno: 20, grande: 40 },
    Templado: { pequeno: 20, grande: 40 }
  }
};

const defaultForm = {
  ancho: '',
  alto: '',
  cantidad: 1,
  tipoVidrio: '',
  proveedor: '',
  espesor: '',
  acabado: '',
  forma: 'rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 50
};

function formToTitulo(formData) {
  const { ancho, alto, tipoVidrio, proveedor, espesor, acabado, forma, cantos, puntas, taladros } = formData;
  const extras = [
    forma !== 'rectangular' ? 'inclinado' : null,
    cantos ? 'cantos' : null,
    puntas ? 'puntas' : null,
    Number(taladros) > 0 ? `taladros:${taladros}` : null
  ].filter(Boolean).join(', ');

  return `Vidrio ${ancho}x${alto} · ${tipoVidrio} · ${proveedor} · ${espesor} · ${acabado}${extras ? ` · ${extras}` : ''}`;
}

async function calcularVidrioDB(formData) {
  const {
    ancho, alto, cantidad, tipoVidrio, proveedor,
    espesor, acabado, forma,
    cantos, puntas, taladros
  } = formData;

  if (!ancho || !alto || Number(ancho) <= 0 || Number(alto) <= 0) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Introduce las medidas del vidrio' } };
  }
  if (!tipoVidrio || !proveedor || !espesor || !acabado) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Selecciona tipo, proveedor, espesor y acabado' } };
  }

  const qty = Math.max(1, parseInt(cantidad || 1, 10));
  const anchoM = Number(ancho) / 1000;
  const altoM = Number(alto) / 1000;
  const m2Unidad = anchoM * altoM;
  const m2Total = m2Unidad * qty;

  // Precio base desde BD
  const precioM2 = await getPrecioM2Vidrio({
    categoria: 'VIDRIOS',
    tipo: tipoVidrio,
    proveedor,
    espesor_mm: espesor,
    acabado
  });

  if (!precioM2 || precioM2 <= 0) {
    return { resultado: null, mensaje: { tipo: 'error', texto: 'Combinación sin precio en BD (o no activa)' } };
  }

  let precioBase = precioM2 * m2Total;

  // Recargo forma
  if (forma !== 'rectangular') {
    const recargos = OPERACIONES.recargos_forma[tipoVidrio] || OPERACIONES.recargos_forma['Laminado'];
    const recargo = forma === 'inclinado_pequeno' ? recargos.pequeno : recargos.grande;
    precioBase *= (1 + recargo / 100);
  }

  // Extras (de momento solo placeholders visuales; mañana conectamos operaciones_vidrios)
  const extras = [];
  let totalExtras = 0;

  // Reglas base (por ahora mensajes)
  let mensaje = null;
  if (Number(taladros) > 0 && !(tipoVidrio === 'Templado' || tipoVidrio === 'Laminado Templado')) {
    mensaje = { tipo: 'warning', texto: 'Los taladros solo aplican a Templado o Laminado Templado' };
  }

  const subtotal = precioBase + totalExtras;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  return {
    resultado: {
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
            ? 'Inclinado (+%)'
            : 'Inclinado grande (+%)',
      precioM2,
      precioBase,
      extras,
      totalExtras,
      subtotal,
      iva,
      total
    },
    mensaje
  };
}

export default function CalculadorVidrios() {
  const [formData, setFormData] = useState({ ...defaultForm });

  const [tiposDisp, setTiposDisp] = useState([]);
  const [proveedoresDisp, setProveedoresDisp] = useState([]);
  const [espesoresDisp, setEspesoresDisp] = useState([]);
  const [acabadosDisp, setAcabadosDisp] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [items, setItems] = useState([]); // [{ formData, resultado, nombre }]
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [openSave, setOpenSave] = useState(false);

  // Cargar tipos iniciales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tipos = await getTiposVidrio({ categoria: 'VIDRIOS' });
        if (!alive) return;
        setTiposDisp(tipos);

        // Default tipo
        const nextTipo = tipos.includes(formData.tipoVidrio) ? formData.tipoVidrio : (tipos[0] || '');
        setFormData((p) => ({ ...p, tipoVidrio: nextTipo }));
      } catch (e) {
        console.error(e);
        if (alive) setMensaje({ tipo: 'error', texto: 'Error cargando tipos desde BD' });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambia tipo -> proveedores
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tipo = formData.tipoVidrio;
        if (!tipo) return;

        const proveedores = await getProveedoresVidrio({ categoria: 'VIDRIOS', tipo });
        if (!alive) return;
        setProveedoresDisp(proveedores);

        const nextProv = proveedores.includes(formData.proveedor) ? formData.proveedor : (proveedores[0] || '');
        setFormData((p) => ({ ...p, proveedor: nextProv }));
      } catch (e) {
        console.error(e);
        if (alive) setMensaje({ tipo: 'error', texto: 'Error cargando proveedores desde BD' });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoVidrio]);

  // Cuando cambia proveedor o tipo -> espesores
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { tipoVidrio, proveedor } = formData;
        if (!tipoVidrio || !proveedor) return;

        const espesores = await getEspesoresVidrio({ categoria: 'VIDRIOS', tipo: tipoVidrio, proveedor });
        if (!alive) return;
        setEspesoresDisp(espesores);

        const nextEsp = espesores.includes(formData.espesor) ? formData.espesor : (espesores[0] || '');
        setFormData((p) => ({ ...p, espesor: nextEsp }));
      } catch (e) {
        console.error(e);
        if (alive) setMensaje({ tipo: 'error', texto: 'Error cargando espesores desde BD' });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoVidrio, formData.proveedor]);

  // Cuando cambia espesor/proveedor/tipo -> acabados
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { tipoVidrio, proveedor, espesor } = formData;
        if (!tipoVidrio || !proveedor || !espesor) return;

        const acabados = await getAcabadosVidrio({
          categoria: 'VIDRIOS',
          tipo: tipoVidrio,
          proveedor,
          espesor_mm: espesor
        });

        if (!alive) return;
        setAcabadosDisp(acabados);

        const nextAc = acabados.includes(formData.acabado) ? formData.acabado : (acabados[0] || '');
        setFormData((p) => ({ ...p, acabado: nextAc }));
      } catch (e) {
        console.error(e);
        if (alive) setMensaje({ tipo: 'error', texto: 'Error cargando acabados desde BD' });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoVidrio, formData.proveedor, formData.espesor]);

  const calcular = async () => {
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData);
    setResultado(res);
    setMensaje(msg);
  };

  const limpiar = () => {
    setFormData((p) => ({
      ...defaultForm,
      tipoVidrio: p.tipoVidrio || '',
      proveedor: p.proveedor || '',
      espesor: p.espesor || '',
      acabado: p.acabado || ''
    }));
    setResultado(null);
    setMensaje(null);
    setSelectedIndex(-1);
  };

  const addToList = async () => {
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData);
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

  const updateSelected = async () => {
    if (selectedIndex < 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un vidrio de la lista para actualizar' });
      return;
    }
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }
    const nombre = formToTitulo(formData);
    setItems((prev) => prev.map((it, idx) => (idx === selectedIndex ? { formData: { ...formData }, resultado: res, nombre } : it)));
    setResultado(res);
    setMensaje(msg || { tipo: 'success', texto: 'Vidrio actualizado' });
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
    if (selectedIndex === idx) limpiar();
    else if (selectedIndex > idx) setSelectedIndex((p) => p - 1);
  };

  const totalLista = useMemo(() => items.reduce((sum, it) => sum + (it.resultado?.total || 0), 0), [items]);

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
        datos: { form: it.formData, desglose: it.resultado }
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
        <p className="text-blue-100 text-sm">Combos y precios desde BD (tarifas_vidrios)</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {tiposDisp.map((tipo) => (
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
                    <div className="text-xs text-gray-500">Desde BD</div>
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
                    {proveedoresDisp.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor}
                    onChange={(e) => setFormData({ ...formData, espesor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {espesoresDisp.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                  <select
                    value={formData.acabado}
                    onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {acabadosDisp.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Forma + Extras (mañana conectamos operaciones reales) */}
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
                  <span className="text-sm">Cantos</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.puntas}
                    onChange={(e) => setFormData({ ...formData, puntas: e.target.checked })}
                  />
                  <span className="text-sm">Puntas roma</span>
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
              <button onClick={calcular} className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Calcular
              </button>
              <button onClick={addToList} className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Añadir este vidrio a la lista
              </button>
              <button onClick={updateSelected} className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Actualizar vidrio seleccionado
              </button>
              <button onClick={limpiar} className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold">
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

          {/* LISTA */}
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
