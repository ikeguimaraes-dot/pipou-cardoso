"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizarTelefone } from "@/lib/pessoas/utils";

// Base absoluta da zona Pessoas — os fetches precisam bater na zona
// (kph-os-pessoas), não na origem atual (que pode ser a shell kph-os.vercel.app).
const PESSOAS_BASE = process.env.NEXT_PUBLIC_PESSOAS_URL ?? "";
import { useAuth } from "@kph/auth/context";
import { useSupabase } from "@kph/auth/context";
import { ChevronLeft } from "lucide-react";
import type { AgentConversation, AgentKey, NameMap } from "./page";

type Meta = {
  name: string;
  role: string;
  color: string;
  colorBorder: string;
  colorDim: string;
};

interface Props {
  agent: AgentKey;
  conversations: AgentConversation[];
  meta: Meta;
  nameMap: NameMap;
  readOnly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

function extractText(content: string | unknown[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return (content as Array<{ type?: string; text?: string }>)
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n") || "[ação do agente]";
  }
  return String(content);
}

function maskPhone(phone: string): string {
  const clean = phone.replace("whatsapp:", "");
  if (clean.startsWith("+55") && clean.length >= 12) {
    return `${clean.slice(0, 5)} ${clean.slice(5, 7)} 9****${clean.slice(-4)}`;
  }
  return clean.length > 8 ? `${clean.slice(0, 4)}****${clean.slice(-4)}` : clean;
}

// Predicado único: conversa real = WhatsApp OU sessão web de colaborador (web:hos_*)
// MESMO predicado usado no filtro de testes e na resolução de identidade.
function isReal(phone: string): boolean {
  return !phone.startsWith("web:") || phone.startsWith("web:hos_");
}

function displayName(phone: string, nameMap: NameMap): string {
  if (phone.startsWith("web:")) {
    // Tenta nameMap (populado em page.tsx a partir de employees para web:hos_*)
    if (nameMap[phone]) return nameMap[phone].nome;
    // Fallback legível — nunca hash
    if (isReal(phone)) {
      const uuid = phone.replace("web:hos_", "");
      return `Colaborador · ${uuid.slice(0, 8)}`;
    }
    return "Sessão Teste";
  }
  const key = normalizarTelefone(phone);
  return nameMap[key]?.nome ?? maskPhone(phone);
}

function avatarLetra(phone: string, nameMap: NameMap): string {
  if (phone.startsWith("web:")) {
    if (nameMap[phone]) return nameMap[phone].avatar;
    return isReal(phone) ? "C" : "T";
  }
  const key = normalizarTelefone(phone);
  return nameMap[key]?.avatar ?? "#";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const ROLE_LABELS: Record<string, string> = {
  user: "Usuário",
  operator: "Operador",
  assistant: "Agente",
};

function StatusBadge({ status }: { status: AgentConversation["status"] }) {
  const map = {
    ativa:     { label: "IA",        bg: "rgba(34,197,94,0.12)",   color: "#22C55E"  },
    assumida:  { label: "Operador",  bg: "rgba(201,169,110,0.14)", color: "#C9A96E"  },
    encerrada: { label: "Encerrada", bg: "rgba(113,113,122,0.12)", color: "#71717A"  },
  };
  const s = status ?? "ativa";
  const style = map[s] ?? map.ativa;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      padding: "2px 7px", borderRadius: 99,
      background: style.bg, color: style.color,
      whiteSpace: "nowrap",
    }}>
      {style.label}
    </span>
  );
}

// ─── Lista de conversas (painel esquerdo) ─────────────────────────

