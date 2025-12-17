// Servicio de Presupuestos - CRUD en Supabase
import { supabase } from './supabase';

// ✅ Categorías ACTIVAS (solo las que quieres)
export const CATEGORIAS = {
  VIDRIOS: 'vidrios',
  MARQUESINAS: 'marquesinas',
  BARANDILLAS_TOP_GLASS: 'barandillas_top_glass',
  ESCALERAS_RETRACTILES: 'escaleras_retractiles'
};

// Estados de presupuestos
export const ESTADOS = {
  BORRADOR: 'borrador',
  ENVIADO: 'enviado',
  ACEPTADO: 'aceptado',
  RECHAZADO: 'rechazado',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
};

// Obtener todos los presupuestos
export const getPresupuestos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('presupuestos')
      .select(`
        *,
        proyecto:proyectos(id, nombre, cliente_id),
        cliente:clientes(id, nombre, empresa)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros.proyecto_id) query = query.eq('proyecto_id', filtros.proyecto_id);
    if (filtros.cliente_id) query = query.eq('cliente_id', filtros.cliente_id);
    if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.limit) query = query.limit(filtros.limit);

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo presupuestos:', err);
    return { success: false, error: err.message };
  }
};

// Obtener presupuesto por ID
export const getPresupuestoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select(`
        *,
        proyecto:proyectos(*),
        cliente:clientes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo presupuesto:', err);
    return { success: false, error: err.message };
  }
};

// Crear nuevo presupuesto
export const createPresupuesto = async (presupuesto) => {
  try {
    // Generar número de presupuesto
    const numero = await generarNumeroPresupuesto(presupuesto.categoria);

    const { data, error } = await supabase
      .from('presupuestos')
      .insert([{
        numero,
        categoria: presupuesto.categoria,
        proyecto_id: presupuesto.proyecto_id || null,
        cliente_id: presupuesto.cliente_id,
        datos: presupuesto.datos, // JSON con los datos del calculador
        subtotal: presupuesto.subtotal,
        iva: presupuesto.iva || 21,
        total: presupuesto.total,
        estado: 'borrador',
        notas: presupuesto.notas || null,
        validez_dias: presupuesto.validez_dias || 30,
        condiciones: presupuesto.condiciones || null,
        created_by: presupuesto.created_by,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        cliente:clientes(id, nombre, empresa)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error creando presupuesto:', err);
    return { success: false, error: err.message };
  }
};

// Generar número de presupuesto único
const generarNumeroPresupuesto = async (categoria) => {
  const year = new Date().getFullYear();
  const prefix = categoria.substring(0, 3).toUpperCase();

  // Obtener el último número de esta categoría y año
  const { data } = await supabase
    .from('presupuestos')
    .select('numero')
    .like('numero', `${prefix}-${year}-%`)
    .order('numero', { ascending: false })
    .limit(1);

  let secuencia = 1;
  if (data && data.length > 0) {
    const ultimoNumero = data[0].numero;
    const partes = ultimoNumero.split('-');
    secuencia = parseInt(partes[2], 10) + 1;
  }

  return `${prefix}-${year}-${secuencia.toString().padStart(4, '0')}`;
};

// Actualizar presupuesto
export const updatePresupuesto = async (id, presupuesto) => {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .update({
        datos: presupuesto.datos,
        subtotal: presupuesto.subtotal,
        iva: presupuesto.iva,
        total: presupuesto.total,
        notas: presupuesto.notas,
        validez_dias: presupuesto.validez_dias,
        condiciones: presupuesto.condiciones,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error actualizando presupuesto:', err);
    return { success: false, error: err.message };
  }
};

// Cambiar estado del presupuesto
export const updateEstadoPresupuesto = async (id, estado) => {
  try {
    const updateData = {
      estado,
      updated_at: new Date().toISOString()
    };

    // Añadir fechas según el estado
    if (estado === 'enviado') {
      updateData.fecha_envio = new Date().toISOString();
    } else if (estado === 'aceptado') {
      updateData.fecha_aceptacion = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('presupuestos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error actualizando estado:', err);
    return { success: false, error: err.message };
  }
};

// Duplicar presupuesto
export const duplicarPresupuesto = async (id, nuevoClienteId = null) => {
  try {
    const { data: original, error: fetchError } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Crear copia
    const numero = await generarNumeroPresupuesto(original.categoria);

    const { data, error } = await supabase
      .from('presupuestos')
      .insert([{
        numero,
        categoria: original.categoria,
        proyecto_id: null,
        cliente_id: nuevoClienteId || original.cliente_id,
        datos: original.datos,
        subtotal: original.subtotal,
        iva: original.iva,
        total: original.total,
        estado: 'borrador',
        notas: `Duplicado de ${original.numero}`,
        validez_dias: original.validez_dias,
        condiciones: original.condiciones,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error duplicando presupuesto:', err);
    return { success: false, error: err.message };
  }
};

// Eliminar presupuesto (soft delete)
export const deletePresupuesto = async (id) => {
  try {
    const { error } = await supabase
      .from('presupuestos')
      .update({
        estado: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error eliminando presupuesto:', err);
    return { success: false, error: err.message };
  }
};

// Estadísticas de presupuestos
export const getPresupuestosStats = async (periodo = 'mes') => {
  try {
    let fechaInicio = new Date();

    switch (periodo) {
      case 'semana':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      case 'año':
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        break;
      default:
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }

    const { data, error } = await supabase
      .from('presupuestos')
      .select('estado, categoria, total, created_at')
      .gte('created_at', fechaInicio.toISOString());

    if (error) throw error;

    const stats = {
      total_count: data.length,
      total_importe: data.reduce((sum, p) => sum + (p.total || 0), 0),
      por_estado: {},
      por_categoria: {},
      aceptados: {
        count: 0,
        importe: 0
      }
    };

    data.forEach(p => {
      // Por estado
      stats.por_estado[p.estado] = (stats.por_estado[p.estado] || 0) + 1;

      // Por categoría
      if (!stats.por_categoria[p.categoria]) {
        stats.por_categoria[p.categoria] = { count: 0, importe: 0 };
      }
      stats.por_categoria[p.categoria].count++;
      stats.por_categoria[p.categoria].importe += p.total || 0;

      // Aceptados
      if (p.estado === 'aceptado') {
        stats.aceptados.count++;
        stats.aceptados.importe += p.total || 0;
      }
    });

    // Calcular ratio de conversión
    const enviados = stats.por_estado['enviado'] || 0;
    const aceptados = stats.aceptados.count;
    stats.ratio_conversion = enviados > 0 ? ((aceptados / (enviados + aceptados)) * 100).toFixed(1) : 0;

    return { success: true, data: stats };
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    return { success: false, error: err.message };
  }
};

export default {
  CATEGORIAS,
  ESTADOS,
  getPresupuestos,
  getPresupuestoById,
  createPresupuesto,
  updatePresupuesto,
  updateEstadoPresupuesto,
  duplicarPresupuesto,
  deletePresupuesto,
  getPresupuestosStats
};
