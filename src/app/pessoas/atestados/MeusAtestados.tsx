"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@kph/ui/button";
import { uploadMySickLeave } from "./actions";
import type { SickLeave } from "@kph/db/types/pessoas";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function MeusAtestados({
  nome,
  atestados,
}: {
  nome: string;
  atestados: SickLeave[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <UploadForm />

      {atestados.length === 0 ? (
        <EmptyState nome={nome} />
      ) : (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Histórico · {atestados.length} atestado{atestados.length !== 1 ? "s" : ""}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
            {atestados.map((a, idx) => (
              <AtestadoRow key={a.id} a={a} first={idx === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AtestadoRow({ a, first }: { a: SickLeave; first: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderTop: first ? "none" : "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--surface-2)",
          color: "var(--text-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
          {formatDate(a.data_inicio)}
          {a.data_fim && a.data_fim !== a.data_inicio ? ` → ${formatDate(a.data_fim)}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", gap: 10 }}>
          {a.total_dias != null && <span>{a.total_dias} dia{a.total_dias !== 1 ? "s" : ""}</span>}
          {a.medico && <span>Dr(a). {a.medico}</span>}
          {a.cid && <span>CID: {a.cid}</span>}
        </div>
      </div>

      {a.documento_ref && (
        <span
          style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(34,197,94,0.12)", color: "#15803D", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
        >
          <CheckCircle2 size={11} />
          Enviado
        </span>
      )}
    </div>
  );
}

function UploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileName(f?.name ?? null);
    setError(null);
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      setError(null);
      const res = await uploadMySickLeave(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setFileName(null);
      form.reset();
      router.refresh();
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 20px",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
        Enviar novo atestado
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Arquivo */}
        <div>
          <label style={labelStyle}>Arquivo (PDF, JPG, PNG)</label>
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 8,
              padding: "14px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--background)",
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Upload size={18} style={{ color: "var(--text-3)" }} />
              <span style={{ fontSize: 12, color: fileName ? "var(--text)" : "var(--text-3)" }}>
                {fileName ?? "Clique para selecionar o arquivo"}
              </span>
            </div>
          </div>
        </div>

        {/* Datas e campos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Data do atestado *</label>
            <input type="date" name="data_inicio" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Data fim (se mais de 1 dia)</label>
            <input type="date" name="data_fim" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Médico</label>
            <input type="text" name="medico" placeholder="Nome do médico" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CID (opcional)</label>
            <input type="text" name="cid" placeholder="ex: J06" style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(239,68,68,0.10)", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(34,197,94,0.10)", borderRadius: 8, fontSize: 12, color: "#15803D" }}>
            <CheckCircle2 size={14} />
            Atestado enviado com sucesso!
          </div>
        )}

        <Button type="submit" disabled={isPending} style={{ alignSelf: "flex-end" }}>
          {isPending ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Upload size={14} className="mr-2" />
              Enviar atestado
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-3)",
  marginBottom: 4,
  letterSpacing: 0.3,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 10px",
  background: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 13,
  color: "var(--text)",
  boxSizing: "border-box",
};

function EmptyState({ nome }: { nome: string }) {
  return (
    <div style={{ padding: "40px 28px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FileText size={20} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Nenhum atestado registrado</div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 320, lineHeight: 1.55, margin: 0 }}>
        Envie seu atestado pelo formulário acima. Ele ficará registrado aqui para o RH.
      </p>
    </div>
  );
}
