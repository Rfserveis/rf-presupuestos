// Servicio de Proyectos - CRUD en Supabase
import { supabase } from './supabase';

// Obtener todos los proyectos
export const getProyectos = async (filtros = {}) => {
  try {
    let query = supabase
      .from('proyectos')
      .select(`
        *,
        cliente:clientes(id, nombre, empresa)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros opcionales
    if (filtros.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id);
    }
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo proyectos:', err);
    return { success: false, error: err.message };
  }
};

// Obtener proyecto por ID con todos sus presupuestos
export const getProyectoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        cliente:clientes(*),
        presupuestos(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo proyecto:', err);
    return { success: false, error: err.message };
  }
};

// Crear nuevo proyecto
export const createProyecto = async (proyecto) => {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .insert([{
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || null,
        cliente_id: proyecto.cliente_id,
        categoria: proyecto.categoria,
        estado: 'pendiente',
        direccion_obra: proyecto.direccion_obra || null,
        fecha_inicio: proyecto.fecha_inicio || null,
        fecha_fin_prevista: proyecto.fecha_fin_prevista || null,
        notas: proyecto.notas || null,
        created_by: proyecto.created_by,
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
    console.error('Error creando proyecto:', err);
    return { success: false, error: err.message };
  }
};

// Actualizar proyecto
export const updateProyecto = async (id, proyecto) => {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .update({
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        cliente_id: proyecto.cliente_id,
        categoria: proyecto.categoria,
        estado: proyecto.estado,
        direccion_obra: proyecto.direccion_obra,
        fecha_inicio: proyecto.fecha_inicio,
        fecha_fin_prevista: proyecto.fecha_fin_prevista,
        fecha_fin_real: proyecto.fecha_fin_real,
        notas: proyecto.notas,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(id, nombre, empresa)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error actualizando proyecto:', err);
    return { success: false, error: err.message };
  }
};

// Cambiar estado del proyecto
export const updateEstadoProyecto = async (id, estado) => {
  try {
    const updateData = {
      estado,
      updated_at: new Date().toISOString()
    };

    // Si se completa, añadir fecha real de fin
    if (estado === 'completado') {
      updateData.fecha_fin_real = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('proyectos')
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

// Eliminar proyecto (soft delete)
export const deleteProyecto = async (id) => {
  try {
    const { error } = await supabase
      .from('proyectos')
      .update({ 
        estado: 'cancelado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error eliminando proyecto:', err);
    return { success: false, error: err.message };
  }
};

// Estadísticas de proyectos
export const getProyectosStats = async () => {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select('estado, categoria');

    if (error) throw error;

    const stats = {
      total: data.length,
      por_estado: {},
      por_categoria: {}
    };

    data.forEach(p => {
      // Contar por estado
      stats.por_estado[p.estado] = (stats.por_estado[p.estado] || 0) + 1;
      // Contar por categoría
      stats.por_categoria[p.categoria] = (stats.por_categoria[p.categoria] || 0) + 1;
    });

    return { success: true, data: stats };
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    return { success: false, error: err.message };
  }
};

export default {
  getProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
  updateEstadoProyecto,
  deleteProyecto,
  getProyectosStats
};
