import React, { useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

export default function GuardarPresupuestoModal({
  open,
  onClose,
  onSaved,
  defaultImpuestos = 21,
  defaultNumero = 'PRE-TMP-0000'
}) {
  const [clienteNombre, setClienteNombre] = useState('');
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [impuestos, setImpuestos] = useState(defaultImpuestos);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSave = useMemo(() => clienteNombre.trim().length >= 2, [clienteNombre]);

  if (!open) return null;

  const ensureCliente = async () => {
    // Buscar cliente exacto por nombre (simple MVP)
    const { data: existentes, error } = await supabase
      .from('clientes')
      .select('id,nombre')
      .ilike('nombre', clienteNombre.trim())
      .limit(5);

    if (error) throw error;

    const exact = (existentes || []).find(c => c.nombre.toLowerCase() === clienteNombre.trim().toLowerCase());
    if (exact) return exact.id;

    const { data: nuevo, error: insErr } = await supabase
      .from('clientes')
      .insert([{ nombre: clienteNombre.trim() }])
      .select('id')
      .single();

    if (insErr) throw insErr;
    return nuevo.id;
  };

  const ensureProyecto = async (cliente_id) => {
    if (!proyectoNombre.trim()) return null;

    const { data: existentes, error } = await supabase
      .from('proyectos')
      .select('id,nombre,cliente_id')
      .eq('cliente_id', cliente_id)
      .ilike('nombre', proyectoNombre.trim())
      .limit(5);

    if (error) throw error;

    const exact = (existentes || []).find(p => p.nombre.toLowerCase() === proyectoNombre.trim().toLowerCase());
    if (exact) return exact.id;

    const { data: nuevo, error: insErr } = await supabase
      .from('proyectos')
      .insert([{ cliente_id, nombre: proyectoNombre.trim() }])
      .select('id')
      .single();

    if (insErr) throw insErr;
    return nuevo.id;
  };

  const handleSave = async () => {
    setError('');
    if (!canSave) {
      setError('Tienes que poner un nombre de cliente.');
      return;
    }

    setLoading(true);
    try {
      const cliente_id = await ensureCliente();
      const proyecto_id = await ensureProyecto(cliente_id);

      onSaved?.({
        numero: defaultNumero,
        cliente_id,
        proyecto_id,
        impuestos: Number(impuestos) || 21
      });

      onClose?.();
    } catch (e) {
      setError(e.message || 'Error guardando');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Guardar presupuesto</h3>
            <p className="text-sm text-gray-500">Necesitamos al menos un cliente. Proyecto es opcional.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Ej: Juan Pérez / Empresa X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto (opcional)</label>
            <input
              value={proyectoNombre}
              onChange={(e) => setProyectoNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Ej: Reforma oficina, Terraza 3º..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impuestos (%)</label>
            <input
              type="number"
              value={impuestos}
              onChange={(e) => setImpuestos(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || loading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
