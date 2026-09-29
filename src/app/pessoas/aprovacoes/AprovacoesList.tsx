"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getBrowserClient } from "@kph/db/supabase/client";
import {
  approveAccessRequest,
  rejectAccessRequest,
  type AccessRequestWithEmployee,
} from "@/lib/pessoas/access-requests";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  T1: "T1 · Colaborador",
  T2A: "T2A · Gerência",
  T2B: "T2B · Liderança",
  T3: "T3 · Corporativo",
  T4: "T4 · Diretoria",
};

const TIER_COLOR: Record<string, string> = {
  T1: "#94A3B8",
  T2A: "#60A5FA",
  T2B: "#818CF8",
  T3: "#C9A96E",
  T4: "#F59E0B",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// Modal: rejeição
// ─────────────────────────────────────────────────────────────
function RejectModal({
  request,
  onClose,
  onDone,
}: {
  request: AccessRequestWithEmployee;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReject() {
    setError("");
    startTransition(async () => {
      const res = await rejectAccessRequest(request.id, reason);
      if (res.ok) {
        onDone(request.id);
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rejeitar solicitação"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface, #131316)",
          border: "1px solid var(--border, #27272A)",
          borderRadius: 16,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text, #E5E5E7)" }}>
          Rejeitar solicitação
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2, #A1A1AA)" }}>
          Você está rejeitando o acesso de{" "}
          <strong style={{ color: "var(--text, #E5E5E7)" }}>
            {request.employee.nome} {request.employee.sobrenome}
          </strong>
          .
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="reject-reason"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2, #A1A1AA)" }}
          >
            Motivo <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Informe o motivo da rejeição…"
            style={{
              background: "var(--surface-2, #1A1A1E)",
              border: "1px solid var(--border, #27272A)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              color: "var(--text, #E5E5E7)",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#EF4444")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border, #27272A)")}
          />
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={pending}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--border, #27272A)",
              background: "transparent",
              color: "var(--text-2, #A1A1AA)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleReject}
            disabled={pending || !reason.trim()}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: pending || !reason.trim() ? "var(--border, #27272A)" : "#EF4444",
              color: pending || !reason.trim() ? "var(--text-3, #71717A)" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: pending || !reason.trim() ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Rejeitando…" : "Confirmar rejeição"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: aprovação
// ─────────────────────────────────────────────────────────────
function ApproveModal({
  request,
  onClose,
  onDone,
}: {
  request: AccessRequestWithEmployee;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError("");
    startTransition(async () => {
      const res = await approveAccessRequest(request.id);
      if (res.ok) {
        onDone(request.id);
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aprovar solicitação"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface, #131316)",
          border: "1px solid var(--border, #27272A)",
          borderRadius: 16,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text, #E5E5E7)" }}>
          Aprovar acesso
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2, #A1A1AA)", lineHeight: 1.6 }}>
          Isso criará uma conta para{" "}
          <strong style={{ color: "var(--text, #E5E5E7)" }}>
            {request.employee.nome} {request.employee.sobrenome}
          </strong>{" "}
          no e-mail <strong style={{ color: "var(--text, #E5E5E7)" }}>{request.email}</strong>.
          <br />O colaborador receberá um link para definir a senha.
        </p>
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={pending}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--border, #27272A)",
              background: "transparent",
              color: "var(--text-2, #A1A1AA)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleApprove}
            disabled={pending}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: pending ? "var(--border, #27272A)" : "#22C55E",
              color: pending ? "var(--text-3, #71717A)" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Aprovando…" : "Confirmar aprovação"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────────────
function RequestRow({
  req,
  onApprove,
  onReject,
  showActions,
}: {
  req: AccessRequestWithEmployee;
  onApprove: (r: AccessRequestWithEmployee) => void;
  onReject: (r: AccessRequestWithEmployee) => void;
  showActions: boolean;
}) {
  const tier = req.employee.tier ?? "T1";
  const tierColor = TIER_COLOR[tier] ?? "#94A3B8";

  return (
    <tr style={{ borderBottom: "1px solid var(--border, #27272A)" }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text, #E5E5E7)" }}>
          {req.employee.nome} {req.employee.sobrenome}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3, #71717A)", marginTop: 2 }}>
          {req.email}
        </div>
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-2, #A1A1AA)" }}>
        {req.employee.funcao}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-2, #A1A1AA)" }}>
        {req.employee.unit_name ?? "—"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: tierColor,
            background: `${tierColor}18`,
            padding: "3px 8px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {TIER_LABEL[tier] ?? tier}
        </span>
      </td>
      <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-3, #71717A)", whiteSpace: "nowrap" }}>
        {formatDate(req.created_at)}
      </td>
      {showActions && (
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onApprove(req)}
              aria-label={`Aprovar acesso de ${req.employee.nome}`}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.08)",
                color: "#22C55E",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Aprovar
            </button>
            <button
              onClick={() => onReject(req)}
              aria-label={`Rejeitar acesso de ${req.employee.nome}`}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Rejeitar
            </button>
          </div>
        </td>
      )}
      {!showActions && (
        <td style={{ padding: "14px 16px" }}>
          {req.status === "rejected" && req.rejected_reason && (
            <span style={{ fontSize: 12, color: "var(--text-3, #71717A)" }}>
              {req.rejected_reason}
            </span>
          )}
          {req.status === "approved" && req.approved_at && (
            <span style={{ fontSize: 12, color: "#22C55E" }}>
              Aprovado em {formatDate(req.approved_at)}
            </span>
          )}
        </td>
      )}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
type Tab = "pending" | "approved" | "rejected";

export function AprovacoesList({
  initial,
}: {
  initial: {
    pending: AccessRequestWithEmployee[];
    approved: AccessRequestWithEmployee[];
    rejected: AccessRequestWithEmployee[];
  };
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [data, setData] = useState(initial);
  const [approveTarget, setApproveTarget] = useState<AccessRequestWithEmployee | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccessRequestWithEmployee | null>(null);

  // Realtime subscription
  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb) return;

    const channel = sb
      .channel("access_requests_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "access_requests" },
        (payload) => {
          // Reload on any change: optimistic approach — refresh via server action would need router
          // Here we update local state based on payload
          const changed = payload.new as AccessRequestWithEmployee | null;
          const oldId = (payload.old as { id?: string })?.id;

          if (payload.eventType === "INSERT" && changed) {
            setData((prev) => ({
              ...prev,
              pending: [changed, ...prev.pending],
            }));
          } else if (payload.eventType === "UPDATE" && changed && oldId) {
            // Move from current status bucket to new one
            setData((prev) => {
              const removeFrom = (arr: AccessRequestWithEmployee[]) =>
                arr.filter((r) => r.id !== oldId);
              const newStatus = (changed as { status?: string }).status as Tab | undefined;
              return {
                pending: newStatus === "pending"
                  ? [changed, ...removeFrom(prev.pending)]
                  : removeFrom(prev.pending),
                approved: newStatus === "approved"
                  ? [changed, ...removeFrom(prev.approved)]
                  : removeFrom(prev.approved),
                rejected: newStatus === "rejected"
                  ? [changed, ...removeFrom(prev.rejected)]
                  : removeFrom(prev.rejected),
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const handleDone = useCallback((id: string) => {
    // Remove from pending — Realtime UPDATE event will place it in right bucket
    setData((prev) => ({
      ...prev,
      pending: prev.pending.filter((r) => r.id !== id),
    }));
  }, []);

  const current = data[tab];
  const pendingCount = data.pending.length;

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: "pending", label: `Pendentes${pendingCount > 0 ? ` · ${pendingCount}` : ""}` },
    { key: "approved", label: "Aprovados" },
    { key: "rejected", label: "Rejeitados" },
  ];

  return (
    <>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border, #27272A)",
          marginBottom: 24,
        }}
      >
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-selected={tab === key}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: tab === key ? 700 : 500,
              color: tab === key ? "var(--brand, #D4A574)" : "var(--text-3, #71717A)",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === key ? "var(--brand, #D4A574)" : "transparent"}`,
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {current.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--text-3, #71717A)",
            fontSize: 13,
            background: "var(--surface, #131316)",
            border: "1px dashed var(--border, #27272A)",
            borderRadius: 12,
          }}
        >
          {tab === "pending"
            ? "Nenhuma solicitação pendente. "
            : tab === "approved"
              ? "Nenhum acesso aprovado ainda."
              : "Nenhuma solicitação rejeitada."}
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface, #131316)",
            border: "1px solid var(--border, #27272A)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border, #27272A)" }}>
                {["Colaborador", "Cargo", "Unidade", "Tier", "Data", tab === "pending" ? "Ações" : "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--text-3, #71717A)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {current.map((req) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  showActions={tab === "pending"}
                  onApprove={setApproveTarget}
                  onReject={setRejectTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={handleDone}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}
