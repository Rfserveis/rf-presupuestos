import { supabase } from './supabase';

// Utils
const uniq = (arr) =>
  Array.from(
    new Set(
      (arr ?? []).filter(
        (v) => v !== null && v !== undefined && String(v).trim() !== ''
      )
    )
  );

export async function getTiposVidrio({ categoria }) {
  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('tipo')
    .eq('categoria', categoria)
    .eq('activo', true);

  if (error) throw error;
  return uniq((data ?? []).map((r) => r.tipo)).sort();
}

export async function getProveedoresVidrio({ categoria, tipo }) {
  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('proveedor')
    .eq('categoria', categoria)
    .eq('tipo', tipo)
    .eq('activo', true);

  if (error) throw error;
  return uniq((data ?? []).map((r) => r.proveedor)).sort();
}

/**
 * 👉 DEVUELVE:
 * [
 *   { value: 20, label: "10+10" },
 *   { value: 16, label: "8+8" }
 * ]
 */
export async function getEspesoresVidrio({ categoria, tipo, proveedor }) {
  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('espesor_mm, espesor_label')
    .eq('categoria', categoria)
    .eq('tipo', tipo)
    .eq('proveedor', proveedor)
    .eq('activo', true)
    .not('espesor_mm', 'is', null)
    .order('espesor_mm', { ascending: true });

  if (error) throw error;

  const map = new Map();

  for (const r of data ?? []) {
    const v = r.espesor_mm;
    if (v == null) continue;

    if (!map.has(v)) {
      map.set(v, {
        value: v,
        label: r.espesor_label ?? String(v)
      });
    }
  }

  return Array.from(map.values());
}

export async function getAcabadosVidrio({
  categoria,
  tipo,
  proveedor,
  espesor_mm
}) {
  const esp = Number(espesor_mm);

  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('acabado')
    .eq('categoria', categoria)
    .eq('tipo', tipo)
    .eq('proveedor', proveedor)
    .eq('espesor_mm', esp)
    .eq('activo', true);

  if (error) throw error;
  return uniq((data ?? []).map((r) => r.acabado)).sort();
}

export async function getPrecioM2Vidrio({
  categoria,
  tipo,
  proveedor,
  espesor_mm,
  acabado
}) {
  const esp = Number(espesor_mm);

  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('precio_m2')
    .eq('categoria', categoria)
    .eq('tipo', tipo)
    .eq('proveedor', proveedor)
    .eq('espesor_mm', esp)
    .eq('acabado', acabado)
    .eq('activo', true)
    .maybeSingle();

  if (error) throw error;
  return data?.precio_m2 ?? null;
}
