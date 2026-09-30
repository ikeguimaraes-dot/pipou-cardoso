import { requireRole } from "@kph/auth/server";
import { getCandidato, getAvaliacao, getAgendamentos, getFeedbackOperacional } from "../actions";
import { SourceHistory } from "../SourceHistory";
import { notFound } from "next/navigation";
import { CandidatoClient } from "./CandidatoClient";
import "../recruitment.css";

export const dynamic = "force-dynamic";

export default async function CandidatoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const { id } = await params;
  const [candidatoR, avaliacaoR, agendamentosR, feedbackOpR] = await Promise.allSettled([
    getCandidato(id),
    getAvaliacao(id),
    getAgendamentos(id),
    getFeedbackOperacional(id),
  ]);
  const candidato = candidatoR.status === "fulfilled" ? candidatoR.value : null;
  const avaliacao = avaliacaoR.status === "fulfilled" ? avaliacaoR.value : null;
  const agendamentos = agendamentosR.status === "fulfilled" ? (agendamentosR.value ?? []) : [];
  const feedbackOp = feedbackOpR.status === "fulfilled" ? feedbackOpR.value : null;
  if (!candidato) notFound();

  return (
    <div className="recruit-workspace">
      <header className="recruit-header">
        <div className="recruit-eyebrow">
          Pipou Academy / Recrutamento / Candidato
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
          <h1 className="recruit-title">
            {candidato.nome ?? candidato.name ?? "Candidato"}
          </h1>
          <a href="/pessoas/recrutamento" style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
            ← Pipeline
          </a>
        </div>
      </header>

      <nav className="candidate-jumps" aria-label="Seções do candidato">
        <a href="#proximas-acoes">Próximas ações</a>
        <a href="#perfil">Perfil e contato</a>
        <a href="#curriculo">Currículo</a>
        <a href="#historico">Histórico</a>
        <a href="#fontes-importadas">Fontes importadas</a>
      </nav>

      <SourceHistory candidateId={id} />
      <CandidatoClient
        candidato={candidato}
        avaliacao={avaliacao}
        agendamentos={agendamentos}
        feedbackOperacional={feedbackOp}
      />
    </div>
  );
}
