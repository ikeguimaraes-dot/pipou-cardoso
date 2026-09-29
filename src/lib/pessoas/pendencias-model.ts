import { validateCpf } from "@/lib/cpf";

export const PENDENCIAS_ROLES = ["founder", "cfo", "ceo", "diretor", "head_rh", "pipou_admin", "pessoas", "gm"] as const;
export const CAMPOS_PENDENCIA = {
  cpf: { label: "CPF", type: "text" },
  pis: { label: "PIS", type: "text" },
  telefone: { label: "Telefone", type: "tel" },
  email: { label: "E-mail", type: "email" },
  funcao: { label: "Cargo / função", type: "text" },
  data_admissao: { label: "Data de admissão", type: "date" },
  tipo_contrato: { label: "Tipo de contrato", type: "select" },
  contato_emergencia_nome: { label: "Contato de emergência", type: "text" },
  contato_emergencia_tel: { label: "Telefone de emergência", type: "tel" },
  cep: { label: "CEP", type: "text" },
  rua: { label: "Rua", type: "text" },
  numero: { label: "Número (ou s/n)", type: "text" },
  bairro: { label: "Bairro", type: "text" },
  cidade: { label: "Cidade", type: "text" },
  estado: { label: "UF", type: "text" },
} as const;
export type CampoPendencia = keyof typeof CAMPOS_PENDENCIA;
export type PendenciaEmployee = Record<CampoPendencia, string | null> & {
  id: string; unit_id: string; nome: string; sobrenome: string;
  ativo: boolean | null; data_demissao: string | null; tier: string | null;
};
export type PendenciaUnit = { id: string; name: string };
export type PendenciaDocument = {
  id: string; employee_id: string; tipo: string; nome: string;
  file_path: string; data_validade: string | null; data_emissao: string | null; created_at: string | null;
};
export type Pendencia = {
  id: string; category: "cadastro" | "documentos" | "rotinas";
  priority: "alta" | "media"; code: string; title: string; detail: string;
  employeeId: string | null; employeeName: string; unitId: string; unitName: string;
  owner: string; href: string; action: string;
  fields: Partial<Record<CampoPendencia, string | null>>;
};
export type Rotina = {
  id: string; unitId: string; unitName: string; title: string; detail: string;
  status: "sem_registro" | "parcial" | "registrado" | "conferir" | "indisponivel";
  href: string; owner: string;
};
export type PendenciasSnapshot = {
  units: PendenciaUnit[]; items: Pendencia[]; routines: Rotina[];
  employeeCount: number; employeeCounts: Record<string, number>; period: string; checkedAt: string; errors: string[];
};

export const empty = (value: string | null | undefined) => !value?.trim();
export function saoPauloDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function defaultPeriod(today: string): string {
  const [year, month] = today.split("-").map(Number);
  const d = new Date(Date.UTC(year!, month! - 2, 1));
  return d.toISOString().slice(0, 7);
}
export function validPeriod(value: string): boolean {
  return /^20\d{2}-(0[1-9]|1[0-2])$/.test(value);
}
export function periodLabel(period: string): string {
  return `${period.slice(5, 7)}/${period.slice(0, 4)}`;
}

