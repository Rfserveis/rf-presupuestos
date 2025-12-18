import { useEffect, useState } from 'react';
import { getTarifaVidrio, getOperacionesVidrios } from '../services/tarifasVidrios';
import { savePresupuestoConItems } from '../services/presupuestoStore';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';

// ===============================
// MODELO BASE DE UN VIDRIO
// ===============================
const nuevoVidrio = () => ({
  ancho: 1000,
  alto: 1500,
  cantidad: 1,

  proveedor: 'Vallesglass',
  tipo: 'Laminado',
  espesor_mm: '6+6',
  acabado: 'Transparente',

  operaciones: {}, // { id_rf: cantidad }
  precio_unitario: 0,
  total: 0,
  desglose: {}
});

export default function CalculadorVidrios() {
  const [vidrios, setVidrios] = useState([nuevoVidrio()]);
  const [operaciones, setOperaciones] = useState([]);
  const [showGuardar, setShowGuardar] = useState(false);

  // ===============================
  // Cargar operaciones según proveedor
  // ===============================
  useEffect(() => {
    const proveedor = vidrios[0]?.proveedor;
    if (!proveedor) return;

    getOperacionesVidrios({ proveedor }).then(setOperaciones);
  }, [vidrios[0]?.proveedor]);

  // ===============================
  // Cálculo de un vidrio
  // ===============================
  const calcularVidrio = async (v) => {
    const anchoM = v.ancho / 1000;
    const altoM = v.alto / 1000;
    const m2 = anchoM * altoM;

    const tarifa = await getTarifaVidrio({
      proveedor: v.proveedor,
      tipo: v.tipo,
      espesor_mm: v.espesor_mm,
      acabado: v.acabado
    });

    if (!tarifa) return { ...v, precio_unitario: 0, total: 0 };

    let precioBase = tarifa.precio_m2 * m2;

    let extras = 0;
    let desglose = {
      base_m2: tarifa.precio_m2,
      superficie_m2: m2,
      extras: []
    };

    for (const op of operaciones) {
      const qty = v.operaciones[op.id_rf] || 0;
      if (!qty) continue;

      let coste = 0;
      if (op.tipo_calculo === 'POR_M2') {
        coste = op.precio * m2;
      } else if (op.tipo_calculo === 'POR_UNIDAD') {
        coste = op.precio * qty;
      } else {
        coste = op.precio;
      }

      extras += coste;
      desglose.extras.push({
        descripcion: op.descripcion,
        cantidad: qty,
        coste
      });
    }

    const unitario = precioBase + extras;
    const total = unitario * v.cantidad;

    return {
      ...v,
      precio_unitario: unitario,
      total,
      desglose
    };
  };

  // ===============================
  // Recalcular todos los vidrios
  // ===============================
  const recalcular = async () => {
    const calculados = await Promise.all(
      vidrios.map(v => calcularVidrio(v))
    );
    setVidrios(calculados);
  };

  useEffect(() => {
    recalcular();
    // eslint-disable-next-line
  }, [vidrios.map(v => JSON.stringify(v)).join('|')]);

  // ===============================
  // Guardar presupuesto
  // ===============================
  const guardarPresupuesto = async ({ cliente_id, proyecto_id, impuestos }) => {
    const items = vidrios.map((v, i) => ({
      nombre: `Vidrio ${i + 1}`,
      cantidad: v.cantidad,
      precio_unitario: v.precio_unitario,
      datos: v
    }));

    await savePresupuestoConItems({
      numero: `PRE-${Date.now()}`,
      cliente_id,
      proyecto_id,
      impuestos,
      componente_tipo: 'vidrios',
      items
    });

    alert('Presupuesto guardado');
    setVidrios([nuevoVidrio()]);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="space-y-6">

      {vidrios.map((v, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl shadow space-y-3">
          <h3 className="font-bold">Vidrio {idx + 1}</h3>

          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={v.ancho}
              onChange={e => {
                const c = [...vidrios];
                c[idx].ancho = +e.target.value;
                setVidrios(c);
              }} placeholder="Ancho mm" />

            <input type="number" value={v.alto}
              onChange={e => {
                const c = [...vidrios];
                c[idx].alto = +e.target.value;
                setVidrios(c);
              }} placeholder="Alto mm" />

            <input type="number" value={v.cantidad}
              onChange={e => {
                const c = [...vidrios];
                c[idx].cantidad = +e.target.value;
                setVidrios(c);
              }} placeholder="Cantidad" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <select value={v.proveedor}
              onChange={e => {
                const c = [...vidrios];
                c[idx].proveedor = e.target.value;
                setVidrios(c);
              }}>
              <option>Vallesglass</option>
              <option>Vidriarte</option>
              <option>Aislaglass</option>
              <option>Cristalería Local</option>
            </select>

            <select value={v.tipo}
              onChange={e => {
                const c = [...vidrios];
                c[idx].tipo = e.target.value;
                setVidrios(c);
              }}>
              <option>Laminado</option>
              <option>Templado</option>
              <option>Doble</option>
            </select>

            <input value={v.espesor_mm}
              onChange={e => {
                const c = [...vidrios];
                c[idx].espesor_mm = e.target.value;
                setVidrios(c);
              }} placeholder="Espesor" />

            <select value={v.acabado}
              onChange={e => {
                const c = [...vidrios];
                c[idx].acabado = e.target.value;
                setVidrios(c);
              }}>
              <option>Transparente</option>
              <option>Mate</option>
            </select>
          </div>

          {/* Operaciones */}
          <div className="grid grid-cols-3 gap-2">
            {operaciones.map(op => (
              <label key={op.id_rf} className="text-sm flex gap-2">
                <input type="number" min="0"
                  value={v.operaciones[op.id_rf] || ''}
                  onChange={e => {
                    const c = [...vidrios];
                    c[idx].operaciones[op.id_rf] = +e.target.value;
                    setVidrios(c);
                  }}
                />
                {op.descripcion}
              </label>
            ))}
          </div>

          <div className="text-right font-semibold">
            Total vidrio: {v.total.toFixed(2)} €
          </div>

          {vidrios.length > 1 && (
            <button
              onClick={() => setVidrios(vidrios.filter((_, i) => i !== idx))}
              className="text-red-600 text-sm"
            >
              Eliminar vidrio
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => setVidrios([...vidrios, nuevoVidrio()])}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        ➕ Añadir otro vidrio
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => setShowGuardar(true)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Guardar presupuesto
        </button>

        <button
          onClick={() => setVidrios([nuevoVidrio()])}
          className="px-4 py-2 border rounded"
        >
          No guardar
        </button>
      </div>

      <GuardarPresupuestoModal
        open={showGuardar}
        onClose={() => setShowGuardar(false)}
        onConfirm={guardarPresupuesto}
      />
    </div>
  );
}
