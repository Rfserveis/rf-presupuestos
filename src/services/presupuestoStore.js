import { supabase } from './supabase';

/**
 * Guarda/actualiza un presupuesto y reemplaza los ítems del componente.
 * Estructura:
 *  - public.presupuestos
 *  - public.presupuesto_componentes
 *  - public.presupuesto_items
 *
 * items: [{ nombre, datos, cantidad, precio_unitario, posicion }]
 */
export async function savePresupuestoConItems({
  presupuestoId = null,
  numero,                  // string (si no lo tienes aún, lo generamos luego)
  cliente_id,
  proyecto_id = null,
  impuestos = 21,
  notas = null,
  condiciones = null,
  validez_dias = 30,

  componente_tipo,         // 'vidrios' | 'marquesinas' | 'barandillas_top_glass' | 'escaleras_retractiles'
  componente_titulo = null,

  items = []
}) {
  // 1) Cabecera presupuesto
  let presupuesto;

  if (!presupuestoId) {
    const { data, error } = await supabase
      .from('presupuestos')
      .insert([{
        numero,
        cliente_id,
        proyecto_id,
        impuestos,
        notas,
        condiciones,
        validez_dias,
        // created_by lo pone default (o lo tienes ya con trigger/default)
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) throw error;
    presupuesto = data;
  } else {
    const { data, error } = await supabase
      .from('presupuestos')
      .update({
        cliente_id,
        proyecto_id,
        impuestos,
        notas,
        condiciones,
        validez_dias,
        updated_at: new Date().toISOString()
      })
      .eq('id', presupuestoId)
      .select('*')
      .single();

    if (error) throw error;
    presupuesto = data;
  }

  // 2) Upsert componente
  // Nota: usamos (presupuesto_id, tipo, titulo) como unique, así que podemos upsert
  const { data: componente, error: compErr } = await supabase
    .from('presupuesto_componentes')
    .upsert([{
      presupuesto_id: presupuesto.id,
      tipo: componente_tipo,
      titulo: componente_titulo
    }], { onConflict: 'presupuesto_id,tipo,titulo' })
    .select('*')
    .single();

  if (compErr) throw compErr;

  // 3) Reemplazar ítems (simple y robusto)
  // Borramos y volvemos a insertar. Para edición fina luego se optimiza.
  const { error: delErr } = await supabase
    .from('presupuesto_items')
    .delete()
    .eq('componente_id', componente.id);

  if (delErr) throw delErr;

  if (items.length > 0) {
    const payload = items.map((it, idx) => ({
      componente_id: componente.id,
      nombre: it.nombre || `Item ${idx + 1}`,
      datos: it.datos || {},
      cantidad: it.cantidad ?? 1,
      precio_unitario: it.precio_unitario ?? 0,
      posicion: it.posicion ?? idx
    }));

    const { error: insErr } = await supabase
      .from('presupuesto_items')
      .insert(payload);

    if (insErr) throw insErr;
  }

  // Los triggers en BD recalculan subtotal/total automáticamente
  return { success: true, presupuesto_id: presupuesto.id, componente_id: componente.id };
}
