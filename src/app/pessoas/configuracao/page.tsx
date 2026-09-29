import { requireRole } from "@kph/auth/server";
import { UnitForm } from "./unit-form";
export default async function SetupPage() {
  await requireRole(["founder"]);
  return <div className="grid gap-6"><h1 className="text-3xl font-semibold">Configuração inicial</h1>
    <p>Cadastre as unidades reais da sua organização. Depois, importe a base de colaboradores pela área de Importação em massa.</p>
    <UnitForm />
    <a className="font-semibold text-[var(--brand)]" href="/pessoas/importacao-inicial">Importar base inicial de colaboradores →</a>
    <p className="text-sm text-[var(--text-2)]">Os indicadores serão alimentados pelos cadastros e históricos importados. Integrações de ponto, folha e agentes precisam das contas e configurações da organização.</p>
  </div>;
}
