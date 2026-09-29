/**
 * BYPASS DE AUTENTICAÇÃO — APENAS DESENVOLVIMENTO
 *
 * UUID fixo seedado em 039_seed_bypass_user.sql.
 * Satisfaz FK auth.users(id) e permite testar o app sem login.
 *
 * COMO REMOVER quando auth for habilitado:
 * 1. Deletar este arquivo
 * 2. Em lib/kph/auth/server.ts → requireUser(): remover o bloco "if (user) return user; return {...}"
 *    e substituir por redirect("/login")
 * 3. Em src/lib/pessoas/access-requests.ts: remover as 2 ocorrências de isBypass
 *    (linhas ~172 e ~275) — RLS e o check de tier normal bastam.
 * 4. Deletar ou desabilitar a migration 039_seed_bypass_user.sql no ambiente de produção.
 *
 * OCORRÊNCIAS ATUAIS (buscar por BYPASS_UUID):
 * - lib/kph/auth/server.ts            → requireUser() retorna usuário sintético
 * - src/lib/pessoas/access-requests.ts → skip de validação de tier em aprovações
 *
 * STATUS: INTENCIONAL. Não é um bug — é um dev shortcut enquanto auth está desabilitado.
 */

export const BYPASS_UUID = "00000000-0000-0000-0000-000000000001" as const;

export function isBypassUser(userId: string): boolean {
  return userId === BYPASS_UUID;
}
