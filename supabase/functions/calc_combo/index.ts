import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json200(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toText(v: unknown) {
  return (v ?? "").toString().trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const id_rf = toText(body?.id_rf);

    if (!id_rf) {
      return json200({ ok: false, message: "Missing body.id_rf" });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const key = SERVICE_ROLE || ANON;

    if (!SUPABASE_URL || !key) {
      return json200({ ok: false, message: "Missing env vars" });
    }

    const supabase = createClient(SUPABASE_URL, key);

    // 1) Vidre
    const { data: vidrio, error: vErr } = await supabase
      .from("tarifas_vidrios")
      .select("*")
      .eq("id_rf", id_rf)
      .maybeSingle();

    if (vErr) throw vErr;
    if (!vidrio) return json200({ ok: false, message: `Vidrio not found: ${id_rf}` });

    // Camps clau (tots poden ser null)
    const categoria = vidrio.categoria ?? null;
    const tipo = vidrio.tipo ?? null;
    const espesor = vidrio.espesor_mm ?? null;
    const acabado = vidrio.acabado ?? null;
    const pvb = vidrio.pvb ?? null;

    // 2) Regles aplicables (match per comodins)
    const { data: reglas, error: rErr } = await supabase
      .from("reglas_operaciones")
      .select("ot, qty, categoria, tipo, espesor_min, espesor_max, acabado, pvb")
      .eq("activo", true);

    if (rErr) throw rErr;

    const aplicables = (reglas ?? []).filter((r: any) => {
      const okCat = !r.categoria || r.categoria === categoria;
      const okTipo = !r.tipo || r.tipo === tipo;
      const okAcab = !r.acabado || r.acabado === acabado;
      const okPvb = !r.pvb || r.pvb === pvb;

      const okEspMin = r.espesor_min == null || (espesor != null && Number(espesor) >= Number(r.espesor_min));
      const okEspMax = r.espesor_max == null || (espesor != null && Number(espesor) <= Number(r.espesor_max));

      return okCat && okTipo && okAcab && okPvb && okEspMin && okEspMax;
    });

    // 3) Carregar preus operacions (per ot)
    const ots = Array.from(new Set(aplicables.map((r: any) => r.ot))).filter(Boolean);

    let ops: any[] = [];
    if (ots.length) {
      const { data: opRows, error: oErr } = await supabase
        .from("operaciones_vidrios")
        .select("ot, descripcion, unidad, precio, id_proveedor")
        .in("ot", ots);

      if (oErr) throw oErr;
      ops = opRows ?? [];
    }

    const opByOt = new Map<string, any>();
    for (const o of ops) opByOt.set(o.ot, o);

    // 4) Construir combo
    const base = Number(vidrio.precio_m2 ?? 0);

    const items = aplicables.map((r: any) => {
      const op = opByOt.get(r.ot);
      const precio = Number(op?.precio ?? 0);
      const qty = Number(r.qty ?? 1);

      return {
        ot: r.ot,
        descripcion: op?.descripcion ?? `OT ${r.ot}`,
        unidad: op?.unidad ?? "ud",
        precio_unitario: precio,
        qty,
        subtotal: precio * qty,
      };
    });

    const totalOps = items.reduce((acc: number, it: any) => acc + Number(it.subtotal ?? 0), 0);
    const total = base + totalOps;

    return json200({
      ok: true,
      id_rf,
      vidrio,
      base_precio_m2: base,
      operaciones: items,
      total,
    });
  } catch (e: any) {
    return json200({ ok: false, message: e?.message ?? String(e) });
  }
});
