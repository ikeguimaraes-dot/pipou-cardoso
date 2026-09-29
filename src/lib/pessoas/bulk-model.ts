import { validateCpf } from "@/lib/cpf";
import { CAMPOS_PENDENCIA, employeePendencias, type CampoPendencia, type PendenciaEmployee, type PendenciaUnit } from "./pendencias-model";
import { normalizePendingValues } from "./pendencias-validation";

export const MAX_BULK_ROWS = 200;
export const BULK_COLUMNS = Object.keys(CAMPOS_PENDENCIA) as CampoPendencia[];
export type BulkInputRow = { line: number; cpf: string; values: Partial<Record<CampoPendencia, string>>; error?: string };
export type BulkPreviewRow = BulkInputRow & {
  status: "ready" | "invalid" | "unchanged"; employeeId?: string; name?: string;
  expected: Partial<Record<CampoPendencia, string | null>>; message: string;
};
const key = (s: string) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const cpfDigits = (s: string) => s.replace(/[.\-\s]/g, "");

/** Strict CSV reader: quotes, escaped quotes, CRLF, BOM, multiline cells. */
export function readBulkCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === delimiter || c === "\n" || c === "\r") {
      row.push(cell); cell = ""; closed = false;
      if (c !== delimiter) { rows.push(row); row = []; if (c === "\r" && text[i + 1] === "\n") i++; }
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (closed || c === '"') throw new Error("CSV com aspas inválidas. Salve novamente como CSV UTF-8.");
    else cell += c;
  }
  if (quoted) throw new Error("CSV com aspas não fechadas.");
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

export function parseBulkMatrix(matrix: string[][]): BulkInputRow[] {
  if (matrix.length < 2 || matrix.length > MAX_BULK_ROWS + 1) throw new Error(`Use entre 1 e ${MAX_BULK_ROWS} linhas por arquivo.`);
  const aliases = new Map<string, string>(BULK_COLUMNS.flatMap(k => [[key(k), k], [key(CAMPOS_PENDENCIA[k].label), k]]));
  aliases.set("nome", "nome"); aliases.set("cargo", "funcao"); aliases.set("uf", "estado");
  const headers = matrix[0]!.map(h => aliases.get(key(h)) ?? "");
  if (headers.some(h => !h) || new Set(headers).size !== headers.length || !headers.includes("cpf") || headers.length < 2)
    throw new Error("Confira os títulos das colunas: use o modelo, com CPF e pelo menos um campo para completar. Colunas desconhecidas ou repetidas não são aceitas.");
  const rows = matrix.slice(1).flatMap((cells, i): BulkInputRow[] => {
    if (cells.every(v => !v.trim())) return [];
    const values: BulkInputRow["values"] = {}; let error: string | undefined;
    if (cells.length > headers.length && cells.slice(headers.length).some(v => v.trim())) error = "Há dados fora das colunas do cabeçalho.";
    const cpf = cpfDigits(cells[headers.indexOf("cpf")]?.trim() ?? "");
    if (!/^\d{11}$/.test(cpf) || !validateCpf(cpf).valid) error = "CPF inválido: mantenha os 11 dígitos e os zeros iniciais.";
    headers.forEach((h, j) => {
      let value = cells[j]?.trim() ?? "";
      if (h === "cpf" || h === "nome" || !value) return;
      if (value.length > 250 || /^[=]/.test(value)) { error = "Use valores simples com até 250 caracteres, sem fórmulas."; return; }
      if (h === "data_admissao" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) value = value.split("/").reverse().join("-");
      if (h === "tipo_contrato") value = ["clt", "pj"].includes(value.toLowerCase()) ? value.toUpperCase() : key(value);
      values[h as CampoPendencia] = value;
    });
    const normalized = normalizePendingValues(values);
    if (!normalized.ok) error = normalized.error;
    return [{ line: i + 2, cpf, values: normalized.ok ? normalized.values : values, ...(error ? { error } : {}) }];
  });
  const counts = new Map<string, number>(); rows.forEach(r => counts.set(r.cpf, (counts.get(r.cpf) ?? 0) + 1));
  return rows.map(r => counts.get(r.cpf)! > 1 ? { ...r, error: "CPF repetido no arquivo. Mantenha uma linha por pessoa e unidade." } : r);
}

export function buildBulkPreview(rows: BulkInputRow[], employees: PendenciaEmployee[], unit: PendenciaUnit): BulkPreviewRow[] {
  return rows.map(row => {
    const base = { ...row, expected: {}, message: row.error ?? "", status: "invalid" as const };
    if (row.error) return base;
    const matches = employees.filter(e => e.ativo && e.unit_id === unit.id && cpfDigits(e.cpf ?? "") === row.cpf);
    if (matches.length !== 1) return { ...base, message: matches.length ? "Mais de um cadastro ativo com este CPF na unidade. Confira os vínculos." : "CPF não encontrado entre os colaboradores ativos desta unidade. Confira o cadastro." };
    const employee = matches[0]!;
    const pending = new Set(employeePendencias(employee, unit).flatMap(p => Object.keys(p.fields)));
    const values: BulkInputRow["values"] = {}, expected: BulkPreviewRow["expected"] = {}, preserved: string[] = [];
    for (const field of Object.keys(row.values) as CampoPendencia[]) {
      if (field !== "cpf" && pending.has(field)) { values[field] = row.values[field]; expected[field] = employee[field]; }
      else preserved.push(CAMPOS_PENDENCIA[field].label);
    }
    const ready = Object.keys(values).length > 0;
    return { line: row.line, cpf: row.cpf, employeeId: employee.id, name: `${employee.nome} ${employee.sobrenome}`.trim(),
      values, expected, status: ready ? "ready" : "unchanged",
      message: `${ready ? "Pronto para completar." : "Nenhum campo pendente para completar nesta linha."}${preserved.length ? ` Campos já preenchidos ou fora das pendências preservados: ${preserved.join(", ")}.` : ""}` };
  });
}

export function bulkCsv(rows: string[][]): string {
  const cell = (v: string) => `"${(/^[\s]*[=+\-@]/.test(v) ? "'" : "") + v.replace(/"/g, '""')}"`;
  return "\uFEFF" + rows.map(r => r.map(cell).join(";")).join("\r\n");
}
