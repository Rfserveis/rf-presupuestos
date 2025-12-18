import { useEffect, useMemo, useState } from 'react';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';
import { getTarifaVidrio, getOperacionesVidrios } from '../services/tarifasVidrios';

// -------------------------
// Helpers de normalización (para que NO salga 0€)
// -------------------------
const normEspesor = (s) => (s || '').replace(/\s*mm\s*$/i, '').trim(); // "6+6 mm" -> "6+6"
const normTipo = (t) => {
  const x = (t || '').toLowerCase();
  if (x.includes('templado')) return 'Templado';           // "Laminado Templado" -> "Templado"
  if (x.includes('doble')) return 'Doble';
  return 'Laminado';
};
const normAcabado = (a) => {
  const x = (a || '').toLowerCase();
  if (x.includes('mate')) return 'Mate';
  return 'Transparente';
};

// -------------------------
// Modelo del formulario (mantiene tus opciones “de siempre”)
// -------------------------
const defaultForm = {
  ancho: 1000,
  alto: 1500,
  cantidad: 1,

  // “Tipo de vidrio” (UI)
  tipoVidrioUI: 'Laminado', // Laminado | Laminado Templado | (si tu UI tiene más, añade aquí)
  proveedor: 'Vallesglass',
  espesor: '6+6 mm',
  acabado: 'Transparente',

  // “Forma y extras”
  forma: 'Rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 50, // ahora mismo usaremos Ø50 si hay taladros
};

