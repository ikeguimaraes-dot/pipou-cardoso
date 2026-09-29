import { z } from "zod";
import { validateCpf } from "@/lib/cpf";
import { CAMPOS_PENDENCIA, saoPauloDate, type CampoPendencia } from "./pendencias-model";

export function normalizePendingValues(input: Partial<Record<CampoPendencia, string>>):
  { ok: true; values: Partial<Record<CampoPendencia, string>> } | { ok: false; error: string } {
  const values = { ...input };
  const keys = Object.keys(values) as CampoPendencia[];
  for (const key of keys) {
    let value = values[key]!;
    if (["cpf", "pis", "telefone", "contato_emergencia_tel", "cep"].includes(key)) {
      if (!/^[\d\s().+\-]+$/.test(value)) return { ok: false, error: `${CAMPOS_PENDENCIA[key].label}: use apenas números e pontuação.` };
      value = value.replace(/\D/g, "");
    }
    if (key === "cpf" && (value.length !== 11 || !validateCpf(value).valid)) return { ok: false, error: "CPF inválido. Confira os 11 dígitos." };
    if (key === "pis" && (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value))) return { ok: false, error: "PIS deve conter 11 dígitos. Confira o documento." };
    if ((key === "telefone" || key === "contato_emergencia_tel") && !/^\d{10,15}$/.test(value)) return { ok: false, error: "Informe o telefone com DDD." };
    if (key === "email" && !z.email().safeParse(value).success) return { ok: false, error: "Informe um e-mail válido." };
    if (key === "cep" && !/^\d{8}$/.test(value)) return { ok: false, error: "CEP deve conter 8 dígitos." };
    if (key === "estado") { value = value.toUpperCase(); if (!/^[A-Z]{2}$/.test(value)) return { ok: false, error: "UF deve conter duas letras." }; }
    if (key === "tipo_contrato" && !["CLT", "PJ", "temporario", "estagiario"].includes(value)) return { ok: false, error: "Escolha um tipo de contrato válido." };
    if (key === "data_admissao") {
      const date = new Date(`${value}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value > saoPauloDate())
        return { ok: false, error: "Confira a data de admissão. Ela não pode ser futura." };
    }
    values[key] = value;
  }
  return { ok: true, values };
}
