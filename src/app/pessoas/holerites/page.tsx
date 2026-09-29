import { Suspense } from "react";
import { Receipt } from "lucide-react";

import { PayslipsTable } from "@/components/pessoas/PayslipsTable";
import { MeusHolerites } from "@/components/pessoas/MeusHolerites";
import { GenerateButton } from "@/components/pessoas/GenerateButton";
import { ExportDominioButton } from "@/components/pessoas/ExportDominioButton";
import { listPayslips, listMyPayslips } from "@/lib/pessoas/actions";
import { requireUser, isFounder, getUserTier } from "@kph/auth/server";
import { getCurrentUnit } from "@kph/auth/unit";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mes?: string; ano?: string }>;

export default async function HoleritesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const tier = getUserTier(user);
  const sp = await searchParams;

  const now = new Date();
  const mes = parseMes(sp.mes) ?? now.getMonth() + 1;
  const ano = parseAno(sp.ano) ?? now.getFullYear();

  // ── T1: colaborador vê apenas os próprios holerites ─────────────────────
  if (tier === "T1") {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Minha área · Holerites
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: "6px 0 0",
              color: "var(--text)",
              letterSpacing: -0.4,
            }}
          >
            Meus holerites
          </h1>
        </header>

        <Suspense fallback={<SkeletonList />}>
          <T1HoleritesSection />
        </Suspense>
      </div>
    );
  }

  // ── T3 / T4: visão da unit com tabela completa ───────────────────────────
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Pessoas · Holerites
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: "6px 0 0",
              color: "var(--text)",
              letterSpacing: -0.4,
            }}
          >
            Folha de pagamento
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <GenerateButton mes={mes} ano={ano} />
          {isFounder(user) && <ExportDominioButton mes={mes} ano={ano} />}
        </div>
      </header>

      <PeriodFilter mes={mes} ano={ano} />

      <Suspense fallback={<TableSkeleton />}>
        <PayslipsSection mes={mes} ano={ano} canApprove={isFounder(user)} />
      </Suspense>
    </div>
  );
}

// ── T1 section ────────────────────────────────────────────────────────────

async function T1HoleritesSection() {
  // Sem filtro — RLS t1_own retorna só os do colaborador autenticado
  const payslips = await listMyPayslips();

  const nome = payslips[0]?.nome ?? "Colaborador";
  const cargo = payslips[0]?.cargo ?? null;

  return <MeusHolerites nome={nome} cargo={cargo} payslips={payslips} />;
}

// ── T3/T4 section ─────────────────────────────────────────────────────────

async function PayslipsSection({
  mes,
  ano,
  canApprove,
}: {
  mes: number;
  ano: number;
  canApprove: boolean;
}) {
  const unit = await getCurrentUnit();
  if (!unit) return <NoUnitState />;

  const payslips = await listPayslips(unit.id, mes, ano);
  if (payslips.length === 0) {
    return <EmptyState mes={mes} ano={ano} unitName={unit.name} />;
  }

  const totalFolha = payslips.reduce((s, p) => s + parseFloat(p.liquido), 0);
  const gerados = payslips.length;
  const pendentes = payslips.filter((p) => p.status === "rascunho").length;
  const pagos = payslips.filter((p) => p.status === "pago").length;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, margin: "20px 0" }}>
        <HKpiCard label="Total líquido da folha" value={formatBRL(totalFolha)} accent />
        <HKpiCard label="Holerites gerados" value={gerados} />
        <HKpiCard label="Rascunhos / pendentes" value={pendentes} warn={pendentes > 0} />
        <HKpiCard label="Pagos" value={pagos} />
      </div>
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 14px" }}>
        Folha de{" "}
        <span style={{ color: "var(--text)", fontWeight: 600 }}>{monthLabel(mes)}/{ano}</span>{" "}
        — {unit.name} · {payslips.length} holerite{payslips.length === 1 ? "" : "s"}
      </p>
      <PayslipsTable data={payslips} isFounder={canApprove} />
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function HKpiCard({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ? "var(--brand)" : warn ? "#A16207" : "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function PeriodFilter({ mes, ano }: { mes: number; ano: number }) {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const anos = [ano - 1, ano, ano + 1];
  return (
    <form
      method="get"
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 6,
        padding: "10px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-3)", marginRight: 4 }}>
        Período
      </span>
      <select name="mes" defaultValue={mes} style={selectStyle}>
        {meses.map((label, i) => (
          <option key={i} value={i + 1}>{label}</option>
        ))}
      </select>
      <select name="ano" defaultValue={ano} style={selectStyle}>
        {anos.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <button
        type="submit"
        style={{ height: 28, padding: "0 12px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        Aplicar
      </button>
    </form>
  );
}

const selectStyle: React.CSSProperties = {
  height: 28,
  padding: "0 8px",
  background: "var(--background)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
};

function NoUnitState() {
  return (
    <div style={{ marginTop: 16, padding: "48px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Sem unidade selecionada</div>
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "8px 0 0" }}>
        Escolhe uma unidade no seletor da sidebar.
      </p>
    </div>
  );
}

function EmptyState({ mes, ano, unitName }: { mes: number; ano: number; unitName: string }) {
  return (
    <div style={{ marginTop: 16, padding: "56px 28px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Receipt size={20} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
        Sem holerites em {monthLabel(mes)}/{ano}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 380, lineHeight: 1.55, margin: 0 }}>
        Clica em <span style={{ color: "var(--brand)", fontWeight: 600 }}>Gerar holerites</span> pra criar rascunho pra todos os colaboradores ativos da {unitName}.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: 64, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, opacity: 0.7 }} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ marginTop: 16, border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ height: 48, background: "var(--surface-2)", borderRadius: 6, opacity: 0.7 }} />
      ))}
    </div>
  );
}

function monthLabel(m: number): string {
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[m - 1] ?? "";
}

function parseMes(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
}

function parseAno(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 2020 || n > 2100) return null;
  return n;
}
