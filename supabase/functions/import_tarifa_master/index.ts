import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

type Json = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const norm = (v: unknown) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normUpper = (v: unknown) => norm(v).toUpperCase();

const toBoolActivo = (v: unknown) => {
  const s = normUpper(v);
  if (["SI", "S", "TRUE", "1"].includes(s)) return true;
  if (["NO", "N", "FALSE", "0"].includes(s)) return false;
  return false;
};

const toNumber = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = norm(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): Json[] {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" }) as Json[];
}

function findSheet(workbook: XLSX.WorkBook, candidates: string[]) {
  const names = workbook.SheetNames.map((n) => n.trim());
  for (const c of candidates) {
    const hit = names.find((n) => n.toLowerCase() === c.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

async function downloadXlsxFromStorage(path: string): Promise<Uint8Array> {
  const [bucket, ...rest] = path.split("/");
  const key = rest.join("/");
  if (!bucket || !key) throw new Error(`Path inválido: ${path}`);

  const { data, error } = await sb.storage.from(bucket).download(key);
  if (error) throw new Error(`No puedo descargar el archivo: ${error.message}`);
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

async function upsertProveedores(rows: Json[]) {
  const payload = rows
    .map((r) => {
      const id = toNumber((r as any).ID ?? (r as any).id ?? (r as any).Id);
      const nombre = norm((r as any).NOMBRE ?? (r as any).PROVEEDOR ?? (r as any).Proveedor ?? (r as any).proveedor);
      const activo = toBoolActivo((r as any).ACTIVO ?? (r as any).activo);
      if (!nombre) return null;
      return {
        ...(id ? { id } : {}),
        nombre,
        activo,
      };
    })
    .filter(Boolean) as { id?: number; nombre: string; activo: boolean }[];

  if (payload.length === 0) return { inserted: 0 };

  const { error } = await sb.from("proveedores").upsert(payload, {
    onConflict: payload.some((p) => p.id) ? "id" : "nombre",
  });
  if (error) throw new Error(`Error upsert proveedores: ${error.message}`);

  return { inserted: payload.length };
}

async function getProveedorIdByNombre(nombre: string): Promise<number | null> {
  const { data, error } = await sb
    .from("proveedores")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();
  if (error) throw new Error(`Error buscando proveedor '${nombre}': ${error.message}`);
  return data?.id ?? null;
}

async function upsertTarifasVidrios(rows: Json[]) {
  const payload = [];
  for (const r of rows) {
    const id_rf = norm((r as any).ID_RF ?? (r as any).id_rf);
    const proveedor_txt = norm((r as any).PROVEEDOR ?? (r as any).proveedor);
    const tipo = norm((r as any).TIPO ?? (r as any).tipo);
    const categoria = normUpper((r as any).CATEGORIA ?? (r as any).categoria);
    const espesor_mm = norm((r as any).ESPESOR_MM ?? (r as any).espesor_mm);
    const pvb = norm((r as any).PVB ?? (r as any).pvb);
    const acabado = norm((r as any).ACABADO ?? (r as any).acabado);
    const precio_m2 = toNumber((r as any).PRECIO_M2 ?? (r as any).precio_m2);
    const activo = toBoolActivo((r as any).ACTIVO ?? (r as any).activo);
    const observaciones = norm((r as any).OBSERVACIONES ?? (r as any).observaciones);

    if (!proveedor_txt || !tipo || !categoria || !espesor_mm || !acabado) continue;

    let id_proveedor = toNumber((r as any).ID_PROVEEDOR ?? (r as any).id_proveedor);
    if (!id_proveedor) {
      id_proveedor = await getProveedorIdByNombre(proveedor_txt);
    }

    if (!id_proveedor) {
      const { data: ins, error: insErr } = await sb
        .from("proveedores")
        .insert([{ nombre: proveedor_txt, activo: false }])
        .select("id")
        .single();
      if (insErr) throw new Error(`No puedo crear proveedor '${proveedor_txt}': ${insErr.message}`);
      id_proveedor = ins.id;
    }

    payload.push({
      id_rf: id_rf || crypto.randomUUID(),
      id_proveedor,
      proveedor: proveedor_txt,
      categoria,
      tipo,
      espesor_mm,
      pvb: pvb || null,
      acabado,
      precio_m2: precio_m2 ?? 0,
      activo,
      observaciones: observaciones || null,
    });
  }

  if (payload.length === 0) return { upserted: 0 };

  const { error } = await sb.from("tarifas_vidrios").upsert(payload, {
    onConflict: "id_proveedor,tipo,espesor_mm,acabado",
  });
  if (error) throw new Error(`Error upsert tarifas_vidrios: ${error.message}`);

  return { upserted: payload.length };
}

async function upsertOperacionesVidrios(rows: Json[]) {
  const payload = rows
    .map((r) => {
      const id_rf = norm((r as any).ID_RF ?? (r as any).id_rf);
      const proveedor = norm((r as any).PROVEEDOR ?? (r as any).proveedor);
      const descripcion = norm((r as any).DESCRIPCION ?? (r as any).descripcion);
      const unidad = norm((r as any).UNIDAD ?? (r as any).unidad);
      const precio = toNumber((r as any).PRECIO ?? (r as any).precio) ?? 0;
      const tipo_calculo = normUpper((r as any).TIPO_CALCULO ?? (r as any).tipo_calculo);
      const aplica_a = normUpper((r as any).APLICA_A ?? (r as any).aplica_a);
      const activo = toBoolActivo((r as any).ACTIVO ?? (r as any).activo);

      if (!id_rf || !proveedor || !descripcion) return null;

      return { id_rf, proveedor, descripcion, unidad, precio, tipo_calculo, aplica_a, activo };
    })
    .filter(Boolean) as any[];

  if (payload.length === 0) return { upserted: 0 };

  const { error } = await sb.from("operaciones_vidrios").upsert(payload, { onConflict: "id_rf" });
  if (error) throw new Error(`Error upsert operaciones_vidrios: ${error.message}`);

  return { upserted: payload.length };
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body?.path as string | undefined;
    if (!path) {
      return new Response(JSON.stringify({ error: "Falta body.path" }), { status: 400 });
    }

    const file = await downloadXlsxFromStorage(path);
    const wb = XLSX.read(file, { type: "array" });

    const sheetProveedores = findSheet(wb, ["PROVEEDORES", "Proveedores"]);
    const sheetTarifas = findSheet(wb, ["VIDRIOS_TODOS", "Vidrios_todos", "VIDRIOS", "Vidrios"]);
    const sheetOps = findSheet(wb, ["OPERACIONES_VIDRIOS", "Operaciones_vidrios", "OPERACIONES", "Operaciones"]);

    if (!sheetProveedores || !sheetTarifas || !sheetOps) {
      return new Response(
        JSON.stringify({
          error: "No encuentro pestañas esperadas",
          found: wb.SheetNames,
          expected: {
            proveedores: ["PROVEEDORES"],
            tarifas: ["VIDRIOS_TODOS"],
            operaciones: ["OPERACIONES_VIDRIOS"],
          },
        }),
        { status: 400 },
      );
    }

    const proveedoresRows = sheetToRows(wb, sheetProveedores);
    const tarifasRows = sheetToRows(wb, sheetTarifas);
    const opsRows = sheetToRows(wb, sheetOps);

    const r1 = await upsertProveedores(proveedoresRows);
    const r2 = await upsertTarifasVidrios(tarifasRows);
    const r3 = await upsertOperacionesVidrios(opsRows);

    return new Response(
      JSON.stringify({
        ok: true,
        sheets: { sheetProveedores, sheetTarifas, sheetOps },
        result: { proveedores: r1, tarifas_vidrios: r2, operaciones_vidrios: r3 },
      }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as any)?.message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
