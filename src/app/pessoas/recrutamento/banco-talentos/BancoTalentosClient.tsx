"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Search, X } from "lucide-react";
import { buscarTalentos, moverCandidato } from "../actions";
import type { TalentoBasic, TalentoFiltros } from "../actions";
import { ESCOLARIDADE_SLUGS, ESCOLARIDADE_LABEL, TURNOS } from "../curriculo-constants";

// ── Status config ─────────────────────────────────────────────────────────────

const ALL_STATUSES = ["novo", "entrevista", "triagem", "aprovado", "banco_talentos", "reprovado", "desistiu"] as const;
type StatusId = typeof ALL_STATUSES[number];

const STATUS_CONFIG: Record<StatusId, { label: string; cor: string; grupo: "ativo" | "final" }> = {
  novo:           { label: "Candidatos",  cor: "#B8975A", grupo: "ativo"  },
  entrevista:     { label: "Entrevista",  cor: "#C4622D", grupo: "ativo"  },
  triagem:        { label: "Triagem",     cor: "#B8975A", grupo: "ativo"  },
  aprovado:       { label: "Aprovado",    cor: "#16A34A", grupo: "ativo"  },
  banco_talentos: { label: "Banco",       cor: "#9333EA", grupo: "final"  },
  reprovado:      { label: "Reprovado",   cor: "#DC2626", grupo: "final"  },
  desistiu:       { label: "Desistiu",    cor: "#64748B", grupo: "final"  },
};

const REATIVAVEIS = new Set<StatusId>(["banco_talentos", "reprovado", "desistiu"]);

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  talentos: TalentoBasic[];
  totalInicial: number;
};

// ── Componente ────────────────────────────────────────────────────────────────