export default function CalculadorVidrios() {
  // Formulario “actual”
  const [form, setForm] = useState(defaultForm);

  // Lista de vidrios añadidos
  const [lista, setLista] = useState([]); // items guardables
  const [editIndex, setEditIndex] = useState(null);

  // Operaciones desde BD (extras según proveedor)
  const [opsProveedor, setOpsProveedor] = useState([]);

  // Modal de guardado
  const [showGuardar, setShowGuardar] = useState(false);

  // -------------------------
  // Cargar operaciones del proveedor actual
  // -------------------------
  useEffect(() => {
    const run = async () => {
      try {
        const data = await getOperacionesVidrios({ proveedor: form.proveedor });
        setOpsProveedor(data || []);
      } catch (e) {
        console.error('Error cargando operaciones_vidrios:', e);
        setOpsProveedor([]);
      }
    };
    run();
  }, [form.proveedor]);

  // -------------------------
  // Cálculo de precio con tarifas reales
  // -------------------------
  const calcularPrecio = async (f) => {
    const anchoM = Number(f.ancho) / 1000;
    const altoM = Number(f.alto) / 1000;
    const m2 = Math.max(0, anchoM * altoM);

    const tipo = normTipo(f.tipoVidrioUI);
    const espesor_mm = normEspesor(f.espesor);
    const acabado = normAcabado(f.acabado);

    const tarifa = await getTarifaVidrio({
      proveedor: f.proveedor,
      tipo,
      espesor_mm,
      acabado,
    });

    if (!tarifa) {
      return {
        ok: false,
        motivo: `No hay tarifa para ${f.proveedor} / ${tipo} / ${espesor_mm} / ${acabado}`,
        base_m2: 0,
        m2,
        extras: [],
        unitario: 0,
        total: 0,
      };
    }

    // Base €/m²
    const base_m2 = Number(tarifa.precio_m2 || 0);
    let unitario = base_m2 * m2;

    // Mapear extras UI -> operaciones_vidrios
    // Buscamos por "descripcion" porque es lo que tenemos cargado.
    // (Si luego quieres, lo hacemos por id_rf y queda aún más sólido.)
    const pickOp = (containsText) =>
      opsProveedor.find((o) => (o.descripcion || '').toLowerCase().includes(containsText));

    const extras = [];

    // Canto pulido (POR_M2)
    if (f.cantos) {
      const op = pickOp('canto pulido');
      if (op) {
        const coste = Number(op.precio || 0) * m2;
        unitario += coste;
        extras.push({ descripcion: op.descripcion, qty: 1, coste });
      }
    }

    // Puntas romas (POR_UNIDAD)
    if (f.puntas) {
      const op = pickOp('puntas romas');
      if (op) {
        const coste = Number(op.precio || 0) * 1;
        unitario += coste;
        extras.push({ descripcion: op.descripcion, qty: 1, coste });
      }
    }

    // Taladros (POR_UNIDAD) – usamos Ø50 como estándar (tu tabla tiene “Taladro Ø 50”)
    const taladros = Number(f.taladros || 0);
    if (taladros > 0) {
      const op = pickOp('taladro');
      if (op) {
        const coste = Number(op.precio || 0) * taladros;
        unitario += coste;
        extras.push({ descripcion: op.descripcion, qty: taladros, coste });
      }
    }

    // Forma especial (FIJO) – si no es rectangular
    if ((f.forma || '').toLowerCase() !== 'rectangular') {
      const op = pickOp('forma especial');
      if (op) {
        const coste = Number(op.precio || 0);
        unitario += coste;
        extras.push({ descripcion: op.descripcion, qty: 1, coste });
      }
    }

    const cantidad = Math.max(1, Number(f.cantidad || 1));
    const total = unitario * cantidad;

    return {
      ok: true,
      motivo: null,
      base_m2,
      m2,
      extras,
      unitario,
      total,
      tarifa_id: tarifa.id_rf || null,
      pvb: tarifa.pvb || null,
      tipo_calc: tipo,
      espesor_calc: espesor_mm,
      acabado_calc: acabado,
    };
  };

  // -------------------------
  // Añadir / actualizar vidrio en lista
  // -------------------------
  const addOrUpdate = async () => {
    const calc = await calcularPrecio(form);

    const item = {
      nombre: `Vidrio ${lista.length + 1}`,
      cantidad: Math.max(1, Number(form.cantidad || 1)),
      precio_unitario: Number(calc.unitario || 0),
      total: Number(calc.total || 0),
      datos: {
        ...form,
        _calc: calc, // guardamos desglose y normalizaciones
      },
    };

    if (editIndex === null) {
      setLista((prev) => [...prev, item]);
    } else {
      setLista((prev) => prev.map((x, i) => (i === editIndex ? { ...item, nombre: x.nombre } : x)));
      setEditIndex(null);
    }
  };

  const editItem = (idx) => {
    const it = lista[idx];
    if (!it) return;
    setForm({ ...defaultForm, ...(it.datos || {}), _calc: undefined });
    setEditIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (idx) => {
    setLista((prev) => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) setEditIndex(null);
  };

  // Total lista (sin IVA aquí; IVA lo aplica BD en presupuesto con "impuestos")
  const totalLista = useMemo(() => {
    return lista.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  }, [lista]);

  // -------------------------
  // Guardar en Supabase (presupuesto + componente + items)
  // -------------------------
  const guardar = async ({ cliente_id, proyecto_id, impuestos }) => {
    const items = lista.map((it, i) => ({
      nombre: `Vidrio ${i + 1}`,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      datos: it.datos,
      posicion: i,
    }));

    await savePresupuestoConItems({
      numero: `PRE-${Date.now()}`,
      cliente_id,
      proyecto_id,
      impuestos,
      componente_tipo: 'vidrios',
      items,
    });

    alert('Presupuesto guardado');
    setLista([]);
    setForm(defaultForm);
    setEditIndex(null);
  };

  // -------------------------
  // UI (manteniendo “look” anterior: cabecera azul + cards)
  // -------------------------
  return (
    <div className="space-y-6">
      {/* Cabecera azul como tu estilo */}
      <div className="rounded-2xl overflow-hidden shadow">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="text-white text-2xl">🪟</div>
            <div>
              <h2 className="text-white text-xl font-bold">Calculador de Vidrios</h2>
              <p className="text-blue-100 text-sm">
                Multi-vidrios + Guardado por componentes (tarifas reales)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Medidas */}
              <div className="bg-gray-50 rounded-2xl p-5 border">
                <h3 className="font-semibold text-gray-800 mb-4">📐 Medidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Ancho (mm)</label>
                    <input
                      type="number"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.ancho}
                      onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Alto (mm)</label>
                    <input
                      type="number"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.alto}
                      onChange={(e) => setForm({ ...form, alto: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Cantidad</label>
                    <input
                      type="number"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de vidrio */}
              <div className="bg-gray-50 rounded-2xl p-5 border">
                <h3 className="font-semibold text-gray-800 mb-4">🔎 Tipo de Vidrio</h3>

                {/* Si en tu UI original eran “cards” de selección, mantenemos un select simple (limpio) */}
                <select
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.tipoVidrioUI}
                  onChange={(e) => setForm({ ...form, tipoVidrioUI: e.target.value })}
                >
                  <option value="Laminado">Laminado</option>
                  <option value="Laminado Templado">Laminado Templado</option>
                  <option value="Doble">Doble</option>
                </select>

                <p className="text-xs text-gray-500 mt-2">
                  (Internamente se normaliza para buscar tarifa: Laminado / Templado / Doble)
                </p>
              </div>

              {/* Especificaciones */}
              <div className="bg-gray-50 rounded-2xl p-5 border">
                <h3 className="font-semibold text-gray-800 mb-4">📋 Especificaciones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Proveedor</label>
                    <select
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.proveedor}
                      onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                    >
                      <option>Vallesglass</option>
                      <option>Vidriarte</option>
                      <option>Aislaglass</option>
                      <option>Cristalería Local</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Espesor</label>
                    <input
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.espesor}
                      onChange={(e) => setForm({ ...form, espesor: e.target.value })}
                      placeholder="Ej: 6+6 mm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Acabado</label>
                    <select
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.acabado}
                      onChange={(e) => setForm({ ...form, acabado: e.target.value })}
                    >
                      <option>Transparente</option>
                      <option>Mate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Forma y extras */}
              <div className="bg-gray-50 rounded-2xl p-5 border">
                <h3 className="font-semibold text-gray-800 mb-4">🧩 Forma y Extras</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Forma</label>
                    <select
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.forma}
                      onChange={(e) => setForm({ ...form, forma: e.target.value })}
                    >
                      <option>Rectangular</option>
                      <option>Forma especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Taladros (uds)</label>
                    <input
                      type="number"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                      value={form.taladros}
                      onChange={(e) => setForm({ ...form, taladros: Number(e.target.value) })}
                      min={0}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Ø {form.diametroTaladro} (ahora mismo usamos Ø50 si hay taladros)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.cantos}
                      onChange={(e) => setForm({ ...form, cantos: e.target.checked })}
                    />
                    Cantos pulidos
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.puntas}
                      onChange={(e) => setForm({ ...form, puntas: e.target.checked })}
                    />
                    Puntas romas
                  </label>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={addOrUpdate}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editIndex === null ? 'Añadir vidrio a la lista' : 'Actualizar vidrio'}
                  </button>

                  {editIndex !== null && (
                    <button
                      onClick={() => {
                        setEditIndex(null);
                        setForm(defaultForm);
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha: lista */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border shadow-sm p-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Lista de vidrios</h3>
                  <div className="text-xs text-gray-500">{lista.length} item(s)</div>
                </div>

                <div className="mt-3 space-y-3">
                  {lista.length === 0 ? (
                    <div className="text-sm text-gray-500">Aún no has añadido vidrios.</div>
                  ) : (
                    lista.map((it, idx) => (
                      <div key={idx} className="border rounded-xl p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-800">
                              {it.nombre} <span className="text-gray-400">x{it.cantidad}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {it.datos?.proveedor} · {it.datos?.espesor} · {it.datos?.acabado}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {Number(it.total || 0).toFixed(2)} €
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => editItem(idx)}
                            className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>

                        {!it.datos?._calc?.ok && (
                          <div className="mt-2 text-xs text-red-600">
                            {it.datos?._calc?.motivo || 'Sin tarifa (revisa espesor/tipo/acabado)'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 border-t pt-4 flex justify-between">
                  <div className="text-sm font-semibold">TOTAL lista (sin IVA)</div>
                  <div className="text-sm font-bold">{totalLista.toFixed(2)} €</div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setShowGuardar(true)}
                    disabled={lista.length === 0}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Guardar presupuesto (todos los vidrios)
                  </button>

                  <button
                    onClick={() => setLista([])}
                    disabled={lista.length === 0}
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >
                    No guardar (vaciar lista)
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Nota: el IVA se aplica al guardar usando el campo <strong>impuestos</strong> del presupuesto.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal guardado */}
      <GuardarPresupuestoModal
        open={showGuardar}
        onClose={() => setShowGuardar(false)}
        onConfirm={guardar}
      />
    </div>
  );
}
