import { Suspense } from "react";
import { requireRole } from "@kph/auth/server";
import { getAccessRequests } from "@/lib/pessoas/access-requests";
import { AprovacoesList } from "./AprovacoesList";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AprovacoesPage() {
  // Restrito a T2A, T3, T4 — via roles do sistema KPH (founders/gm/pessoas equivalem a esses tiers)
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            color: "var(--text-3, #71717A)",
            marginBottom: 8,
          }}
        >
          Pessoas · Aprovações
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(212,165,116,0.1)",
              color: "var(--brand, #D4A574)",
            }}
          >
            <ShieldCheck size={18} />
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text, #E5E5E7)",
              letterSpacing: -0.5,
            }}
          >
            Aprovações de Acesso
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2, #A1A1AA)", lineHeight: 1.6 }}>
          Solicitações de acesso ao KPH OS enviadas pelos colaboradores.
          Aprovações criam conta no sistema e enviam link de senha por e-mail.
        </p>
      </header>

      <Suspense fallback={<LoadingState />}>
        <AprovacoesSection />
      </Suspense>
    </div>
  );
}

async function AprovacoesSection() {
  const [pending, approved, rejected] = await Promise.all([
    getAccessRequests("pending"),
    getAccessRequests("approved"),
    getAccessRequests("rejected"),
  ]);

  return (
    <AprovacoesList
      initial={{ pending, approved, rejected }}
    />
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--text-3, #71717A)",
        fontSize: 13,
        background: "var(--surface, #131316)",
        border: "1px solid var(--border, #27272A)",
        borderRadius: 12,
      }}
    >
      Carregando solicitações…
    </div>
  );
}