export function BancoTalentosClient({ talentos: inicial, totalInicial }: Props) {
  const router = useRouter();

  // status chips — todos ligados por padrão
  const [statusAtivos, setStatusAtivos] = useState<Set<StatusId>>(new Set(ALL_STATUSES));

  const [filtros, setFiltrosState] = useState<Omit<TalentoFiltros, "statusSelecionados" | "offset">>({});
  const [talentos, setTalentos]   = useState<TalentoBasic[]>(inicial);
  const [total, setTotal]         = useState(totalInicial);
  const [offset, setOffset]       = useState(inicial.length);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal reativar
  const [reativarModal, setReativarModal] = useState<TalentoBasic | null>(null);
  const [targetStatus, setTargetStatus]   = useState<"novo" | "triagem">("triagem");
  const [motivoReativar, setMotivoReativar] = useState("");
  const [reativando, setReativando]       = useState(false);
  const [reativarErro, setReativarErro]   = useState<string | null>(null);

  function buildFiltros(
    f: Omit<TalentoFiltros, "statusSelecionados" | "offset">,
    s: Set<StatusId>,
  ): TalentoFiltros {
    return { ...f, statusSelecionados: Array.from(s) };
  }

  function runBusca(
    f: Omit<TalentoFiltros, "statusSelecionados" | "offset">,
    s: Set<StatusId>,
  ) {
    startTransition(async () => {
      const result = await buscarTalentos({ ...buildFiltros(f, s), offset: 0 });
      setTalentos(result.talentos);
      setTotal(result.total);
      setOffset(result.talentos.length);
    });
  }

  function setFiltro(
    key: keyof typeof filtros,
    value: string | undefined,
    debounce = false,
  ) {
    const newFiltros = { ...filtros, [key]: value };
    setFiltrosState(newFiltros);
    if (debounce) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runBusca(newFiltros, statusAtivos), 400);
    } else {
      runBusca(newFiltros, statusAtivos);
    }
  }

  function toggleStatus(s: StatusId) {
    const next = new Set(statusAtivos);
    if (next.has(s)) {
      // nunca desativar todos
      if (next.size === 1) return;
      next.delete(s);
    } else {
      next.add(s);
    }
    setStatusAtivos(next);
    runBusca(filtros, next);
  }

  function limparTudo() {
    const todos = new Set<StatusId>(ALL_STATUSES);
    setFiltrosState({});
    setStatusAtivos(todos);
    runBusca({}, todos);
  }

  async function carregarMais() {
    setCarregandoMais(true);
    const result = await buscarTalentos({ ...buildFiltros(filtros, statusAtivos), offset });
    setTalentos((prev) => [...prev, ...result.talentos]);
    setOffset((prev) => prev + result.talentos.length);
    setCarregandoMais(false);
  }

  async function confirmarReativar() {
    if (!reativarModal) return;
    setReativando(true);
    setReativarErro(null);
    const result = await moverCandidato(reativarModal.id, targetStatus, motivoReativar || undefined);
    if (!result.success) {
      setReativarErro(result.error ?? "Erro ao reativar");
      setReativando(false);
      return;
    }
    // Atualiza o status localmente em vez de remover da lista
    setTalentos((prev) =>
      prev.map((t) => t.id === reativarModal.id ? { ...t, status: targetStatus } : t)
    );
    setReativando(false);
    setReativarModal(null);
    setMotivoReativar("");
  }

  function abrirReativar(t: TalentoBasic) {
    setReativarModal(t);
    setTargetStatus("triagem");
    setReativarErro(null);
    setMotivoReativar("");
  }

  const temFiltroTexto = Object.values(filtros).some((v) => v !== undefined && v !== "");
  const temFiltroStatus = statusAtivos.size < ALL_STATUSES.length;
  const temFiltro = temFiltroTexto || temFiltroStatus;

  const hasMore = talentos.length < total;

  const inputStyle: React.CSSProperties = {
    padding: "7px 10px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div>
      {/* Filtros de texto */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Nome do candidato..."
            value={filtros.termo ?? ""}
            onChange={(e) => setFiltro("termo", e.target.value || undefined, true)}
            style={{ ...inputStyle, width: "100%", paddingLeft: 30, boxSizing: "border-box" }}
          />
        </div>
        <input
          type="text"
          placeholder="Cargo pretendido..."
          value={filtros.cargo ?? ""}
          onChange={(e) => setFiltro("cargo", e.target.value || undefined, true)}
          style={{ ...inputStyle, flex: "1 1 160px", minWidth: 140 }}
        />
        <input
          type="text"
          placeholder="Cidade..."
          value={filtros.cidade ?? ""}
          onChange={(e) => setFiltro("cidade", e.target.value || undefined, true)}
          style={{ ...inputStyle, flex: "1 1 130px", minWidth: 110 }}
        />
        <select
          value={filtros.escolaridade ?? ""}
          onChange={(e) => setFiltro("escolaridade", e.target.value || undefined)}
          style={{ ...inputStyle, flex: "1 1 170px", minWidth: 150 }}
        >
          <option value="">Escolaridade...</option>
          {ESCOLARIDADE_SLUGS.map((s) => (
            <option key={s} value={s}>{ESCOLARIDADE_LABEL[s]}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Habilidade..."
          value={filtros.habilidade ?? ""}
          onChange={(e) => setFiltro("habilidade", e.target.value || undefined, true)}
          style={{ ...inputStyle, flex: "1 1 130px", minWidth: 110 }}
        />
        <select
          value={filtros.turno ?? ""}
          onChange={(e) => setFiltro("turno", e.target.value || undefined)}
          style={{ ...inputStyle, flex: "1 1 120px", minWidth: 100 }}
        >
          <option value="">Turno...</option>
          {TURNOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Chips de status + meta */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {ALL_STATUSES.map((s) => {
          const cfg   = STATUS_CONFIG[s];
          const ativo = statusAtivos.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 99,
                border: `1.5px solid ${cfg.cor}`,
                background: ativo ? `${cfg.cor}22` : "transparent",
                color: ativo ? cfg.cor : "var(--text-3)",
                cursor: "pointer",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {cfg.label}
            </button>
          );
        })}

        {temFiltro && (
          <button
            onClick={limparTudo}
            style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0, marginLeft: 4 }}
          >
            <X size={11} /> Limpar filtros
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
          {isPending
            ? "Buscando..."
            : total === 0
              ? "Nenhum candidato"
              : `${talentos.length} de ${total} candidato${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Tabela */}
      {talentos.length === 0 && !isPending ? (
        <div style={{ textAlign: "center", padding: "56px 0", color: "var(--text-3)", fontSize: 13, border: "1px dashed var(--border)", borderRadius: 10 }}>
          Nenhum candidato encontrado com esses filtros.
        </div>
      ) : (
        <div style={{ overflowX: "auto", opacity: isPending ? 0.5 : 1, transition: "opacity 0.15s" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nome", "Cargo pretendido", "Cidade", "Escolaridade", "Status", "Habilidades", "CV", "Entrada", ""].map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {talentos.map((t) => {
                const status = t.status as StatusId;
                const cfg    = STATUS_CONFIG[status] ?? { label: t.status, cor: "#64748B", grupo: "final" as const };
                const podeReativar = REATIVAVEIS.has(status);
                const estaAtivo    = !REATIVAVEIS.has(status) && status !== "desistiu";

                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => router.push(`/pessoas/recrutamento/${t.id}`)}
                        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, color: "var(--text)", fontWeight: 600, fontSize: 13 }}
                      >
                        {t.nome ?? "(sem nome)"}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>
                      {t.area_interesse ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                      {t.cidade ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>
                      {t.escolaridade_nivel ? (ESCOLARIDADE_LABEL[t.escolaridade_nivel] ?? t.escolaridade_nivel) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${cfg.cor}20`, color: cfg.cor, whiteSpace: "nowrap" }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(t.habilidades ?? []).slice(0, 2).map((h) => (
                          <span key={h} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                            {h}
                          </span>
                        ))}
                        {(t.habilidades?.length ?? 0) > 2 && (
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>+{(t.habilidades?.length ?? 0) - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {t.cv_storage_path && (
                        <span title="CV anexado" style={{ color: "#2563EB", opacity: 0.7 }}>
                          <Paperclip size={13} />
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-3)", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {estaAtivo ? (
                        <button
                          onClick={() => router.push(`/pessoas/recrutamento/${t.id}`)}
                          style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Ver no pipeline
                        </button>
                      ) : podeReativar ? (
                        <button
                          onClick={() => abrirReativar(t)}
                          style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--brasa)", color: "var(--brasa)", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Reativar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Carregar mais */}
      {hasMore && talentos.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button
            onClick={carregarMais}
            disabled={carregandoMais}
            style={{ padding: "8px 24px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: 13, cursor: carregandoMais ? "default" : "pointer", opacity: carregandoMais ? 0.6 : 1 }}
          >
            {carregandoMais ? "Carregando..." : `Carregar mais (${total - talentos.length} restantes)`}
          </button>
        </div>
      )}

      {/* Modal Reativar */}
      {reativarModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget && !reativando) setReativarModal(null); }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              Reativar candidato
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>
              <strong style={{ color: "var(--text)" }}>{reativarModal.nome}</strong> será movido de volta ao pipeline ativo.
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
              Mover para
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as "novo" | "triagem")}
              disabled={reativando}
              style={{ width: "100%", padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, marginBottom: 14 }}
            >
              <option value="triagem">Triagem</option>
              <option value="novo">Novo</option>
            </select>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
              Motivo (opcional)
            </label>
            <textarea
              value={motivoReativar}
              onChange={(e) => setMotivoReativar(e.target.value)}
              disabled={reativando}
              placeholder="Ex: Nova vaga compatível com o perfil..."
              rows={3}
              style={{ width: "100%", padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
            />

            {reativarErro && (
              <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{reativarErro}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setReativarModal(null)}
                disabled={reativando}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 13, cursor: reativando ? "default" : "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReativar}
                disabled={reativando}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--brasa)", color: "var(--primary-foreground)", fontSize: 13, fontWeight: 600, cursor: reativando ? "default" : "pointer", opacity: reativando ? 0.7 : 1 }}
              >
                {reativando ? "Reativando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
