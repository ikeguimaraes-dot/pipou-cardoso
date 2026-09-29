"use client";

import { useState, useRef, useCallback } from "react";
import { submitAccessRequest } from "@/lib/pessoas/access-requests";
import { PipouBrand } from "@/components/brand/PipouBrand";

// ─────────────────────────────────────────────────────────────
// CPF mask helper
// ─────────────────────────────────────────────────────────────
function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await submitAccessRequest({ email, cpf });
      if (res.ok) {
        setResult({ ok: true, message: res.data.message });
        setEmail("");
        setCpf("");
        formRef.current?.reset();
      } else {
        setResult({ ok: false, message: res.error });
      }
    } catch {
      setResult({ ok: false, message: "Erro inesperado. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #0C0C0E)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Logo / brand */}
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 24 }}>
            <PipouBrand width={190} className="pipou-brand-center" />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text, #E5E5E7)",
              letterSpacing: -0.4,
            }}
          >
            Solicitar acesso
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              color: "var(--text-3, #71717A)",
              lineHeight: 1.5,
            }}
          >
            Confirme seus dados cadastrais para solicitar acesso ao sistema.
          </p>
        </div>

        {/* Form card */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            background: "var(--surface, #131316)",
            border: "1px solid var(--border, #27272A)",
            borderRadius: 16,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* E-mail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="email"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-2, #A1A1AA)",
                letterSpacing: "0.04em",
              }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                background: "var(--surface-2, #1A1A1E)",
                border: "1px solid var(--border, #27272A)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--text, #E5E5E7)",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand, #D4A574)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border, #27272A)")}
            />
          </div>

          {/* CPF */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="cpf"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-2, #A1A1AA)",
                letterSpacing: "0.04em",
              }}
            >
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              required
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              disabled={loading}
              maxLength={14}
              style={{
                background: "var(--surface-2, #1A1A1E)",
                border: "1px solid var(--border, #27272A)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--text, #E5E5E7)",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                letterSpacing: "0.06em",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand, #D4A574)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border, #27272A)")}
            />
          </div>

          {/* Feedback */}
          {result && (
            <div
              role="alert"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.5,
                background: result.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${result.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: result.ok ? "#22C55E" : "#EF4444",
              }}
            >
              {result.message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "var(--border, #27272A)" : "var(--brand, #D4A574)",
              color: loading ? "var(--text-3, #71717A)" : "#0C0C0E",
              border: "none",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--brand-strong)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--brand, #D4A574)";
            }}
          >
            {loading ? "Enviando…" : "Solicitar acesso"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-3, #71717A)",
            lineHeight: 1.5,
          }}
        >
          Seus dados são verificados pelo RH do Cardoso.
          <br />
          Dúvidas? Fale com o seu gerente.
        </p>
      </div>
    </div>
  );
}