/** No optional demographic fields are treated as mandatory. No employment status is changed here. */
export function employeePendencias(employee: PendenciaEmployee, unit: PendenciaUnit): Pendencia[] {
  if (!employee.ativo) return [];
  const items: Pendencia[] = [];
  const add = (code: string, title: string, detail: string, keys: CampoPendencia[] = [], priority: Pendencia["priority"] = "media", owner = "RH / DP") => {
    items.push({ id: `${employee.id}:${code}`, category: "cadastro", priority, code, title, detail,
      employeeId: employee.id, employeeName: `${employee.nome} ${employee.sobrenome}`.trim(),
      unitId: unit.id, unitName: unit.name, owner,
      href: `/pessoas/colaboradores/${employee.id}/editar`, action: keys.length ? "Completar agora" : "Abrir cadastro",
      fields: Object.fromEntries(keys.map(key => [key, employee[key]])),
    });
  };
  if (empty(employee.cpf)) add("cpf", "CPF não preenchido", "Solicite o CPF ao colaborador e confira antes de salvar.", ["cpf"], "alta");
  else if (employee.cpf!.replace(/\D/g, "").length !== 11 || !validateCpf(employee.cpf!).valid)
    add("cpf", "CPF precisa de conferência", "O número cadastrado não passou na validação de dígitos.", ["cpf"], "alta");
  if (empty(employee.tipo_contrato)) add("contrato", "Tipo de contrato não definido", "Confirme o vínculo antes de completar as demais informações.", ["tipo_contrato"], "alta");
  if (employee.tipo_contrato === "CLT" && empty(employee.pis)) add("pis", "PIS não preenchido", "Confira o número usado no cadastro de ponto e na folha.", ["pis"], "alta");
  if (empty(employee.funcao)) add("cargo", "Cargo não preenchido", "Informe a função atual do colaborador.", ["funcao"], "alta");
  if (empty(employee.data_admissao)) add("admissao", "Data de admissão não preenchida", "Use a data do vínculo correspondente a este cadastro.", ["data_admissao"], "alta");
  if (empty(employee.telefone) && empty(employee.email)) add("contato", "Sem telefone ou e-mail", "Preencha pelo menos um canal para contato com o colaborador.", ["telefone", "email"]);
  const address = (["cep", "rua", "numero", "bairro", "cidade", "estado"] as CampoPendencia[]).filter(key => empty(employee[key]));
  if (address.length) add("endereco", "Endereço incompleto", `Falta preencher: ${address.map(key => CAMPOS_PENDENCIA[key].label).join(", ")}.`, address);
  const emergency = (["contato_emergencia_nome", "contato_emergencia_tel"] as CampoPendencia[]).filter(key => empty(employee[key]));
  if (emergency.length) add("emergencia", "Contato de emergência incompleto", "Registre quem deve ser contatado em uma emergência.", emergency);
  if (empty(employee.tier)) add("nivel", "Nível de estrutura não definido", "Confira o cargo e encaminhe à gestão a definição do nível. Isso não significa, por si só, falta de acesso ao sistema.", [], "media", "RH + Gestão");
  if (!empty(employee.data_demissao)) add("vinculo", "Ativo com data de desligamento", "Confira o vínculo com o DP antes de alterar o status. Pode haver mais de um vínculo para a mesma pessoa.", [], "alta", "DP + Gestão");
  return items;
}

export function documentPendencias(employees: PendenciaEmployee[], units: PendenciaUnit[], docs: PendenciaDocument[], today: string): Pendencia[] {
  const items: Pendencia[] = [];
  const in30 = new Date(`${today}T12:00:00Z`); in30.setUTCDate(in30.getUTCDate() + 30);
  const end = in30.toISOString().slice(0, 10);
  for (const employee of employees.filter(e => e.ativo)) {
    const unit = units.find(u => u.id === employee.unit_id);
    if (!unit) continue;
    const own = docs.filter(d => d.employee_id === employee.id && !empty(d.file_path));
    const base = { category: "documentos" as const, employeeId: employee.id,
      employeeName: `${employee.nome} ${employee.sobrenome}`.trim(), unitId: unit.id, unitName: unit.name,
      owner: "RH / DP", href: `/pessoas/colaboradores/${employee.id}?tab=documentos`, action: "Abrir documentos", fields: {} };
    if (!own.length) {
      items.push({ ...base, id: `${employee.id}:documentos`, priority: "media", code: "sem_documentos", title: "Nenhum documento anexado", detail: "Confira os documentos do vínculo e anexe os que já foram coletados. A ausência de anexo não comprova ausência do documento." });
    }
    // Only the latest attachment of each type is checked; replaced historical files are not charged again.
    const latest = new Map<string, PendenciaDocument>();
    for (const doc of own) {
      const previous = latest.get(doc.tipo);
      if (!previous || (doc.data_emissao ?? doc.created_at ?? "") > (previous.data_emissao ?? previous.created_at ?? "")) latest.set(doc.tipo, doc);
    }
    for (const doc of latest.values()) {
      if (!doc.data_validade || doc.data_validade > end) continue;
      const expired = doc.data_validade < today;
      items.push({ ...base, id: `${doc.id}:validade`, priority: expired ? "alta" : "media", code: expired ? "documento_vencido" : "documento_vencendo",
        title: expired ? "Documento com validade vencida" : "Documento vence em até 30 dias",
        detail: `${doc.nome} · validade ${doc.data_validade.split("-").reverse().join("/")}. Confira se existe uma versão atualizada para anexar.` });
    }
  }
  return items;
}

export function routinePendencias(routines: Rotina[]): Pendencia[] {
  return routines.filter(r => r.status !== "registrado" && r.status !== "indisponivel").map(r => ({
    id: r.id, category: "rotinas", priority: "media", code: r.id.split(":")[0]!, title: r.title, detail: r.detail,
    employeeId: null, employeeName: "Rotina da unidade", unitId: r.unitId, unitName: r.unitName,
    owner: r.owner, href: r.href, action: "Abrir rotina", fields: {},
  }));
}
