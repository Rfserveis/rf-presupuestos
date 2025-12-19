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
  const [tab, setTab] = useState('vidrios');
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);

  // 🔴 CONFIGURACIÓN ÚNICA (NO SE TOCA MÁS)
  const BUCKET = 'tarifas';
  const FILE_NAME = 'TARIFA_MASTER.xlsx';
  const STORAGE_PATH = `${BUCKET}/${FILE_NAME}`;

  const uploadAndImportExcel = async (file) => {
    setBusy(true);
    setLog('📤 Subiendo Excel a Storage...');

    try {
      /* =========================
         1️⃣ SUBIR A STORAGE
      ========================= */
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(FILE_NAME, file, {
          upsert: true,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      if (uploadError) throw uploadError;

      setLog('📦 Excel subido. Importando datos en la base de datos...');

      /* =========================
         2️⃣ LLAMAR EDGE FUNCTION
      ========================= */
      const { data, error: fnError } = await supabase.functions.invoke(
        'import_tarifa_master',
        {
          body: {
            path: STORAGE_PATH
          }
        }
      );

      if (fnError) throw fnError;

      if (!data?.ok) {
        throw new Error(data?.error || 'Error desconocido en la importación');
      }

      /* =========================
         3️⃣ OK
      ========================= */
      setLog(
        `✅ IMPORTACIÓN COMPLETA

Proveedores: ${data.result.proveedores.inserted}
Tarifas vidrios: ${data.result.tarifas_vidrios.upserted}
Operaciones: ${data.result.operaciones_vidrios.upserted}

El sistema se ha actualizado automáticamente.`
      );
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
        <p className="text-sm text-gray-500">
          Gestión de tarifas, reglas y escalado automático
        </p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'vidrios'} onClick={() => setTab('vidrios')}>
          Tarifas Vidrios
        </TabButton>
        <TabButton
          active={tab === 'operaciones'}
          onClick={() => setTab('operaciones')}
        >
          Operaciones / Reglas
        </TabButton>
        <TabButton active={tab === 'otros'} onClick={() => setTab('otros')}>
          Otros
        </TabButton>
      </div>

      {tab === 'vidrios' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border rounded-xl p-4">
            <div className="font-semibold text-slate-800">
              Subir Excel TARIFA MASTER
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Subes el Excel y el sistema:
              <ul className="list-disc ml-6 mt-1">
                <li>Lo guarda en Supabase</li>
                <li>Importa proveedores</li>
                <li>Importa tarifas de vidrios</li>
                <li>Importa operaciones</li>
                <li>Actualiza automáticamente los combos</li>
              </ul>
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAndImportExcel(f);
                }}
              />
              {busy && (
                <div className="text-xs text-gray-500 mt-2">
                  Procesando… no cierres esta pantalla
                </div>
              )}
            </div>
          </div>

          {log && (
            <pre className="text-sm p-4 rounded-lg bg-white border whitespace-pre-wrap">
              {log}
            </pre>
          )}
        </div>
      )}

      {tab === 'operaciones' && (
        <div className="bg-slate-50 border rounded-xl p-4 text-sm text-gray-700">
          Aquí más adelante podrás gestionar reglas avanzadas sin Excel.
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