function ConversasList({
  conversations, selectedId, onSelect, meta, nameMap,
}: {
  conversations: AgentConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  meta: Meta;
  nameMap: NameMap;
}) {
  const [filtro, setFiltro] = useState<"todas" | "aguardando" | "ia" | "em_atendimento">("todas");
  const [busca, setBusca] = useState("");
  const [ocultarTestes, setOcultarTestes] = useState(true);

  const lastRole = (c: AgentConversation) => c.messages.at(-1)?.role;
  const matchFiltro = (c: AgentConversation) =>
    filtro === "todas" ? true
    : filtro === "aguardando" ? (c.status === "ativa" && lastRole(c) === "user")
    : filtro === "ia" ? c.status === "ativa"
    : c.status === "assumida";
  const matchBusca = (c: AgentConversation) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return displayName(c.phone, nameMap).toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  };
  const matchReal = (c: AgentConversation) => !ocultarTestes || isReal(c.phone);
  const filtered = conversations.filter((c) => matchReal(c) && matchFiltro(c) && matchBusca(c));
  const countFor = (f: typeof filtro) =>
    conversations.filter((c) =>
      matchReal(c) && (
        f === "todas" ? true
        : f === "aguardando" ? (c.status === "ativa" && lastRole(c) === "user")
        : f === "ia" ? c.status === "ativa"
        : c.status === "assumida"
      ),
    ).length;

  const TABS: { key: typeof filtro; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "aguardando", label: "Aguardando" },
    { key: "ia", label: "IA" },
    { key: "em_atendimento", label: "Em atendimento" },
  ];

  return (
    <>
      {/* Header da lista: filtros + busca */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TABS.map((t) => {
              const ativo = filtro === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setFiltro(t.key)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 99,
                    border: "1px solid " + (ativo ? meta.color : "var(--border)"),
                    background: ativo ? `${meta.color}1A` : "transparent",
                    color: ativo ? meta.color : "var(--text-3)", cursor: "pointer",
                  }}
                >
                  {t.label} {countFor(t.key)}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setOcultarTestes(o => !o)}
            title={ocultarTestes ? "Mostrar sessões de teste" : "Ocultar sessões de teste"}
            style={{
              fontSize: 10, padding: "3px 7px", borderRadius: 6, flexShrink: 0,
              border: "1px solid var(--border)",
              background: ocultarTestes ? "transparent" : "rgba(147,51,234,0.1)",
              color: ocultarTestes ? "var(--text-3)" : "#9333EA",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {ocultarTestes ? "+ testes" : "− testes"}
          </button>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nome ou telefone…"
          style={{
            width: "100%", padding: "7px 10px", fontSize: 12, color: "var(--text)",
            background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none",
          }}
        />
      </div>

      {/* Items */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>
        {filtered.length === 0 && (
          <div role="status" style={{
            padding: "32px 20px", color: "var(--text-3)",
            fontSize: 13, textAlign: "center", lineHeight: 1.6,
          }}>
            Nenhuma conversa ainda.
            <br />
            <span style={{ fontSize: 11 }}>As novas chegam aqui em tempo real.</span>
          </div>
        )}

        {filtered.map((conv) => {
          const lastMsg = conv.messages.at(-1);
          const preview = lastMsg ? extractText(lastMsg.content).slice(0, 160) : "—";
          const active = conv.id === selectedId;
          const roleLabel = lastMsg ? (ROLE_LABELS[lastMsg.role] ?? "Agente") : "";

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              aria-pressed={active}
              aria-label={`Conversa com ${displayName(conv.phone, nameMap)}, ${conv.messages.length} mensagens`}
              style={{
                width: "100%",
                display: "flex", flexDirection: "column", gap: 5,
                padding: "13px 16px",
                background: active ? "var(--surface-2)" : "transparent",
                border: "none",
                borderLeft: `3px solid ${active ? meta.color : "transparent"}`,
                borderBottom: "1px solid var(--border)",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.12s, border-left-color 0.12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 99, background: `${meta.color}1A`, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                    {avatarLetra(conv.phone, nameMap)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName(conv.phone, nameMap)}
                  </span>
                </span>
                <StatusBadge status={conv.status} />
              </div>

              <div style={{
                fontSize: 12, color: "var(--text-2)", lineHeight: 1.4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lastMsg ? (
                  <>
                    <span
                      aria-label={roleLabel}
                      style={{ color: lastMsg.role === "user" ? "var(--text-2)" : meta.color, marginRight: 4 }}
                    >
                      {lastMsg.role === "user" ? "●" : lastMsg.role === "operator" ? "▲" : "◆"}
                    </span>
                    {preview}
                  </>
                ) : "Sem mensagens registradas."}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {conv.messages.length} msg
                </span>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {relativeTime(conv.last_activity)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Visualizador do chat (centro) ────────────────────────────────

function ChatView({
  conv, agent, meta, onAssumir, onReabrir, onEncerrar, operatorEmail, onMobileBack, nameMap, readOnly, showChatOnMobile,
}: {
  conv: AgentConversation;
  agent: AgentKey;
  meta: Meta;
  onAssumir: () => Promise<void>;
  onReabrir: () => Promise<void>;
  onEncerrar: () => Promise<void>;
  operatorEmail: string;
  nameMap: NameMap;
  onMobileBack: () => void;
  readOnly: boolean;
  showChatOnMobile: boolean;
}) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [assuming, setAssuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { headerRef.current?.focus({ preventScroll: true }); }, [conv.id, showChatOnMobile]);
  useEffect(() => {
    // Rola somente o histórico; scrollIntoView também deslocava os painéis ancestrais.
    const messages = messagesRef.current;
    messages?.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
  }, [conv.id, conv.messages, showChatOnMobile]);

  async function handleAssumir() {
    if (readOnly) return;
    setAssuming(true); setError(null);
    try { await onAssumir(); }
    catch (err) {
      console.error("[AgentConversas] handleAssumir:", err);
      setError("Não conseguimos assumir essa conversa agora. Tente novamente.");
    }
    finally { setAssuming(false); }
  }

  async function handleSend() {
    const text = msg.trim();
    if (!text || sending || readOnly) return;
    setSending(true); setError(null);
    try {
      const res = await fetch(`${PESSOAS_BASE}/api/agentes/${agent}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: conv.phone, message: text, operator_name: operatorEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
      }
      setMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mensagem não enviada. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const isWebSession = conv.phone.startsWith("web:");
  const status = conv.status ?? "ativa";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>

      {/* Header do chat */}
      <div
        ref={headerRef}
        tabIndex={-1}
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
          flexShrink: 0, outline: "none",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {/* Botão voltar — visível só no mobile via CSS */}
          <button
            onClick={onMobileBack}
            aria-label="Voltar para lista"
            className="mobile-back-btn"
            style={{
              display: "none", /* hidden by default; CSS media query mostra em mobile */
              alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName(conv.phone, nameMap)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isWebSession ? "Chat KPH-OS" : "WhatsApp"} · criado {relativeTime(conv.created_at)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div aria-live="polite" aria-atomic="true">
            <StatusBadge status={conv.status} />
          </div>

          {status === "ativa" && (
            <button
              onClick={handleAssumir}
              disabled={assuming || readOnly}
              style={{
                padding: "6px 14px", borderRadius: 8,
                background: meta.colorDim,
                border: `1px solid ${meta.colorBorder}`,
                color: meta.color, fontSize: 12, fontWeight: 700,
                cursor: assuming ? "not-allowed" : "pointer",
                opacity: assuming ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {assuming ? "Assumindo…" : "Assumir"}
            </button>
          )}

          {status === "assumida" && (
            <>
              <span style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                {conv.operator_name ?? "Operador"}
              </span>
              <button
                disabled={readOnly}
                onClick={async () => {
                  setError(null);
                  try { await onEncerrar(); }
                  catch (err) {
                    console.error("[AgentConversas] handleEncerrar:", err);
                    setError("Não conseguimos encerrar a conversa. Tente novamente.");
                  }
                }}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#EF4444", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Encerrar
              </button>
            </>
          )}

          {status === "encerrada" && (
            <button
              disabled={readOnly}
              onClick={async () => {
                setError(null);
                try { await onReabrir(); }
                catch (err) {
                  console.error("[AgentConversas] handleReabrir:", err);
                  setError("Não conseguimos reabrir a conversa. Tente novamente.");
                }
              }}
              style={{
                padding: "6px 12px", borderRadius: 8,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Reabrir
            </button>
          )}
        </div>
      </div>

      {/* Banner de erro */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 20px", background: "rgba(239,68,68,0.08)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Fechar"
            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Mensagens */}
      <div ref={messagesRef} role="region" aria-label="Histórico de mensagens" tabIndex={0} style={{
        flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "20px 20px 24px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {conv.messages.map((m, i) => {
          const isUser = m.role === "user";
          const isOperator = m.role === "operator";
          const text = extractText(m.content);
          if (!text || text === "[ação do agente]") return null;

          const rightSide = isUser || isOperator; // usuário e operador à direita
          const AVATAR = { width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, fontFamily: "var(--font-heading)" } as const;
          return (
            <div key={i} style={{ display: "flex", flexShrink: 0, justifyContent: rightSide ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
              {!isUser && !isOperator && (
                <div role="img" aria-label={meta.name} style={{ ...AVATAR, background: meta.colorDim, border: `1.5px solid ${meta.colorBorder}`, color: meta.color }}>
                  {meta.name[0]}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: rightSide ? "flex-end" : "flex-start", maxWidth: "72%", minWidth: 0 }}>
                {isOperator && (
                  <div style={{ fontSize: 10, color: "#C9A96E", fontWeight: 700, marginBottom: 4, letterSpacing: "0.06em", paddingRight: 2 }}>
                    OPERADOR
                  </div>
                )}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: rightSide ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: isUser
                    ? "var(--surface-2)"
                    : isOperator
                    ? "rgba(201,169,110,0.08)"
                    : meta.colorDim,
                  border: isUser
                    ? "1px solid var(--border)"
                    : isOperator
                    ? "1px solid rgba(201,169,110,0.2)"
                    : `1px solid ${meta.colorBorder}`,
                  color: "var(--text)",
                  fontSize: 13, lineHeight: 1.55,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {text}
                </div>
              </div>
              {isOperator && (
                <div role="img" aria-label="Operador" style={{ ...AVATAR, background: "rgba(201,169,110,0.15)", border: "1.5px solid rgba(201,169,110,0.3)", color: "#C9A96E" }}>
                  OP
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input do operador */}
      {status === "assumida" && !isWebSession && !readOnly && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 8, flexShrink: 0,
          background: "var(--surface)",
        }}>
          <label htmlFor="operator-reply" className="sr-only">
            Responder via WhatsApp
          </label>
          <textarea
            id="operator-reply"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            placeholder={`Responder como ${conv.operator_name ?? "Operador"}…`}
            rows={1}
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 10,
              background: "var(--surface-2)",
              border: `1px solid ${msg ? meta.color + "60" : "var(--border)"}`,
              color: "var(--text)", fontSize: 13, resize: "none",
              outline: "none", fontFamily: "inherit", lineHeight: 1.5,
              minHeight: 44, maxHeight: 120, overflowY: "auto", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!msg.trim() || sending}
            aria-label={sending ? "Enviando…" : "Enviar mensagem"}
            style={{
              width: 44, height: 44, borderRadius: 10, border: "none",
              background: msg.trim() && !sending ? meta.color : "var(--surface-2)",
              color: msg.trim() && !sending ? "#0A0A0B" : "var(--text-3)",
              cursor: msg.trim() && !sending ? "pointer" : "not-allowed",
              fontSize: 16, alignSelf: "flex-end", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {sending ? "…" : "↑"}
          </button>
        </div>
      )}

      {status === "assumida" && isWebSession && (
        <div style={{
          padding: "10px 16px", borderTop: "1px solid var(--border)",
          fontSize: 12, color: "var(--text-3)", textAlign: "center",
          background: "var(--surface)", flexShrink: 0,
        }}>
          Esta sessão é via web. Respostas pelo WhatsApp não estão disponíveis aqui.
        </div>
      )}
    </div>
  );
}

// ─── Painel direito — informações da sessão ───────────────────────

const TIPO_BADGE: Record<string, { label: string; cor: string }> = {
  candidato:   { label: "Candidato",   cor: "#2563EB" },
  colaborador: { label: "Colaborador", cor: "#16A34A" },
  externo:     { label: "Externo",     cor: "#64748B" },
  web:         { label: "Sessão Web",  cor: "#9333EA" },
};

function SessionInfo({ conv, meta, nameMap }: { conv: AgentConversation; meta: Meta; nameMap: NameMap }) {
  const tipoContato = conv.phone.startsWith("web:hos_")
    ? (nameMap[conv.phone]?.tipo ?? "colaborador")
    : conv.phone.startsWith("web:")
    ? "web"
    : (nameMap[normalizarTelefone(conv.phone)]?.tipo ?? "externo");
  const tipoBadge = TIPO_BADGE[tipoContato] ?? { label: "Externo", cor: "#64748B" };
  const msgCount = conv.messages.length;
  const userMsgs = conv.messages.filter((m) => m.role === "user").length;
  const asMsgs = conv.messages.filter((m) => m.role === "assistant").length;
  const opMsgs = conv.messages.filter((m) => m.role === "operator").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "18px 16px", overflowY: "auto" }}>
      {/* Identidade do contato */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, background: `${meta.color}1A`, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, fontFamily: "var(--font-heading)" }}>
          {avatarLetra(conv.phone, nameMap)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>{displayName(conv.phone, nameMap)}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: `${tipoBadge.cor}1A`, color: tipoBadge.cor, border: `1px solid ${tipoBadge.cor}33` }}>
          {tipoBadge.label}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
          Sessão
        </div>
        <Field label="Canal" value={conv.phone.startsWith("web:") ? "Web (KPH-OS)" : "WhatsApp"} />
        <Field label="Contato" value={displayName(conv.phone, nameMap)} />
        <Field label="Iniciada" value={new Date(conv.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} />
        <Field label="Última ativ." value={new Date(conv.last_activity).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} />
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
          Mensagens
        </div>
        <Field label="Total" value={String(msgCount)} accent />
        <Field label="Usuário" value={String(userMsgs)} />
        <Field label={meta.name} value={String(asMsgs)} />
        {opMsgs > 0 && <Field label="Operador" value={String(opMsgs)} />}
      </div>

      {conv.operator_name && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
            Operador
          </div>
          <Field label="Assumida por" value={conv.operator_name} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: accent ? 700 : 500,
        color: "var(--text)", textAlign: "right",
        maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────

function EmptyState({ meta }: { meta: Meta }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 10,
        color: "var(--text-3)", fontSize: 14,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: meta.colorDim, border: `1.5px solid ${meta.colorBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 800, color: meta.color,
        fontFamily: "var(--font-heading)", marginBottom: 4,
      }}>
        {meta.name[0]}
      </div>
      <span style={{ fontSize: 13, color: "var(--text-3)" }}>
        Selecione uma conversa para acompanhar o atendimento.
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────

export function AgentConversasClient({ agent, conversations: initial, meta, nameMap, readOnly = false }: Props) {
  const [conversations, setConversations] = useState<AgentConversation[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [realtimeError, setRealtimeError] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const supabase = useSupabase();
  const { user } = useAuth();
  const operatorEmail = user?.email ?? "Operador";

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`agent-conversas-${agent}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "agent_conversations", filter: `agent=eq.${agent}` },
        (payload: any) => {
          setRealtimeError(false);
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as AgentConversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as AgentConversation;
            setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setConversations((prev) => prev.filter((c) => c.id !== deleted.id));
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") setRealtimeError(true);
      });
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, agent]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setShowChatOnMobile(true);
  }, []);

  const handleMobileBack = useCallback(() => {
    setShowChatOnMobile(false);
  }, []);

  const handleAssumir = useCallback(async () => {
    if (!selected) return;
    const res = await fetch(`${PESSOAS_BASE}/api/agentes/${agent}/status`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: "assumida", operator_name: operatorEmail }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
    }
    // Otimista: reflete na UI imediatamente, sem depender do realtime.
    setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: "assumida", operator_name: operatorEmail } : c));
  }, [selected, agent, operatorEmail]);

  const handleReabrir = useCallback(async () => {
    if (!selected) return;
    const res = await fetch(`${PESSOAS_BASE}/api/agentes/${agent}/status`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: "ativa", operator_name: null, operator_id: null }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
    }
    setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: "ativa", operator_name: null } : c));
  }, [selected, agent]);

  const handleEncerrar = useCallback(async () => {
    if (!selected) return;
    const res = await fetch(`${PESSOAS_BASE}/api/agentes/${agent}/status`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: "encerrada" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
    }
    setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: "encerrada" } : c));
  }, [selected, agent]);

  return (
    <>
      {/* Estilos responsivos injetados uma vez */}
      <style>{`
        .conv-panels {
          flex: 1;
          min-height: 0;
          display: flex;
          overflow: hidden;
        }
        .conv-list-panel {
          width: 280px;
          min-height: 0;
          flex-shrink: 0;
          border-right: 1px solid var(--border-strong, #3F3F46);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--surface);
        }
        .conv-chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: var(--bg, #0A0A0B);
        }
        .conv-session-panel {
          width: 220px;
          flex-shrink: 0;
          border-left: 1px solid var(--border-strong, #3F3F46);
          background: var(--surface);
          overflow-y: auto;
        }
        /* Ocultar painel de sessão em telas médias */
        @media (max-width: 960px) {
          .conv-session-panel { display: none; }
        }
        /* Lista mais estreita em telas médias */
        @media (max-width: 768px) {
          .conv-list-panel { width: 240px; }
        }
        /* Mobile: alternar entre lista e chat */
        @media (max-width: 600px) {
          .conv-list-panel { width: 100%; border-right: none; }
          .conv-list-panel.mobile-hidden { display: none; }
          .conv-chat-panel.mobile-hidden { display: none; }
          .mobile-back-btn { display: flex !important; }
        }
      `}</style>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Banner realtime offline */}
        {realtimeError && (
          <div role="alert" style={{
            padding: "6px 16px", background: "rgba(239,68,68,0.08)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444", fontSize: 12, textAlign: "center", flexShrink: 0,
          }}>
            Conexão em tempo real interrompida — recarregue para reconectar.
          </div>
        )}

        <div className="conv-panels">

          {/* Painel esquerdo — lista */}
          <div className={`conv-list-panel${showChatOnMobile ? " mobile-hidden" : ""}`}>
            <ConversasList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
              meta={meta}
              nameMap={nameMap}
            />
          </div>

          {/* Centro — chat ou estado vazio */}
          {selected ? (
            <div className={`conv-chat-panel${!showChatOnMobile ? " mobile-hidden" : ""}`}>
              <ChatView
                conv={selected}
                nameMap={nameMap}
                agent={agent}
                meta={meta}
                onAssumir={handleAssumir}
                onReabrir={handleReabrir}
                onEncerrar={handleEncerrar}
                operatorEmail={operatorEmail}
                onMobileBack={handleMobileBack}
                readOnly={readOnly}
                showChatOnMobile={showChatOnMobile}
              />
            </div>
          ) : (
            <div className={`conv-chat-panel${!showChatOnMobile ? " mobile-hidden" : ""}`}>
              <EmptyState meta={meta} />
            </div>
          )}

          {/* Painel direito — sessão (some em mobile/tablet) */}
          {selected && (
            <div className="conv-session-panel">
              <SessionInfo conv={selected} meta={meta} nameMap={nameMap} />
            </div>
          )}

        </div>
      </div>
    </>
  );
}
