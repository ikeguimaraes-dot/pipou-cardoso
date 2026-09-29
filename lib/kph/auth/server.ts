import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import type { RoleName } from "@kph/db/types/database";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  roles: Array<{
    role: RoleName;
    unitId: string | null;
    brandId: string | null;
    groupId: string | null;
  }>;
};

/**
 * DAL — verifica sessão e carrega roles. `cache` memoiza durante uma render pass.
 * Server-only. Retorna null se sem sessão ou sem Supabase.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    if (!supabase) {
      console.warn("[getCurrentUser] supabase indisponível");
      return null;
    }

    // Validate identity independently of the middleware.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.warn("[getCurrentUser] auth.getUser error:", authError.message);
      return null;
    }
    if (!user) return null;

    // Pega roles do user. RLS permite SELECT do próprio user_roles.
    // Embedded select (roles!inner) não é tipado pelo nosso Database — cast explícito.
    type RoleJoinRow = {
      unit_id: string | null;
      brand_id: string | null;
      group_id: string | null;
      roles: { name: RoleName } | { name: RoleName }[] | null;
    };
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("unit_id, brand_id, group_id, roles!inner(name)")
      .eq("user_id", user.id)
      .returns<RoleJoinRow[]>();

    if (rolesError) {
      console.error("[getCurrentUser] roles query error:", rolesError.message);
      // Continua com roles vazias — não bloqueia o user.
    }

    const roles = (rolesData ?? []).map((r) => {
      const roleObj = Array.isArray(r.roles) ? r.roles[0] : r.roles;
      return {
        role: (roleObj?.name ?? "colaborador") as RoleName,
        unitId: r.unit_id,
        brandId: r.brand_id,
        groupId: r.group_id,
      };
    });

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const displayName = [metadata.display_name, metadata.full_name, metadata.name]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0)
      ?.trim() ?? null;

    return {
      id: user.id,
      email: user.email ?? null,
      displayName,
      roles,
    };
  } catch (e) {
    // Next.js usa exceptions especiais (NEXT_REDIRECT, NEXT_DYNAMIC_USAGE) pra
    // controle de fluxo. NUNCA engolir — deixa Next tratar.
    if (isNextInternal(e)) throw e;
    console.error("[getCurrentUser] exceção:", e);
    return null;
  }
});

function isNextInternal(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const digest = (e as { digest?: unknown }).digest;
  if (typeof digest === "string") {
    return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("DYNAMIC_SERVER_USAGE");
  }
  const message = (e as { message?: unknown }).message;
  return typeof message === "string" && message.includes("Dynamic server usage");
}

/**
 * Retorna o usuário autenticado da sessão real quando disponível.
 * Exige sessão real e centraliza o login no shell.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect("/auth/login");
}

/** Falha se o user não tiver pelo menos uma das roles especificadas. */
export async function requireRole(allowed: ReadonlyArray<RoleName>): Promise<CurrentUser> {
  const user = await requireUser();
  const has = user.roles.some((r) => allowed.includes(r.role));
  if (!has) redirect("/");
  return user;
}

/**
 * Guard para API Route Handlers (route.ts).
 * Usa getCurrentUser() diretamente — NÃO passa pelo bypass de auth.
 * Retorna {ok:false, status:401} sem sessão, {ok:false, status:403} sem role.
 * O handler deve verificar ok e retornar NextResponse antes de qualquer efeito.
 */
export async function requireRoleApi(
  allowed: ReadonlyArray<RoleName>,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; status: 401 | 403 }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401 };
  const has = user.roles.some((r) => allowed.includes(r.role));
  if (!has) return { ok: false, status: 403 };
  return { ok: true, user };
}

/** Conveniência: o user é founder? */
export function isFounder(user: CurrentUser | null): boolean {
  return !!user?.roles.some((r) => r.role === "founder");
}

/**
 * Tier do user para lógica de UI (não substitui RLS — apenas decide qual view renderizar).
 * T4 = founder/cfo + T6 (diretor/ceo) + T5 (heads) — espelha normalização do get_my_tier() SQL
 * T3 = pessoas/gm/chef/operacional | T1 = colaborador (default)
 */
export type UserTier = "T1" | "T3" | "T4";

// T6 (diretoria/holding) e T5 (gerentes de área) normalizam para T4 — igual ao get_my_tier() SQL.
const T4_ROLES: ReadonlyArray<RoleName> = [
  "founder", "cfo",
  // T6
  "ceo", "diretor",
  // T5
  "head_rh", "pipou_admin", "head_financeiro", "head_operacao",
];
const T3_ROLES: ReadonlyArray<RoleName> = ["pessoas", "gm", "chef", "operacional", "comprador", "comercial"];

export function getUserTier(user: CurrentUser | null): UserTier {
  if (!user) return "T1";
  const roleNames = user.roles.map((r) => r.role);
  if (roleNames.some((r) => T4_ROLES.includes(r))) return "T4";
  if (roleNames.some((r) => T3_ROLES.includes(r))) return "T3";
  return "T1";
}

/**
 * Tier numérico 1–6 para filtro de UI (sidebar, dashboards).
 * NÃO substitui RLS — rotas continuam protegidas server-side.
 * founder/cfo/ceo/diretor → 6 | heads → 5 | gestão de unidade → 3 | demais → 1.
 * (T2 ainda não tem roles próprios; itens minTier 2 ficam visíveis a partir do T3.)
 */
export function getUserTierLevel(user: CurrentUser | null): number {
  if (!user) return 1;
  const roleNames = user.roles.map((r) => r.role);
  if (roleNames.some((r) => ["founder", "cfo", "ceo", "diretor"].includes(r))) return 6;
  if (roleNames.some((r) => ["head_rh", "pipou_admin", "head_financeiro", "head_operacao"].includes(r))) return 5;
  if (roleNames.some((r) => T3_ROLES.includes(r))) return 3;
  return 1;
}
