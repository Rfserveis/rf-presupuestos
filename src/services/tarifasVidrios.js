import { supabase } from './supabase';

export async function getTarifaVidrio({ proveedor, tipo, espesor_mm, acabado }) {
  const { data, error } = await supabase
    .from('tarifas_vidrios')
    .select('precio_m2, pvb, id_rf')
    .eq('proveedor', proveedor)
    .eq('tipo', tipo)
    .eq('espesor_mm', espesor_mm)
    .eq('acabado', acabado)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data; // null si no existe
}

export async function getOperacionesVidrios({ proveedor }) {
  const { data, error } = await supabase
    .from('operaciones_vidrios')
    .select('id_rf, descripcion, unidad, precio, tipo_calculo, aplica_a, activo')
    .eq('proveedor', proveedor)
    .eq('activo', true)
    .order('descripcion', { ascending: true });

  if (error) throw error;
  return data || [];
}
