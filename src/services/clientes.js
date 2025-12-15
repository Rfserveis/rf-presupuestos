// Servicio de Clientes - CRUD en Supabase
import { supabase } from './supabase';

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo clientes:', err);
    return { success: false, error: err.message };
  }
};

// Obtener cliente por ID
export const getClienteById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error obteniendo cliente:', err);
    return { success: false, error: err.message };
  }
};

// Crear nuevo cliente
export const createCliente = async (cliente) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nombre: cliente.nombre,
        empresa: cliente.empresa || null,
        email: cliente.email || null,
        telefono: cliente.telefono || null,
        direccion: cliente.direccion || null,
        ciudad: cliente.ciudad || null,
        codigo_postal: cliente.codigo_postal || null,
        nif: cliente.nif || null,
        notas: cliente.notas || null,
        activo: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error creando cliente:', err);
    return { success: false, error: err.message };
  }
};

// Actualizar cliente
export const updateCliente = async (id, cliente) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        codigo_postal: cliente.codigo_postal,
        nif: cliente.nif,
        notas: cliente.notas,
        activo: cliente.activo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error actualizando cliente:', err);
    return { success: false, error: err.message };
  }
};

// Eliminar cliente (soft delete)
export const deleteCliente = async (id) => {
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error eliminando cliente:', err);
    return { success: false, error: err.message };
  }
};

// Buscar clientes
export const searchClientes = async (query) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${query}%,empresa.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('activo', true)
      .order('nombre', { ascending: true })
      .limit(10);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error buscando clientes:', err);
    return { success: false, error: err.message };
  }
};

export default {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  searchClientes
};
