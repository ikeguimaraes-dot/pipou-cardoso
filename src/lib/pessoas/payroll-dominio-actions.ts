"use server"
import { createServiceClient } from "@kph/db/supabase/server"
import { requireUser, isFounder } from "@kph/auth/server"
import { getCurrentUnit } from "@kph/auth/unit"

const PERIODO_TABLE = "payroll_fechamento_periodo"

export type ExportDominioResult =
  | { ok: true; txt: string; filename: string; linhas: number }
  | { ok: false; error: string }

// ── Lookup de periodo_id por competência + unit (usado pela tela de Holerites) ─
async function resolverPeriodoId(
  sb: any,
  competencia: string
): Promise<{ periodoId: string; status: string } | { error: string }> {
  const unit = await getCurrentUnit()
  if (!unit) return { error: "Selecione uma unidade autorizada." }
  const { data, error } = await sb
    .from(PERIODO_TABLE)
    .select("id, status")
    .eq("competencia", competencia)
    .eq("unit_id", unit.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    return { error: `Erro ao localizar período "${competencia}": ${error.message}` }
  }
  if (!data) {
    return {
      error: `Competência "${competencia}" sem período registrado para esta unidade — rode a coleta primeiro.`,
    }
  }
  return { periodoId: data.id as string, status: data.status as string }
}

// ── PROPOSTA de Guard de status — aguardando decisão ─────────────────────────
// Status sugeridos: 'aberto' | 'fechado' | 'exportado'
//
// Regra proposta: só exportar se status = 'fechado'.
//   'aberto'    → coleta em andamento (dados podem mudar) → BLOQUEAR
//   'fechado'   → coleta encerrada e conferida           → PERMITIR
//   'exportado' → já enviado ao Domínio                  → PERMITIR re-exportação (correção)
//
// Para ativar, descomentar dentro de exportTxtDominio após resolverPeriodoId:
//
//   if (status === 'aberto') {
//     return {
//       ok: false,
//       error: `Período "${competencia}" ainda está aberto (coleta em andamento). ` +
//              `Feche o período antes de exportar.`,
//     }
//   }
//
// Nota: quando periodoId é passado diretamente (ContabilidadeClient), adicionar
// uma query separada para buscar o status antes do bloco acima.
// ─────────────────────────────────────────────────────────────────────────────

