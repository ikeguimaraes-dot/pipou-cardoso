import { NextRequest, NextResponse } from "next/server";
import { gzipSync } from "node:zlib";
import { pendenciasContext, PendenciasAccessError } from "@/lib/pessoas/pendencias-server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const fail = (text: string, status: number) => new NextResponse(text, { status, headers });

export async function GET(req: NextRequest) {
  try {
    const { client, units } = await pendenciasContext({ includeInactiveUnits: true });
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return fail("Arquivo inválido.", 400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = client as any;
    const { data, error } = await db.from("ponto_ahgora_arquivos")
      .select("unit_id,arquivo,linhas,resultado").eq("id", id).maybeSingle();
    if (error) return fail("Arquivo indisponível.", 503);
    if (!data) return fail("Arquivo não encontrado.", 404);
    if (!data.unit_id || !units.some(unit => unit.id === data.unit_id)) return fail("Sem permissão para esta unidade.", 403);
    if (data.resultado?.status !== "arquivado" || !Array.isArray(data.linhas)) return fail("Arquivo ainda em processamento.", 409);
    // JSON preserves all original fields and punch classifications without
    // introducing spreadsheet formulas or pretending these are approved punches.
    const filename = String(data.arquivo).replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_") + ".json";
    const body = new Uint8Array(gzipSync(JSON.stringify(data.linhas)));
    return new NextResponse(body, { headers: {
      ...headers, "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "gzip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    } });
  } catch (error) {
    return fail("Não foi possível conferir o acesso.", error instanceof PendenciasAccessError ? error.status : 503);
  }
}
