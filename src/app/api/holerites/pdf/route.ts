import { NextRequest, NextResponse } from "next/server";
import { pendenciasContext, PendenciasAccessError } from "@/lib/pessoas/pendencias-server";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };
const fail = (message: string, status: number) => new NextResponse(message, { status, headers: privateHeaders });

/** Verify identity and the role's own unit/brand/group scope before redirecting.
 * Legacy permanent URLs still need a separate storage migration.
 */
export async function GET(req: NextRequest) {
  try {
    const { client, units } = await pendenciasContext({ includeInactiveUnits: true });
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return fail("Informe um identificador de holerite válido.", 400);
    // Keep RLS. Never elevate this read to service role.
    const { data, error } = await client.from("payslips")
      .select("pdf_url, employee_id, unit_id").eq("id", id).maybeSingle();
    if (error) return fail("Não foi possível consultar o holerite.", 503);
    if (!data) return fail("Holerite não encontrado.", 404);
    // Prefer the historical payslip unit: transfers/dual employment must not
    // move a document to the employee's current unit.
    let unitId = data.unit_id;
    if (!unitId) {
      const employee = await client.from("employees").select("unit_id").eq("id", data.employee_id).maybeSingle();
      if (employee.error) return fail("Não foi possível conferir o vínculo do holerite.", 503);
      unitId = employee.data?.unit_id ?? null;
    }
    if (!unitId || !units.some(unit => unit.id === unitId)) return fail("Sem permissão para este holerite.", 403);
    if (!data.pdf_url) return fail("PDF ainda não disponível para este holerite.", 404);
    let target: URL;
    try { target = new URL(data.pdf_url); } catch { return fail("Endereço do PDF inválido.", 422); }
    if (target.protocol !== "https:" || target.username || target.password) return fail("Endereço do PDF inválido.", 422);
    return NextResponse.redirect(target, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof PendenciasAccessError) return fail("Sem permissão.", error.status);
    return fail("Não foi possível conferir o acesso. Tente novamente.", 503);
  }
}
