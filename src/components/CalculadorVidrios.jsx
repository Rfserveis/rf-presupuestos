// src/components/CalculadorVidrios.jsx

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

const defaultForm = {
  ancho: '',
  alto: '',
  cantidad: 1,
  tipoVidrio: '',
  proveedor: '',
  espesor: '', // VALUE (ej: 20)
  acabado: '',
  forma: 'rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 50
};

export default function CalculadorVidrios() {
  const [formData, setFormData] = useState({ ...defaultForm });

  const [tiposDisp, setTiposDisp] = useState([]);
  const [proveedoresDisp, setProveedoresDisp] = useState([]);
  const [espesoresDisp, setEspesoresDisp] = useState([]); // [{value,label}]
  const [acabadosDisp, setAcabadosDisp] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // map value -> label
  const espesorLabelByValue = useMemo(() => {
    const m = {};
    for (const o of espesoresDisp ?? []) {
      m[String(o.value)] = o.label;
    }
    return m;
  }, [espesoresDisp]);

  /* ======================
     CARGA TIPOS
  ====================== */
  useEffect(() => {
    (async () => {
      const tipos = await getTiposVidrio({ categoria: 'VIDRIOS' });
      setTiposDisp(tipos);
      setFormData((p) => ({ ...p, tipoVidrio: tipos[0] || '' }));
    })();
  }, []);

  /* ======================
     PROVEEDORES
  ====================== */
  useEffect(() => {
    if (!formData.tipoVidrio) return;
    (async () => {
      const provs = await getProveedoresVidrio({
        categoria: 'VIDRIOS',
        tipo: formData.tipoVidrio
      });
      setProveedoresDisp(provs);
      setFormData((p) => ({ ...p, proveedor: provs[0] || '' }));
    })();
  }, [formData.tipoVidrio]);

  /* ======================
     ESPESORES (FIX CLAVE)
  ====================== */
  useEffect(() => {
    if (!formData.tipoVidrio || !formData.proveedor) return;

    (async () => {
      const opciones = await getEspesoresVidrio({
        categoria: 'VIDRIOS',
        tipo: formData.tipoVidrio,
        proveedor: formData.proveedor
      });

      setEspesoresDisp(opciones);

      const values = opciones.map((o) => String(o.value));
      const current = String(formData.espesor || '');
      const next = values.includes(current) ? current : values[0] || '';

      setFormData((p) => ({ ...p, espesor: next }));
    })();
  }, [formData.tipoVidrio, formData.proveedor]);

  /* ======================
     ACABADOS
  ====================== */
  useEffect(() => {
    if (!formData.tipoVidrio || !formData.proveedor || !formData.espesor) return;

    (async () => {
      const acab = await getAcabadosVidrio({
        categoria: 'VIDRIOS',
        tipo: formData.tipoVidrio,
        proveedor: formData.proveedor,
        espesor_mm: Number(formData.espesor)
      });

      setAcabadosDisp(acab);
      setFormData((p) => ({ ...p, acabado: acab[0] || '' }));
    })();
  }, [formData.tipoVidrio, formData.proveedor, formData.espesor]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">🪟 Calculador de Vidrios</h2>

      {/* SELECTORES */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <select
          value={formData.proveedor}
          onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
        >
          {proveedoresDisp.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={String(formData.espesor)}
          onChange={(e) => setFormData({ ...formData, espesor: e.target.value })}
        >
          {espesoresDisp.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={formData.acabado}
          onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
        >
          {acabadosDisp.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-500">
        Espesor seleccionado: <b>{espesorLabelByValue[String(formData.espesor)]}</b>
      </div>
    </div>
  );
}
