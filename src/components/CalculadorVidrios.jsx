// src/components/CalculadorVidrios.jsx
// Layout como el de ayer + multi-vidrios + combos desde Supabase (VIDRIOS)
// Templado se muestra "Próximamente" (porque no hay precio > 0)

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import GuardarPresupuestoModal from './GuardarPresupuestoModal';
import { savePresupuestoConItems } from '../services/presupuestoStore';

// ==============================
// EXTRAS / OPERACIONES (fallback lógico)
// (Luego lo conectaremos a OPERACIONES_VIDRIOS cuando lo metas en Admin)
// ==============================
const OPERACIONES = {
  cantos: {
    Vallesglass: {
      '5+5': { Transparente: 1.2, Mate: 1.2, Gris: 4.27 },
      '6+6': { Transparente: 1.2, Mate: 1.2, Gris: 4.27 },
      '8+8': { default: 2.0 },
      '10+10': { default: 2.0 },
      '12+12': { default: 2.0 },
    },
    'Baros Vision': { default: 0 },
  },
  puntas: {
    Vallesglass: { Transparente: 2.0, Mate: 2.0, Gris: 2.4, templado: 2.4 },
    'Baros Vision': { default: 2.8 },
    'Control Glass': { default: 0 },
  },
  taladros: {
    Vallesglass: { '<=50': 5.5, '>50': 8.0 },
    'Baros Vision': { default: 2.22 },
    'Control Glass': { default: 0 },
  },
  recargos_forma: {
    Laminado: { pequeno: 16, grande: 32 },
    'Laminado Templado': { pequeno: 20, grande: 40 },
    Templado: { pequeno: 20, grande: 40 },
  },
};

const defaultForm = {
  ancho: '',
  alto: '',
  cantidad: 1,
  tipo: 'Laminado',
  proveedor: '',
  espesor_mm: '',
  acabado: '',
  forma: 'rectangular',
  cantos: false,
  puntas: false,
  taladros: 0,
  diametroTaladro: 40,
};

const norm = (v) => String(v ?? '').trim();

