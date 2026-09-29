import { readBulkCsv } from "./bulk-model";
import { validateCpf } from "@/lib/cpf";
import { normalizePendingValues } from "./pendencias-validation";
export const INITIAL_COLUMNS = ["nome_completo", "cpf", "funcao", "data_admissao", "salario_base", "tipo_contrato", "pis", "email", "telefone"] as const;
export function parseInitialImport(text: string) {
  if (text.length > 500000) throw new Error("Arquivo maior que o limite de 500 KB.");
  const matrix = readBulkCsv(text);
  const headers = matrix[0]?.map(h => h.trim().toLowerCase()) ?? [];
  if (!headers.length || new Set(headers).size !== headers.length || headers.some(h => !INITIAL_COLUMNS.includes(h as typeof INITIAL_COLUMNS[number])) || INITIAL_COLUMNS.slice(0,4).some(h => !headers.includes(h))) throw new Error("Use as colunas do modelo, incluindo nome_completo, cpf, funcao e data_admissao.");
  const rows = matrix.slice(1).filter(row => row.some(v => v.trim()));
  if (!rows.length || rows.length > 200) throw new Error("Use entre 1 e 200 colaboradores por arquivo.");
  const seen = new Set<string>();
  return rows.map((cells,i) => {
    if (cells.length > headers.length || cells.some(v => v.length > 250 || /^\s*[=+@]/.test(v))) throw new Error(`Linha ${i+2}: conteúdo fora do modelo.`);
    const row = Object.fromEntries(headers.map((h,j) => [h,cells[j]?.trim() ?? ""]));
    if (!row.cpf || !row.nome_completo || !row.funcao || !row.data_admissao) throw new Error(`Linha ${i+2}: preencha CPF, nome, função e admissão.`);
    const cpf = row.cpf.replace(/[.\-\s]/g, "");
    if (!validateCpf(cpf).valid || seen.has(cpf)) throw new Error(`Linha ${i+2}: CPF inválido ou repetido. Preserve os zeros iniciais.`);
    seen.add(cpf);
    const name = row.nome_completo.split(/\s+/);
    const date = /^\d{2}\/\d{2}\/\d{4}$/.test(row.data_admissao) ? row.data_admissao.split("/").reverse().join("-") : row.data_admissao;
    const normalized = normalizePendingValues({funcao:row.funcao,data_admissao:date,...(row.tipo_contrato ? {tipo_contrato:row.tipo_contrato} : {}),...(row.pis ? {pis:row.pis} : {}),...(row.email ? {email:row.email} : {}),...(row.telefone ? {telefone:row.telefone} : {})});
    if (!normalized.ok) throw new Error(`Linha ${i+2}: ${normalized.error}`);
    const salary = row.salario_base || "0";
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(salary) || Number(salary.replace(",",".")) > 99999999.99) throw new Error(`Linha ${i+2}: salário deve ser positivo, sem separador de milhar.`);
    return {nome:name[0],sobrenome:name.slice(1).join(" "),cpf,funcao:row.funcao,data_admissao:date,...normalized.values,salario_base:Number(salary.replace(",",".")),ativo:true,status_rh:"ativo"};
  });
}
