"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, createSupabaseServerClient } from "@kph/db/supabase/server";
import { requireUser } from "@kph/auth/server";
import { isBypassUser } from "@kph/auth/bypass";
import type { ActionResult } from "@/lib/result";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AccessRequest = {
  id: string;
  employee_id: string;
  email: string;
  cpf: string;
  status: "pending" | "approved" | "rejected";
  approver_tier: "T2A" | "T3" | "T4";
  approver_id: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
};

export type AccessRequestWithEmployee = AccessRequest & {
  employee: {
    id: string;
    nome: string;
    sobrenome: string;
    funcao: string;
    unit_id: string;
    tier: string | null;
    unit_name: string | null;
  };
};

type EmployeeRow = {
  id: string;
  nome: string;
  sobrenome: string;
  user_id: string | null;
  tier: string | null;
  email: string | null;
  cpf: string | null;
  funcao: string;
  unit_id: string;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function approverTierFor(employeeTier: string): "T2A" | "T3" | "T4" {
  if (employeeTier === "T1") return "T2A";
  if (employeeTier === "T2A" || employeeTier === "T2B") return "T3";
  return "T4";
}

// ─────────────────────────────────────────────────────────────
// 1. submitAccessRequest — pública (sem auth obrigatório)
// ─────────────────────────────────────────────────────────────

export async function submitAccessRequest(input: {
  email: string;
  cpf: string;
}): Promise<ActionResult<{ message: string }>> {
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Serviço temporariamente indisponível." };

  const email = input.email.trim().toLowerCase();
  const cpf = normalizeCpf(input.cpf);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "E-mail inválido." };
  }
  if (cpf.length !== 11) {
    return { ok: false, error: "CPF inválido." };
  }

  // Busca employee por CPF
  const { data: rawEmployee, error: empError } = await sb
    .from("employees")
    .select("id, nome, sobrenome, user_id, tier, email, cpf, funcao, unit_id")
    .eq("cpf", cpf)
    .eq("ativo", true)
    .maybeSingle<EmployeeRow>();

  if (empError) {
    console.error("[submitAccessRequest] employees query:", empError.message);
    return { ok: false, error: "Erro ao consultar cadastro. Tente novamente." };
  }

  const employee = rawEmployee as EmployeeRow | null;

  if (!employee) {
    return { ok: false, error: "Dados não encontrados. Procure o RH." };
  }
  if (employee.user_id) {
    return { ok: false, error: "Acesso já existe para este CPF." };
  }

  // Verifica solicitação pendente em aberto
  const { data: existingRaw } = await sb
    .from("access_requests")
    .select("id, status")
    .eq("employee_id", employee.id)
    .eq("status", "pending")
    .maybeSingle<Pick<AccessRequest, "id" | "status">>();

  const existing = existingRaw as Pick<AccessRequest, "id" | "status"> | null;

  if (existing) {
    return {
      ok: false,
      error: "Já existe uma solicitação em análise para este colaborador.",
    };
  }

  const approver_tier = approverTierFor(employee.tier ?? "T1");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (sb.from("access_requests") as any).insert({
    employee_id: employee.id,
    email,
    cpf,
    status: "pending",
    approver_tier,
  });

  if (insertError) {
    console.error("[submitAccessRequest] insert:", insertError.message);
    return { ok: false, error: "Não foi possível enviar a solicitação." };
  }

  return {
    ok: true,
    data: { message: "Solicitação enviada. Aguarde aprovação do seu responsável." },
  };
}

// ─────────────────────────────────────────────────────────────
// 2. approveAccessRequest — aprovador confirma
// ─────────────────────────────────────────────────────────────

