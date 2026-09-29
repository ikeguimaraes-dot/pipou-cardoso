"use client";

/**
 * AgentesKPH.jsx
 * ─────────────────────────────────────────────────────────────────
 * Chat flutuante MAYA + THEO para o KPH-OS /pessoas
 *
 * INSTALAÇÃO:
 *   1. Coloque este arquivo em: src/components/pessoas/AgentesKPH.jsx
 *   2. No layout do módulo /pessoas (ex: src/app/pessoas/layout.jsx),
 *      importe e adicione <AgentesKPH /> no final do JSX.
 *
 * VARIÁVEIS DE AMBIENTE (.env.local):
 *   NEXT_PUBLIC_MAYA_URL=https://<seu-railway-maya>.up.railway.app
 *   NEXT_PUBLIC_THEO_URL=https://<seu-railway-theo>.up.railway.app
 *
 * O session_id é gerado uma vez por sessão de browser e armazenado
 * em sessionStorage — sem login extra necessário.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── URLs dos backends (Railway) ─────────────────────────────────
const MAYA_URL = process.env.NEXT_PUBLIC_MAYA_URL ?? "";
const THEO_URL = process.env.NEXT_PUBLIC_THEO_URL ?? "";

// ─── Helpers ─────────────────────────────────────────────────────
function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("kph_agent_session");
  if (!id) {
    id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("kph_agent_session", id);
  }
  return id;
}

const AGENTS = {
  maya: {
    key: "maya",
    name: "Maya",
    role: "R&S · Recrutamento",
    url: MAYA_URL,
    color: "#C9A96E",
    colorDim: "rgba(201,169,110,0.12)",
    colorBorder: "rgba(201,169,110,0.25)",
    avatar: "M",
    greeting:
      "Olá! Sou a Maya, responsável por Recrutamento & Seleção do Grupo KPH. Como posso ajudar?",
  },
  theo: {
    key: "theo",
    name: "Theo",
    role: "SAC · RH Interno",
    url: THEO_URL,
    color: "#7EB8C9",
    colorDim: "rgba(126,184,201,0.12)",
    colorBorder: "rgba(126,184,201,0.25)",
    avatar: "T",
    greeting:
      "Recebi. Sou o Theo, helpdesk interno do RH. Me conta o que você precisa.",
  },
};

// ─── Subcomponentes ───────────────────────────────────────────────

function TypingIndicator({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            opacity: 0.7,
            animation: `kph-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Message({ msg, agentColor }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 8,
        animation: "kph-fadein 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "9px 13px",
          borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
          background: isUser
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.04)",
          border: isUser
            ? "1px solid rgba(255,255,255,0.1)"
            : `1px solid ${agentColor}30`,
          color: isUser ? "#E8E4DC" : "#D4D0C8",
          fontSize: 13,
          lineHeight: 1.55,
          letterSpacing: "0.01em",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
            marginTop: 4,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {msg.time}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ agent, onClose }) {
  const sessionId = getSessionId();
  const [messages, setMessages] = useState([
    { id: 0, role: "assistant", content: agent.greeting, time: now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", content: text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!agent.url) throw new Error("Agente não configurado para este cliente.");
      const res = await fetch(`${agent.url}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.reply, time: now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Tive um problema de conexão. Pode tentar de novo?",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agent, sessionId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${agent.colorBorder}`,
          background: agent.colorDim,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}20)`,
            border: `1.5px solid ${agent.color}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: agent.color,
            fontFamily: "var(--font-heading)",
            flexShrink: 0,
          }}
        >
          {agent.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#E8E4DC",
              fontFamily: "var(--font-heading)",
              letterSpacing: "0.02em",
            }}
          >
            {agent.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: agent.color,
              opacity: 0.85,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', 'Courier New', monospace",
            }}
          >
            {agent.role}
          </div>
        </div>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#4ADE80",
            boxShadow: "0 0 6px #4ADE8088",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 12px 8px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} agentColor={agent.color} />
        ))}
        {loading && <TypingIndicator color={agent.color} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Fale com ${agent.name}…`}
          rows={1}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${input ? agent.color + "50" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10,
            padding: "8px 12px",
            color: "#E8E4DC",
            fontSize: 13,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
            maxHeight: 100,
            overflowY: "auto",
            transition: "border-color 0.2s",
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background:
              input.trim() && !loading
                ? `linear-gradient(135deg, ${agent.color}, ${agent.color}99)`
                : "rgba(255,255,255,0.06)",
            color: input.trim() && !loading ? "#0A0A0B" : "rgba(255,255,255,0.2)",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "flex-end",
            transition: "all 0.2s",
            fontSize: 16,
          }}
          aria-label="Enviar"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
export default function AgentesKPH() {
  const [open, setOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState("maya");
  const agent = AGENTS[activeAgent];

  // Escuta evento externo para abrir o chat em um agente específico
  useEffect(() => {
    const handler = (e) => {
      const agentKey = e.detail?.agent;
      if (agentKey && AGENTS[agentKey]) {
        setActiveAgent(agentKey);
        setOpen(true);
      }
    };
    window.addEventListener("kph-open-agent", handler);
    return () => window.removeEventListener("kph-open-agent", handler);
  }, []);

  return (
    <>
      {/* ─── CSS Keyframes (injetado uma vez) ─── */}
      <style>{`
        @keyframes kph-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes kph-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes kph-panel-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kph-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(201,169,110,0); }
        }
      `}</style>

      {/* ─── Painel flutuante ─── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            width: 360,
            height: 520,
            borderRadius: 18,
            background: "rgba(14,14,16,0.97)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${agent.colorBorder}`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9998,
            animation: "kph-panel-in 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            {Object.values(AGENTS).map((ag) => (
              <button
                key={ag.key}
                onClick={() => setActiveAgent(ag.key)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "none",
                  border: "none",
                  borderBottom: activeAgent === ag.key
                    ? `2px solid ${ag.color}`
                    : "2px solid transparent",
                  color: activeAgent === ag.key ? ag.color : "rgba(255,255,255,0.35)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Mono', monospace",
                  transition: "all 0.18s",
                }}
              >
                {ag.name}
              </button>
            ))}
            {/* Fechar */}
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "10px 14px",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* Chat ativo */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ChatPanel key={activeAgent} agent={agent} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* ─── Botão flutuante ─── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar agentes" : "Abrir MAYA & THEO"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `1.5px solid ${open ? "rgba(255,255,255,0.15)" : agent.colorBorder}`,
          background: open
            ? "rgba(30,30,32,0.95)"
            : `linear-gradient(135deg, rgba(14,14,16,0.98), rgba(30,28,24,0.98))`,
          backdropFilter: "blur(16px)",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${agent.color}20`,
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          animation: !open ? "kph-pulse 3s ease-in-out infinite" : "none",
          transform: open ? "scale(0.92)" : "scale(1)",
        }}
      >
        {open ? (
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 20, lineHeight: 1 }}>×</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: AGENTS.maya.color,
              letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1,
            }}>M</span>
            <div style={{
              width: 16,
              height: 1,
              background: "rgba(255,255,255,0.1)",
            }} />
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: AGENTS.theo.color,
              letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1,
            }}>T</span>
          </div>
        )}
      </button>
    </>
  );
}

// ─── Util ─────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