export async function exportTxtDominio(
  periodoId: string | null,
  competencia: string
): Promise<ExportDominioResult> {
  const user = await requireUser()
  if (!isFounder(user)) {
    return { ok: false, error: "Apenas fundadores podem exportar folha Domínio." }
  }

  const sb = createServiceClient()
  if (!sb) return { ok: false, error: "Banco não configurado." }

  // ── Resolver periodo_id se não foi passado (caso holerites: mes/ano) ────────
  let resolvedPeriodoId = periodoId
  if (!resolvedPeriodoId) {
    const r = await resolverPeriodoId(sb, competencia)
    if ("error" in r) return { ok: false, error: r.error }
    resolvedPeriodoId = r.periodoId
  }

  const { data: period, error: periodError } = await (sb as any)
    .from(PERIODO_TABLE).select("unit_id, cod_empresa, competencia")
    .eq("id", resolvedPeriodoId).single()
  if (periodError || !period?.unit_id || !period?.cod_empresa || period.competencia !== competencia) {
    return { ok: false, error: "Confira a unidade, a competência e o código da empresa no fechamento." }
  }
  const COD_EMPRESA = period.cod_empresa as string
  const UNIT_ID = period.unit_id as string

  // ── Guard 0: período sem lançamentos coletados ────────────────────────────
  const { data: lancamentos, error: errLanc } = await (sb as any)
    .from("payroll_fechamento_linha")
    .select("employee_id, origem_lancamento, valor")
    .eq("periodo_id", resolvedPeriodoId)

  if (errLanc) {
    return { ok: false, error: `Erro ao verificar lançamentos: ${errLanc.message}` }
  }

  if (!lancamentos || (lancamentos as any[]).length === 0) {
    return {
      ok: false,
      error: `Competência "${competencia}" sem lançamentos — rode a coleta primeiro.`,
    }
  }

  // IDs únicos com lançamento neste período
  const idsNoPeriodo: string[] = [
    ...new Set((lancamentos as any[]).map((l: any) => l.employee_id as string)),
  ]

  // Nomes para mensagens de erro (service role — ignora RLS)
  const { data: empRows } = await (sb as any)
    .from("employees")
    .select("id, nome, sobrenome")
    .in("id", idsNoPeriodo)

  const nomeMap = new Map<string, string>(
    (empRows ?? []).map((e: any) => [
      e.id as string,
      `${e.nome ?? ""} ${e.sobrenome ?? ""}`.trim(),
    ])
  )

  // ── Guard A: colaboradores no período sem matrícula Domínio ──────────────
  const { data: comCadastro, error: errCad } = await (sb as any)
    .from("payroll_dominio_cadastro")
    .select("employee_id")
    .eq("cod_empresa", COD_EMPRESA)
    .in("employee_id", idsNoPeriodo)

  if (errCad) {
    return { ok: false, error: `Erro ao verificar cadastro Domínio: ${errCad.message}` }
  }

  const idsComCadastro = new Set(
    (comCadastro ?? []).map((r: any) => r.employee_id as string)
  )
  const semCadastro = idsNoPeriodo.filter((id) => !idsComCadastro.has(id))

  if (semCadastro.length > 0) {
    const nomes = semCadastro
      .slice(0, 5)
      .map((id) => nomeMap.get(id) ?? id)
      .join(", ")
    const mais = semCadastro.length > 5 ? ` e mais ${semCadastro.length - 5}` : ""
    return {
      ok: false,
      error: `${semCadastro.length} colaborador(es) em "${competencia}" sem matrícula Domínio: ${nomes}${mais}. Complete o cadastro antes de exportar.`,
    }
  }

  // ── Guard B: lançamentos MANUAL com valor nulo ───────────────────────────
  const manualNulos = (lancamentos as any[]).filter(
    (l: any) => l.origem_lancamento === "MANUAL" && l.valor == null
  )

  if (manualNulos.length > 0) {
    const idsManualNulo = [
      ...new Set(manualNulos.map((l: any) => l.employee_id as string)),
    ]
    const nomes = idsManualNulo
      .slice(0, 5)
      .map((id) => nomeMap.get(id) ?? id)
      .join(", ")
    const mais = idsManualNulo.length > 5 ? ` e mais ${idsManualNulo.length - 5}` : ""
    return {
      ok: false,
      error: `${manualNulos.length} lançamento(s) MANUAL com valor vazio em "${competencia}": ${nomes}${mais}. Preencha antes de exportar.`,
    }
  }

  // ── Gerar TXT via RPC ─────────────────────────────────────────────────────
  const { data: txt, error: errRpc } = await (sb as any).rpc(
    "rpc_payroll_gerar_txt_dominio",
    { p_competencia: competencia, p_cod_empresa: COD_EMPRESA, p_unit_id: UNIT_ID }
  )

  if (errRpc) {
    return { ok: false, error: `Erro ao gerar TXT: ${errRpc.message}` }
  }

  const txtStr = typeof txt === "string" ? txt : ""

  if (!txtStr) {
    return {
      ok: false,
      error: `Nenhum lançamento encontrado para "${competencia}". Verifique se a competência foi fechada.`,
    }
  }

  const totalLinhas = txtStr.split("\n").filter(Boolean).length
  const filename = `FOLHA_${COD_EMPRESA}_${competencia.replace("/", "_")}.txt`

  return { ok: true, txt: txtStr, filename, linhas: totalLinhas }
}
