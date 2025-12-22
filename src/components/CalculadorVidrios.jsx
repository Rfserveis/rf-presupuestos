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
  espesor: '', // guardamos VALUE (espesor_mm)
  acabado: '',
  forma: 'rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 50
};

function formToTitulo(formData, espesorLabelByValue) {
  const { ancho, alto, tipoVidrio, proveedor, espesor, acabado, forma, cantos, puntas, taladros } = formData;
  const espLabel = espesorLabelByValue?.[String(espesor)] ?? espesor;

  const extras = [
    forma !== 'rectangular' ? 'inclinado' : null,
    cantos ? 'cantos' : null,
    puntas ? 'puntas' : null,
    Number(taladros) > 0 ? `taladros:${taladros}` : null
  ].filter(Boolean).join(', ');

  return `Vidrio ${ancho}x${alto} · ${tipoVidrio} · ${proveedor} · ${espLabel} · ${acabado}${extras ? ` · ${extras}` : ''}`;
}

async function calcularVidrioDB(formData, espesorLabelByValue) {
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
    espesor_mm: Number(espesor),
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

  // Extras (placeholder visual)
  const extras = [];
  const totalExtras = 0;

  // Reglas base (mensajes)
  let mensaje = null;
  if (Number(taladros) > 0 && !(tipoVidrio === 'Templado' || tipoVidrio === 'Laminado Templado')) {
    mensaje = { tipo: 'warning', texto: 'Los taladros solo aplican a Templado o Laminado Templado' };
  }

  const subtotal = precioBase + totalExtras;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const espLabel = espesorLabelByValue?.[String(espesor)] ?? espesor;

  return {
    resultado: {
      medidas: `${ancho} x ${alto} mm`,
      cantidad: qty,
      m2Unidad,
      m2Total,
      tipoVidrio,
      proveedor,
      espesor: espLabel,        // mostramos bonito (10+10)
      espesor_mm: Number(espesor), // guardamos real (20)
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
  const [espesoresDisp, setEspesoresDisp] = useState([]); // [{value,label}]
  const [acabadosDisp, setAcabadosDisp] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [items, setItems] = useState([]); // [{ formData, resultado, nombre }]
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [openSave, setOpenSave] = useState(false);

  // Map value -> label
  const espesorLabelByValue = useMemo(() => {
    const m = {};
    for (const o of espesoresDisp ?? []) m[String(o.value)] = o.label;
    return m;
  }, [espesoresDisp]);

  // Cargar tipos iniciales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tipos = await getTiposVidrio({ categoria: 'VIDRIOS' });
        if (!alive) return;
        setTiposDisp(tipos);

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

  // Cuando cambia proveedor o tipo -> espesores (con label)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { tipoVidrio, proveedor } = formData;
        if (!tipoVidrio || !proveedor) return;

        const opciones = await getEspesoresVidrio({ categoria: 'VIDRIOS', tipo: tipoVidrio, proveedor });
        if (!alive) return;

        setEspesoresDisp(opciones);

        const values = (opciones ?? []).map((o) => String(o.value));
        const current = String(formData.espesor || '');
        const nextEsp = values.includes(current) ? current : (values[0] || '');
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
          espesor_mm: Number(espesor)
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
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData, espesorLabelByValue);
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
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData, espesorLabelByValue);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }
    const nombre = formToTitulo(formData, espesorLabelByValue);
    setItems((prev) => [...prev, { formData: { ...formData }, resultado: res, nombre }]);
    setMensaje({ tipo: 'success', texto: 'Vidrio añadido a la lista' });
    limpiar();
  };

  const updateSelected = async () => {
    if (selectedIndex < 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un vidrio de la lista para actualizar' });
      return;
    }
    const { resultado: res, mensaje: msg } = await calcularVidrioDB(formData, espesorLabelByValue);
    if (!res) {
      setResultado(null);
      setMensaje(msg);
      return;
    }
    const nombre = formToTitulo(formData, espesorLabelByValue);
    setItems((prev) =>
      prev.map((it, idx) => (idx === selectedIndex ? { formData: { ...formData }, resultado: res, nombre } : it))
    );
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

  // UI (tuya) — sin cambios funcionales salvo el select de espesor
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* ... TODO tu layout tal cual ... */}
      {/* 👇 SOLO recuerda: en el select de espesor ya usamos label/value */}
      <div className="p-6">
        {/* tu render original aquí (no lo repito entero para no reventarte el chat) */}
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