function buildTitulo(form) {
  const extras = [
    form.forma !== 'rectangular' ? 'inclinado' : null,
    form.cantos ? 'cantos' : null,
    form.puntas ? 'puntas' : null,
    Number(form.taladros) > 0 ? `taladros:${form.taladros}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `Vidrio ${form.ancho}x${form.alto} · ${form.tipo} · ${form.proveedor} · ${form.espesor_mm} · ${form.acabado}${
    extras ? ` · ${extras}` : ''
  }`;
}

// ==============================
// COMPONENTE
// ==============================
export default function CalculadorVidrios() {
  const [formData, setFormData] = useState({ ...defaultForm });

  // combos desde Supabase
  const [proveedores, setProveedores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [espesores, setEspesores] = useState([]);
  const [acabados, setAcabados] = useState([]);

  // cálculo
  const [precioM2, setPrecioM2] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // multi-vidrios
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // guardar
  const [openSave, setOpenSave] = useState(false);

  const templadoProximamente = useMemo(() => {
    return norm(formData.tipo).toLowerCase() === 'templado';
  }, [formData.tipo]);

  // ==============================
  // CARGA INICIAL (vistas)
  // ==============================
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: prov }, { data: tps }, { data: acb }] = await Promise.all([
          supabase.from('vw_vidrios_proveedores').select('*'),
          supabase.from('vw_vidrios_tipos').select('*'),
          supabase.from('vw_vidrios_acabados').select('*'),
        ]);

        const provList = (prov || []).map((r) => r.proveedor).filter(Boolean);
        const tiposList = (tps || []).map((r) => r.tipo).filter(Boolean);

        // Nota: acabados los cargamos "globales" solo para fallback; normalmente se filtran por espesor
        const acabList = (acb || []).map((r) => r.acabado).filter(Boolean);

        setProveedores(provList);
        setTipos(tiposList);
        setAcabados(acabList);

        // set defaults coherentes
        setFormData((prev) => ({
          ...prev,
          proveedor: prev.proveedor || provList[0] || '',
          tipo: prev.tipo || tiposList[0] || 'Laminado',
        }));
      } catch (e) {
        console.error(e);
        setMensaje({ tipo: 'error', texto: 'No se han podido cargar tarifas desde Supabase.' });
      }
    };

    load();
  }, []);

  // ==============================
  // Cargar espesores por (proveedor, tipo)
  // ==============================
  useEffect(() => {
    const loadEspesores = async () => {
      const proveedor = norm(formData.proveedor);
      const tipo = norm(formData.tipo);

      if (!proveedor || !tipo) return;

      // si es Templado sin precio, dejamos espesores vacíos (o si hay pero no activo)
      try {
        const { data, error } = await supabase
          .from('tarifas_vidrios')
          .select('espesor_mm')
          .eq('categoria', 'VIDRIOS')
          .eq('activo', true)
          .gt('precio_m2', 0)
          .eq('proveedor', proveedor)
          .eq('tipo', tipo);

        if (error) throw error;

        const uniq = Array.from(new Set((data || []).map((r) => r.espesor_mm).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );

        setEspesores(uniq);

        // autoselección si el actual no existe
        setFormData((prev) => ({
          ...prev,
          espesor_mm: uniq.includes(prev.espesor_mm) ? prev.espesor_mm : uniq[0] || '',
        }));
      } catch (e) {
        console.error(e);
        setEspesores([]);
        setFormData((prev) => ({ ...prev, espesor_mm: '' }));
      }
    };

    loadEspesores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.proveedor, formData.tipo]);

  // ==============================
  // Cargar acabados por (proveedor, tipo, espesor)
  // ==============================
  useEffect(() => {
    const loadAcabados = async () => {
      const proveedor = norm(formData.proveedor);
      const tipo = norm(formData.tipo);
      const espesor_mm = norm(formData.espesor_mm);

      if (!proveedor || !tipo || !espesor_mm) return;

      try {
        const { data, error } = await supabase
          .from('tarifas_vidrios')
          .select('acabado')
          .eq('categoria', 'VIDRIOS')
          .eq('activo', true)
          .gt('precio_m2', 0)
          .eq('proveedor', proveedor)
          .eq('tipo', tipo)
          .eq('espesor_mm', espesor_mm);

        if (error) throw error;

        const uniq = Array.from(new Set((data || []).map((r) => r.acabado).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );

        setAcabados(uniq);

        setFormData((prev) => ({
          ...prev,
          acabado: uniq.includes(prev.acabado) ? prev.acabado : uniq[0] || '',
        }));
      } catch (e) {
        console.error(e);
        setAcabados([]);
        setFormData((prev) => ({ ...prev, acabado: '' }));
      }
    };

    loadAcabados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.proveedor, formData.tipo, formData.espesor_mm]);

  // ==============================
  // Cargar precio m2 por (proveedor, tipo, espesor, acabado)
  // ==============================
  useEffect(() => {
    const loadPrecio = async () => {
      const proveedor = norm(formData.proveedor);
      const tipo = norm(formData.tipo);
      const espesor_mm = norm(formData.espesor_mm);
      const acabado = norm(formData.acabado);

      if (!proveedor || !tipo || !espesor_mm || !acabado) {
        setPrecioM2(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tarifas_vidrios')
          .select('precio_m2')
          .eq('categoria', 'VIDRIOS')
          .eq('activo', true)
          .gt('precio_m2', 0)
          .eq('proveedor', proveedor)
          .eq('tipo', tipo)
          .eq('espesor_mm', espesor_mm)
          .eq('acabado', acabado)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setPrecioM2(data?.precio_m2 ?? null);
      } catch (e) {
        console.error(e);
        setPrecioM2(null);
      }
    };

    loadPrecio();
  }, [formData.proveedor, formData.tipo, formData.espesor_mm, formData.acabado]);

  // ==============================
  // CÁLCULO (mantiene tu lógica)
  // ==============================
  const calcular = () => {
    setMensaje(null);

    if (templadoProximamente) {
      setResultado(null);
      setMensaje({ tipo: 'warning', texto: 'Templado está “Próximamente” (sin precios activos).' });
      return;
    }

    const ancho = Number(formData.ancho);
    const alto = Number(formData.alto);
    const cantidad = Number(formData.cantidad || 1);

    if (!ancho || !alto || ancho <= 0 || alto <= 0) {
      setResultado(null);
      setMensaje({ tipo: 'error', texto: 'Introduce ancho y alto (mm).' });
      return;
    }

    if (!formData.proveedor || !formData.tipo || !formData.espesor_mm || !formData.acabado) {
      setResultado(null);
      setMensaje({ tipo: 'error', texto: 'Completa proveedor, tipo, espesor y acabado.' });
      return;
    }

    if (precioM2 === null) {
      setResultado(null);
      setMensaje({ tipo: 'error', texto: 'No hay precio para esta combinación.' });
      return;
    }

    const anchoM = ancho / 1000;
    const altoM = alto / 1000;
    const m2Unidad = anchoM * altoM;
    const m2Total = m2Unidad * cantidad;
    const perimetroTotal = 2 * (anchoM + altoM) * cantidad;

    // base
    let precioBase = Number(precioM2) * m2Total;

    // recargo forma
    if (formData.forma !== 'rectangular') {
      const rec = OPERACIONES.recargos_forma[formData.tipo] || OPERACIONES.recargos_forma.Laminado;
      const recargo = formData.forma === 'inclinado_pequeno' ? rec.pequeno : rec.grande;
      precioBase *= 1 + recargo / 100;
    }

    // extras
    const extras = [];
    let totalExtras = 0;

    // cantos
    if (formData.cantos) {
      const prov = formData.proveedor;
      const esp = formData.espesor_mm;
      const acb = formData.acabado;

      if (prov === 'Baros Vision') {
        extras.push({ nombre: 'Cantos pulidos', detalle: 'Incluido', precio: 0 });
      } else {
        const mapProv = OPERACIONES.cantos[prov] || OPERACIONES.cantos.Vallesglass;
        const mapEsp = mapProv?.[esp] || mapProv?.default || {};
        const precioCanto = mapEsp?.[acb] ?? mapEsp?.default ?? 2.0;
        const coste = perimetroTotal * precioCanto;
        extras.push({
          nombre: 'Cantos pulidos',
          detalle: `${perimetroTotal.toFixed(2)} ml x ${precioCanto.toFixed(2)} €/ml`,
          precio: coste,
        });
        totalExtras += coste;
      }
    }

    // puntas
    if (formData.puntas) {
      const prov = formData.proveedor;
      const numPuntas = 4 * cantidad;

      let precioPunta = 2.0;
      if (prov === 'Baros Vision') precioPunta = 2.8;
      else if (norm(formData.acabado).toLowerCase() === 'gris') precioPunta = 2.4;
      else if (norm(formData.tipo).toLowerCase() !== 'laminado') precioPunta = 2.4;

      const coste = numPuntas * precioPunta;
      extras.push({ nombre: 'Puntas roma', detalle: `${numPuntas} ud x ${precioPunta.toFixed(2)} €/ud`, precio: coste });
      totalExtras += coste;
    }

    // taladros
    let msg = null;
    const taladros = Number(formData.taladros || 0);

    if (taladros > 0) {
      const tipoLower = norm(formData.tipo).toLowerCase();
      const prov = formData.proveedor;

      if (tipoLower === 'laminado') {
        msg = { tipo: 'warning', texto: 'Los taladros solo se aplican en templado / laminado templado.' };
      } else {
        const numTaladros = taladros * cantidad;
        if (prov === 'Control Glass') {
          extras.push({ nombre: `Taladros Ø${formData.diametroTaladro}mm`, detalle: 'No aplica aquí', precio: 0 });
        } else if (prov === 'Baros Vision') {
          const precioT = OPERACIONES.taladros['Baros Vision']?.default ?? 0;
          const coste = numTaladros * precioT;
          extras.push({
            nombre: `Taladros Ø${formData.diametroTaladro}mm`,
            detalle: `${numTaladros} ud x ${precioT.toFixed(2)} €/ud`,
            precio: coste,
          });
          totalExtras += coste;
        } else {
          const precioT = Number(formData.diametroTaladro) <= 50 ? 5.5 : 8.0;
          const coste = numTaladros * precioT;
          extras.push({
            nombre: `Taladros Ø${formData.diametroTaladro}mm`,
            detalle: `${numTaladros} ud x ${precioT.toFixed(2)} €/ud`,
            precio: coste,
          });
          totalExtras += coste;
        }
      }
    }

    const subtotal = precioBase + totalExtras;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    const res = {
      medidas: `${ancho} x ${alto} mm`,
      cantidad,
      m2Unidad,
      m2Total,
      tipo: formData.tipo,
      proveedor: formData.proveedor,
      espesor_mm: formData.espesor_mm,
      acabado: formData.acabado,
      forma:
        formData.forma === 'rectangular'
          ? 'Rectangular'
          : formData.forma === 'inclinado_pequeno'
          ? 'Inclinado (+recargo pequeño)'
          : 'Inclinado (+recargo grande)',
      precioM2: Number(precioM2),
      precioBase,
      extras,
      totalExtras,
      subtotal,
      iva,
      total,
    };

    setResultado(res);
    if (msg) setMensaje(msg);
  };

  const limpiar = () => {
    setFormData((prev) => ({
      ...defaultForm,
      tipo: prev.tipo || 'Laminado',
      proveedor: prev.proveedor || proveedores[0] || '',
    }));
    setResultado(null);
    setMensaje(null);
    setSelectedIndex(-1);
  };

  const canAdd = useMemo(() => {
    if (templadoProximamente) return false;
    if (!formData.ancho || !formData.alto) return false;
    if (!formData.proveedor || !formData.tipo || !formData.espesor_mm || !formData.acabado) return false;
    if (precioM2 === null) return false;
    return true;
  }, [templadoProximamente, formData, precioM2]);

  const addToList = () => {
    setMensaje(null);
    if (!canAdd) {
      setMensaje({ tipo: 'warning', texto: 'Completa todos los campos y asegúrate de que hay precio antes de añadir.' });
      return;
    }
    // asegurar cálculo actualizado
    calcular();
    const nombre = buildTitulo(formData);

    const item = {
      formData: { ...formData },
      nombre,
      // si resultado todavía no está listo por timing, lo recalculamos inmediatamente
      resultado: resultado ? { ...resultado } : null,
    };

    setItems((prev) => [...prev, item]);
    setMensaje({ tipo: 'success', texto: 'Vidrio añadido a la lista.' });

    // prepara siguiente vidrio manteniendo proveedor/tipo
    setResultado(null);
    setFormData((prev) => ({
      ...defaultForm,
      proveedor: prev.proveedor,
      tipo: prev.tipo,
    }));
    setSelectedIndex(-1);
  };

  const selectItem = (idx) => {
    const it = items[idx];
    setSelectedIndex(idx);
    setFormData({ ...it.formData });
    setResultado(it.resultado || null);
    setMensaje(null);
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (selectedIndex === idx) limpiar();
    else if (selectedIndex > idx) setSelectedIndex((s) => s - 1);
  };

  const totalLista = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.resultado?.total || 0), 0);
  }, [items]);

  const guardarPresupuesto = async ({ cliente_id, proyecto_id, impuestos }) => {
    if (items.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Añade al menos un vidrio a la lista antes de guardar.' });
      return;
    }

    try {
      const year = new Date().getFullYear();
      const numero = `VID-${year}-${String(Date.now()).slice(-6)}`;

      const itemsDB = items.map((it, idx) => {
        const qty = Number(it.formData?.cantidad || 1);
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

      await savePresupuestoConItems({
        numero,
        cliente_id,
        proyecto_id,
        impuestos,
        componente_tipo: 'vidrios',
        componente_titulo: 'Vidrios',
        items: itemsDB,
      });

      setMensaje({ tipo: 'success', texto: 'Presupuesto guardado correctamente.' });
      setItems([]);
      limpiar();
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: e.message || 'Error guardando en Supabase.' });
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* CABECERA AZUL (como ayer) */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">🪟 Calculador de Vidrios</h2>
            <p className="text-blue-100 text-sm">Layout clásico + lista lateral + tarifas desde Supabase</p>
          </div>

          {templadoProximamente && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
              Templado: Próximamente
            </span>
          )}
        </div>
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

        {/* 2 columnas como ayer: formulario + resumen / lista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IZQUIERDA: formulario */}
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

              <div className="grid grid-cols-3 gap-2">
                {['Laminado', 'Laminado Templado', 'Templado'].map((t) => {
                  const disabled = t === 'Templado'; // porque precio >0 = 0
                  const active = formData.tipo === t;
                  return (
                    <button
                      key={t}
                      onClick={() => !disabled && setFormData({ ...formData, tipo: t })}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        active ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={disabled}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{t}</div>
                        {disabled && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            Próximamente
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
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
                    {proveedores.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor_mm}
                    onChange={(e) => setFormData({ ...formData, espesor_mm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {espesores.length === 0 ? (
                      <option value="">—</option>
                    ) : (
                      espesores.map((e) => (
                        <option key={e} value={e}>
                          {e} mm
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                  <select
                    value={formData.acabado}
                    onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {acabados.length === 0 ? (
                      <option value="">—</option>
                    ) : (
                      acabados.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                <span>
                  Precio/m²: <span className="font-semibold text-gray-700">{precioM2 ? Number(precioM2).toFixed(2) : '—'}</span>
                </span>
                <span className={`${canAdd ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {canAdd ? 'Combinación válida' : 'Completa campos / sin precio'}
                </span>
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

            {/* Botones (como ayer + añadir) */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={calcular}
                disabled={templadoProximamente}
                className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              >
                Calcular
              </button>

              <button
                onClick={addToList}
                disabled={!canAdd}
                className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              >
                + Añadir otro vidrio
              </button>

              <button
                onClick={limpiar}
                className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
              >
                Limpiar
              </button>
            </div>

            {/* RESUMEN (panel derecho clásico dentro de la columna izquierda, como ayer) */}
            <div>
              {resultado ? (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Resumen (vidrio actual)</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Medidas:</span>
                      <span>{resultado.medidas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cantidad:</span>
                      <span>{resultado.cantidad}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>m² unidad:</span>
                      <span>{resultado.m2Unidad.toFixed(3)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>m² total:</span>
                      <span>{resultado.m2Total.toFixed(3)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio/m²:</span>
                      <span>{resultado.precioM2.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base:</span>
                      <span>{resultado.precioBase.toFixed(2)} €</span>
                    </div>

                    {resultado.extras?.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="font-semibold mb-1">Extras</div>
                        <div className="space-y-1">
                          {resultado.extras.map((ex, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span>
                                {ex.nombre}{' '}
                                <span className="text-gray-500">({ex.detalle})</span>
                              </span>
                              <span>{Number(ex.precio).toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span>Total extras:</span>
                          <span>{resultado.totalExtras.toFixed(2)} €</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-2">
                      <span>Subtotal:</span>
                      <span>{resultado.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>IVA (21%):</span>
                      <span>{resultado.iva.toFixed(2)} €</span>
                    </div>
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

          {/* DERECHA: lista lateral como ayer */}
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
                        idx === selectedIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => selectItem(idx)}
                      title="Click para editar"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-sm font-medium">{it.nombre}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(idx);
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="text-xs text-gray-600 mt-1">
                        {it.resultado ? (
                          <>
                            Subtotal: {it.resultado.subtotal.toFixed(2)} € · Total: {it.resultado.total.toFixed(2)} €
                          </>
                        ) : (
                          'Pendiente de cálculo'
                        )}
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
                  onClick={() => {
                    setItems([]);
                    limpiar();
                  }}
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
