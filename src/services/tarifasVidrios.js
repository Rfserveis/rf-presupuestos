// src/services/tarifasVidrios.js
// Fuente única de verdad para combos y precios de vidrios desde Supabase.

import { supabase } from './supabase';

const norm = (s) => (s ?? '').toString().trim();

// Helpers: unique + sort
const uniq = (arr) => Array.from(new Set(arr.map(norm).filter(Boolean)));
const sortAlpha = (arr) => [...arr].sort((a, b) => a.localeCompare(b, 'es'));

const BASE_FILTERS = (q, { categoria = 'VIDRIOS', activo = true, soloConPrecio = true } = {}) => {
  let query = q;
  if (categoria) query = query.eq('categoria', categoria);
  if (activo !== null && activo !== undefined) query = query.eq('activo', !!activo);
  if (soloConPrecio) query = query.gt('precio_m2', 0);
  return query;
};

export async function getTiposVidrio({ categoria = 'VIDRIOS' } = {}) {
  const q = supabase.from('tarifas_vidrios').select('tipo');
  const { data, error } = await BASE_FILTERS(q, { categoria }).limit(10000);
  if (error) throw error;

  const tipos = sortAlpha(uniq((data || []).map((r) => r.tipo)));
  return tipos;
}

export async function getProveedoresVidrio({ categoria = 'VIDRIOS', tipo, pvb = null } = {}) {
  if (!tipo) return [];
  let q = supabase.from('tarifas_vidrios').select('proveedor').eq('tipo', tipo);

  // Si algún día filtras por PVB, esto te sirve ya.
  if (pvb !== null && pvb !== undefined && pvb !== '') q = q.eq('pvb', pvb);

  const { data, error } = await BASE_FILTERS(q, { categoria }).limit(10000);
  if (error) throw error;

  const proveedores = sortAlpha(uniq((data || []).map((r) => r.proveedor)));
  return proveedores;
}

export async function getEspesoresVidrio({ categoria = 'VIDRIOS', tipo, proveedor, pvb = null } = {}) {
  if (!tipo || !proveedor) return [];
  let q = supabase
    .from('tarifas_vidrios')
    .select('espesor_mm')
    .eq('tipo', tipo)
    .eq('proveedor', proveedor);

  if (pvb !== null && pvb !== undefined && pvb !== '') q = q.eq('pvb', pvb);

  const { data, error } = await BASE_FILTERS(q, { categoria }).limit(10000);
  if (error) throw error;

  // Ojo: espesor_mm es text (5+5, 10+10, 8, 12...). Orden “humano”
  const espesores = uniq((data || []).map((r) => r.espesor_mm));
  const sortEspesor = (a, b) => {
    const pa = a.split('+').map(Number);
    const pb = b.split('+').map(Number);
    const sa = pa.reduce((s, n) => s + (isNaN(n) ? 0 : n), 0);
    const sb = pb.reduce((s, n) => s + (isNaN(n) ? 0 : n), 0);
    return sa - sb || a.localeCompare(b, 'es');
  };

  return [...espesores].sort(sortEspesor);
}

export async function getAcabadosVidrio({ categoria = 'VIDRIOS', tipo, proveedor, espesor_mm, pvb = null } = {}) {
  if (!tipo || !proveedor || !espesor_mm) return [];
  let q = supabase
    .from('tarifas_vidrios')
    .select('acabado')
    .eq('tipo', tipo)
    .eq('proveedor', proveedor)
    .eq('espesor_mm', espesor_mm);

  if (pvb !== null && pvb !== undefined && pvb !== '') q = q.eq('pvb', pvb);

  const { data, error } = await BASE_FILTERS(q, { categoria }).limit(10000);
  if (error) throw error;

  const acabados = sortAlpha(uniq((data || []).map((r) => r.acabado)));
  return acabados;
}

export async function getPrecioM2Vidrio({
  categoria = 'VIDRIOS',
  tipo,
  proveedor,
  espesor_mm,
  acabado,
  pvb = null
} = {}) {
  if (!tipo || !proveedor || !espesor_mm || !acabado) return null;

  let q = supabase
    .from('tarifas_vidrios')
    .select('precio_m2')
    .eq('tipo', tipo)
    .eq('proveedor', proveedor)
    .eq('espesor_mm', espesor_mm)
    .eq('acabado', acabado);

  if (pvb !== null && pvb !== undefined && pvb !== '') q = q.eq('pvb', pvb);

  q = BASE_FILTERS(q, { categoria, soloConPrecio: false });

  const { data, error } = await q.maybeSingle();
  if (error) throw error;

  const precio = data?.precio_m2;
  return (precio === null || precio === undefined) ? null : Number(precio);
}
