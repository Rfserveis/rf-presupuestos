import { useState } from 'react';
import { supabase } from '../services/supabase';

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
        active ? 'bg-slate-100 text-slate-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('vidrios'); // vidrios | operaciones | otros
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);

  const uploadTarifasVidrios = async (file) => {
    setBusy(true);
    setLog('Leyendo Excel...');

    try {
      const XLSX = await import('xlsx');

      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      // Si tu Excel tiene hojas con nombre específico, aquí lo elegiremos.
      // Por ahora: primera hoja.
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length) {
        setLog('Excel vacío o hoja sin datos.');
        return;
      }

      const norm = (s) => String(s || '').trim().toLowerCase();

      const pick = (obj, keys) => {
        const map = Object.keys(obj).reduce((acc, k) => {
          acc[norm(k)] = obj[k];
          return acc;
        }, {});
        for (const k of keys) {
          const v = map[norm(k)];
          if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
        return '';
      };

      // Mapping flexible (para sobrevivir a headers raros)
      const payload = rows.map((r, i) => {
        const proveedor = pick(r, ['proveedor', 'supplier', 'prov']);
        const tipo = pick(r, ['tipo', 'type']);
        const espesor = pick(r, ['espesor_mm', 'espesor', 'espesor (mm)', 'vidrio', 'composición', 'composicion']);
        const acabado = pick(r, ['acabado', 'color', 'acabado/color', 'finish']);
        const precio = pick(r, ['precio_m2', 'precio', '€/m2', 'eur/m2', 'precio m2', 'pvp m2']);

        const espesor_mm = String(espesor).replace(/\s*mm\s*$/i, '').trim();
        const precio_m2 = Number(String(precio).replace(',', '.'));

        return {
          fuente: file.name,
          hoja: sheetName,
          fila: i + 2,
          proveedor: String(proveedor).trim(),
          tipo: String(tipo).trim(),
          espesor_mm,
          acabado: String(acabado).trim(),
          precio_m2: Number.isFinite(precio_m2) ? precio_m2 : null,
        };
      });

      const valid = payload.filter((p) => p.proveedor && p.tipo && p.espesor_mm && p.acabado && p.precio_m2 !== null);

      setLog(`Filas leídas: ${rows.length}. Filas válidas: ${valid.length}. Subiendo a tarifas_vidrios_raw...`);

      const batchSize = 500;
      for (let i = 0; i < valid.length; i += batchSize) {
        const batch = valid.slice(i, i + batchSize);
        const { error } = await supabase.from('tarifas_vidrios_raw').insert(batch);
        if (error) throw error;
      }

      setLog(`✅ OK: Importadas ${valid.length} filas a tarifas_vidrios_raw (fuente: ${file.name}).`);
    } catch (e) {
      console.error(e);
      setLog(`❌ ERROR: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Panel Admin</h2>
        <p className="text-sm text-gray-500">Carga y gestión de tarifas y reglas</p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'vidrios'} onClick={() => setTab('vidrios')}>
          Tarifas Vidrios
        </TabButton>
        <TabButton active={tab === 'operaciones'} onClick={() => setTab('operaciones')}>
          Operaciones/Reglas
        </TabButton>
        <TabButton active={tab === 'otros'} onClick={() => setTab('otros')}>
          Otros
        </TabButton>
      </div>

      {tab === 'vidrios' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border rounded-xl p-4">
            <div className="font-semibold text-slate-800">Subir Excel de tarifas de vidrios</div>
            <div className="text-sm text-gray-600 mt-1">
              Esto carga a <code className="px-1 bg-white border rounded">tarifas_vidrios_raw</code>.
              Luego validamos y pasamos a <code className="px-1 bg-white border rounded">tarifas_vidrios</code>.
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadTarifasVidrios(f);
                }}
              />
              {busy && <div className="text-xs text-gray-500 mt-2">Procesando...</div>}
            </div>
          </div>

          {log && <div className="text-sm p-3 rounded-lg bg-white border">{log}</div>}
        </div>
      )}

      {tab === 'operaciones' && (
        <div className="bg-slate-50 border rounded-xl p-4 text-sm text-gray-700">
          Aquí irá la carga del “archivo escrito” de reglas/operaciones (siguiente paso).
        </div>
      )}

      {tab === 'otros' && (
        <div className="bg-slate-50 border rounded-xl p-4 text-sm text-gray-700">
          Próximamente.
        </div>
      )}
    </div>
  );
}
