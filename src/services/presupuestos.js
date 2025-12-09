import { supabase } from './supabase'

export const presupuestosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('presupuestos')
      .select(`
        *,
        created_by_user:users!presupuestos_created_by_fkey(nombre, email),
        items(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obtenint pressupostos:', error)
      throw error
    }
    return data || []
  },

  async create(presupuesto) {
    const { data, error } = await supabase
      .from('presupuestos')
      .insert({
        nombre_cliente: presupuesto.nombreCliente,
        categoria: presupuesto.categoria,
        created_by: presupuesto.createdBy,
        estado: 'draft'
      })
      .select(`
        *,
        created_by_user:users!presupuestos_created_by_fkey(nombre, email)
      `)
      .single()

    if (error) {
      console.error('Error creant pressupost:', error)
      throw error
    }
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('presupuestos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const itemsService = {
  async getByPresupuesto(presupuestoId) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }
}