export async function approveAccessRequest(
  requestId: string
): Promise<ActionResult<{ message: string }>> {
  const user = await requireUser();
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Serviço indisponível." };

  const { data: rawReq, error: reqError } = await sb
    .from("access_requests")
    .select("id, employee_id, email, status, approver_tier")
    .eq("id", requestId)
    .maybeSingle<Pick<AccessRequest, "id" | "employee_id" | "email" | "status" | "approver_tier">>();

  if (reqError || !rawReq) {
    return { ok: false, error: "Solicitação não encontrada." };
  }
  const req = rawReq as Pick<AccessRequest, "id" | "employee_id" | "email" | "status" | "approver_tier">;

  if (req.status !== "pending") {
    return { ok: false, error: "Solicitação já foi processada." };
  }

  // Verifica tier do aprovador (bypass user = founder → permite tudo)
  const isBypass = isBypassUser(user.id);
  if (!isBypass) {
    const { data: rawApprover } = await sb
      .from("employees")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle<{ tier: string | null }>();

    const approverTier = (rawApprover as { tier: string | null } | null)?.tier ?? null;
    const allowed =
      (req.approver_tier === "T2A" && approverTier === "T2A") ||
      (req.approver_tier === "T3" && approverTier === "T3") ||
      approverTier === "T4";

    if (!allowed) {
      return { ok: false, error: "Sem permissão para aprovar esta solicitação." };
    }
  }

  // Cria usuário no Supabase Auth (admin)
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email: req.email,
    password: Math.random().toString(36).slice(2) + "KPH!",
    email_confirm: true,
  });

  if (authError) {
    console.error("[approveAccessRequest] createUser:", authError.message);
    return { ok: false, error: `Erro ao criar conta: ${authError.message}` };
  }

  const newUserId = authData.user.id;

  // Vincula employee ao novo auth user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: empUpdateError } = await (sb.from("employees") as any)
    .update({ user_id: newUserId })
    .eq("id", req.employee_id);

  if (empUpdateError) {
    console.error("[approveAccessRequest] employee update:", empUpdateError.message);
    await sb.auth.admin.deleteUser(newUserId);
    return { ok: false, error: "Erro ao vincular acesso ao colaborador." };
  }

  // Busca employee_id do aprovador
  let approverEmployeeId: string | null = null;
  if (!isBypass) {
    const { data: rawEmp } = await sb
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    approverEmployeeId = (rawEmp as { id: string } | null)?.id ?? null;
  }

  // Marca request como aprovada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from("access_requests") as any)
    .update({
      status: "approved",
      approver_id: approverEmployeeId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // Envia link de reset para o colaborador definir senha
  await sb.auth.admin.generateLink({ type: "recovery", email: req.email });

  revalidatePath("/pessoas/aprovacoes");
  revalidatePath("/pessoas", "layout");
  return {
    ok: true,
    data: { message: "Acesso aprovado. O colaborador receberá um e-mail para definir a senha." },
  };
}

// ─────────────────────────────────────────────────────────────
// 3. rejectAccessRequest — aprovador rejeita
// ─────────────────────────────────────────────────────────────

export async function rejectAccessRequest(
  requestId: string,
  reason: string
): Promise<ActionResult<{ message: string }>> {
  const user = await requireUser();
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Serviço indisponível." };

  if (!reason.trim()) {
    return { ok: false, error: "Informe o motivo da rejeição." };
  }

  const { data: rawReq } = await sb
    .from("access_requests")
    .select("id, status, approver_tier")
    .eq("id", requestId)
    .maybeSingle<Pick<AccessRequest, "id" | "status" | "approver_tier">>();

  const req = rawReq as Pick<AccessRequest, "id" | "status" | "approver_tier"> | null;

  if (!req) return { ok: false, error: "Solicitação não encontrada." };
  if (req.status !== "pending") return { ok: false, error: "Solicitação já processada." };

  const isBypass = isBypassUser(user.id);
  if (!isBypass) {
    const { data: rawApprover } = await sb
      .from("employees")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle<{ tier: string | null }>();

    const approverTier = (rawApprover as { tier: string | null } | null)?.tier ?? null;
    const allowed =
      (req.approver_tier === "T2A" && approverTier === "T2A") ||
      (req.approver_tier === "T3" && approverTier === "T3") ||
      approverTier === "T4";

    if (!allowed) {
      return { ok: false, error: "Sem permissão para rejeitar esta solicitação." };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("access_requests") as any)
    .update({
      status: "rejected",
      rejected_reason: reason.trim(),
    })
    .eq("id", requestId);

  if (error) {
    console.error("[rejectAccessRequest]", error.message);
    return { ok: false, error: "Erro ao rejeitar solicitação." };
  }

  revalidatePath("/pessoas/aprovacoes");
  revalidatePath("/pessoas", "layout");
  return { ok: true, data: { message: "Solicitação rejeitada." } };
}

// ─────────────────────────────────────────────────────────────
// 4. getAccessRequests — painel do aprovador
// ─────────────────────────────────────────────────────────────

export async function getAccessRequests(
  status: "pending" | "approved" | "rejected" = "pending"
): Promise<AccessRequestWithEmployee[]> {
  await requireUser();
  const sb = createServiceClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("access_requests")
    .select("id, employee_id, email, cpf, status, approver_tier, approver_id, approved_at, rejected_reason, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .returns<AccessRequest[]>();

  if (error) {
    console.error("[getAccessRequests]", error.message);
    return [];
  }

  const rows = data as AccessRequest[];

  // Join employees + units separately (evita complexidade no select string)
  const employeeIds = [...new Set(rows.map((r) => r.employee_id))];
  if (employeeIds.length === 0) return [];

  const { data: empsRaw } = await sb
    .from("employees")
    .select("id, nome, sobrenome, funcao, unit_id, tier")
    .in("id", employeeIds)
    .returns<EmployeeRow[]>();

  const emps = (empsRaw ?? []) as EmployeeRow[];

  // Busca unit names
  const unitIds = [...new Set(emps.map((e) => e.unit_id).filter(Boolean))];
  const unitMap: Record<string, string> = {};
  if (unitIds.length > 0) {
    const { data: unitsRaw } = await sb
      .from("units")
      .select("id, name")
      .in("id", unitIds)
      .returns<{ id: string; name: string }[]>();

    for (const u of unitsRaw ?? []) {
      unitMap[u.id] = u.name;
    }
  }

  const empMap = new Map(emps.map((e) => [e.id, e]));

  return rows.map((row) => {
    const emp = empMap.get(row.employee_id);
    return {
      ...row,
      employee: {
        id: emp?.id ?? row.employee_id,
        nome: emp?.nome ?? "—",
        sobrenome: emp?.sobrenome ?? "",
        funcao: emp?.funcao ?? "—",
        unit_id: emp?.unit_id ?? "",
        tier: emp?.tier ?? null,
        unit_name: emp?.unit_id ? unitMap[emp.unit_id] ?? null : null,
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Badge do sidebar — count de aprovações pendentes
// ─────────────────────────────────────────────────────────────

/**
 * Count de access_requests pendentes visíveis ao usuário logado.
 * Usa cliente RLS de propósito (NÃO service client): o badge deve refletir
 * exatamente o que o usuário pode ver/aprovar. T1 → RLS retorna 0.
 */
export async function countPendingApprovals(): Promise<number> {
  try {
    const sb = await createSupabaseServerClient();
    if (!sb) return 0;
    const { count, error } = await sb
      .from("access_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
