import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Summary = { inserted: number; updated: number; skipped: number; errors: string[] };

function baseSummary(): Summary {
  return { inserted: 0, updated: 0, skipped: 0, errors: [] };
}

function safePayload(overrides: Partial<any> = {}) {
  const base = {
    ok: true,
    success: true,
    message: "OK",
    proveedores: baseSummary(),
    vidrios: baseSummary(),
    operaciones: baseSummary(),
    combos: { updated: 0, errors: [] as string[] },
    warnings: [] as string[],
  };

  // Compatibilitat “per si el front llegeix result.data.proveedores”
  const data = {
    proveedores: { ...base.proveedores },
    vidrios: { ...base.vidrios },
    operaciones: { ...base.operaciones },
    combos: { ...base.combos },
    warnings: [...base.warnings],
  };

  return {
    ...base,
    data,         // <- molt important
    ...overrides,
  };
}

/**
 * IMPORTANT:
 * - Sempre retornem status 200.
 * - Si hi ha error, ok=false/success=false i el detall va a message / errors[].
 * Això evita que supabase.functions.invoke() retorni data=undefined i el front peti.
 */
function json200(payload: any) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toText(v: unknown) {
  return (v ?? "").toString().trim();
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = toText(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Llegim body amb seguretat
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // si el front no envia JSON, no petem
      body = null;
    }

    // 🔥 El teu front probablement envia { path } amb el fitxer a Storage
    const path = toText(body?.path);

    if (!path) {
      const p = safePayload({
        ok: false,
        success: false,
        message: "Falta body.path (ruta del fitxer a Storage).",
      });
      p.proveedores.errors.push("Missing body.path");
      p.data.proveedores.errors.push("Missing body.path");
      return json200(p);
    }

    // Client Supabase (service role si la tens a env; si no, anon)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const key = SERVICE_ROLE || ANON;
    if (!SUPABASE_URL || !key) {
      const p = safePayload({
        ok: false,
        success: false,
        message:
          "Falten variables d'entorn SUPABASE_URL i/o SUPABASE_SERVICE_ROLE_KEY (o ANON).",
      });
      p.proveedores.errors.push("Missing env vars");
      p.data.proveedores.errors.push("Missing env vars");
      return json200(p);
    }

    const supabase = createClient(SUPABASE_URL, key);

    // 1) descarregar fitxer de Storage (bucket 'tarifas' pel teu cas)
    // IMPORTANT: aquí assumim bucket 'tarifas' perquè el teu Network mostrava /object/tarifas/...
    const bucket = body?.bucket ? toText(body.bucket) : "tarifas";

    const { data: fileData, error: dlErr } = await supabase.storage
      .from(bucket)
      .download(path);

    if (dlErr || !fileData) {
      const p = safePayload({
        ok: false,
        success: false,
        message: `No puc descarregar el fitxer de Storage: ${dlErr?.message ?? "unknown error"}`,
      });
      p.vidrios.errors.push("Storage download failed");
      p.data.vidrios.errors.push("Storage download failed");
      return json200(p);
    }

    // 2) aquí aniria el parseig de l’Excel i UPSERT a BD
    //   -> com que ara l’objectiu és NO petar el front, retornem un “stub” d’èxit
    //   -> quan confirmem que l’Admin ja no peta, implementem l’import real.

    const payload = safePayload({
      ok: true,
      success: true,
      message: `Fitxer descarregat OK (bucket=${bucket}, path=${path}). Import encara no implementat.`,
    });

    return json200(payload);
  } catch (e: any) {
    // Catch-all: MAI retornar 500 (perquè el front peta)
    const payload = safePayload({
      ok: false,
      success: false,
      message: `Error inesperat a la funció: ${e?.message ?? String(e)}`,
    });
    payload.proveedores.errors.push("Unhandled exception");
    payload.data.proveedores.errors.push("Unhandled exception");
    return json200(payload);
  }
});
