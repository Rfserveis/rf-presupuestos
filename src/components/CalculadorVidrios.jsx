import { useState } from 'react';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';

// ===============================
// UTIL: calcular un vidrio (tu lógica encapsulada)
// ===============================
function calcularVidrio(formData) {
  const {
    ancho, alto, cantidad, tipoVidrio, proveedor,
    espesor, acabado, forma, cantos, puntas,
    taladros, diametroTaladro
  } = formData;

  const anchoM = ancho / 1000;
  const altoM = alto / 1000;
  const m2Unidad = anchoM * altoM;
  const m2Total = m2Unidad * cantidad;

  // ⚠️ Simplificado aquí: precio unitario ficticio
  // En el siguiente paso lo conectamos con tu tabla real
  const precioUnitario = m2Unidad * 50;

  return {
    nombre: `Vidrio ${ancho}x${alto}`,
    cantidad,
    precio_unitario: precioUnitario,
    datos: {
      ancho, alto, tipoVidrio, proveedor,
      espesor, acabado, forma, cantos,
      puntas, taladros, diametroTaladro
    }
  };
}

export default function CalculadorVidrios() {
  const [vidrios, setVidrios] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    ancho: 1000,
    alto: 1500,
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

  const addVidrio = () => {
    const item = calcularVidrio(form);
    setVidrios([...vidrios, item]);
  };

  const removeVidrio = (index) => {
    setVidrios(vidrios.filter((_, i) => i !== index));
  };

  const guardar = async ({ cliente_id, proyecto_id, impuestos }) => {
    await savePresupuestoConItems({
      numero: `PRE-${Date.now()}`,
      cliente_id,
      proyecto_id,
      impuestos,
      componente_tipo: 'vidrios',
      items: vidrios
    });

    setVidrios([]);
    alert('Presupuesto guardado correctamente');
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <h2 className="text-xl font-bold">🪟 Calculador de Vidrios</h2>

      {/* FORMULARIO BÁSICO */}
      <div className="grid grid-cols-3 gap-3">
        <input type="number" value={form.ancho}
          onChange={e => setForm({ ...form, ancho: +e.target.value })}
          placeholder="Ancho mm" className="border p-2 rounded" />
        <input type="number" value={form.alto}
          onChange={e => setForm({ ...form, alto: +e.target.value })}
          placeholder="Alto mm" className="border p-2 rounded" />
        <input type="number" value={form.cantidad}
          onChange={e => setForm({ ...form, cantidad: +e.target.value })}
          placeholder="Cantidad" className="border p-2 rounded" />
      </div>

      <button
        onClick={addVidrio}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        ➕ Añadir vidrio
      </button>

      {/* LISTA DE VIDRIOS */}
      {vidrios.length > 0 && (
        <div className="border rounded p-4 space-y-2">
          {vidrios.map((v, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <strong>{v.nombre}</strong> — {v.cantidad} ud
              </div>
              <button
                onClick={() => removeVidrio(i)}
                className="text-red-600 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ACCIONES */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowModal(true)}
          disabled={vidrios.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          💾 Guardar presupuesto
        </button>

        <button
          onClick={() => setVidrios([])}
          className="px-4 py-2 border rounded"
        >
          ❌ No guardar
        </button>
      </div>

      <GuardarPresupuestoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={guardar}
      />
    </div>
  );
}
