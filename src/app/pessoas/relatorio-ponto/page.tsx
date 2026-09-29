import { redirect } from "next/navigation";
import { requireUser } from "@kph/auth/server";
import { getCurrentUnit } from "@kph/auth/unit";
import { listPontoPeriodos } from "@/lib/pessoas/ponto-mensal-actions";
import { PontoMensalClient } from "./client";
import { listAhgoraArchives } from "@/lib/pessoas/ahgora-archive";

export const dynamic = "force-dynamic";

export default async function RelatorioPontoPage() {
  await requireUser();
  const unit = await getCurrentUnit();
  if (!unit) redirect("/pessoas/colaboradores");

  const [periodos, archive] = await Promise.all([listPontoPeriodos(unit.id), listAhgoraArchives(unit.id)]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <PontoMensalClient
        key={unit.id}
        unitId={unit.id}
        unitName={unit.name}
        initialPeriodos={periodos}
        archivePanel={archive.files.length ? (
          <details style={{ marginBottom: 20, padding: 16, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Histórico Ahgora · {archive.files.length} arquivos</summary>
            <p style={{ color: "var(--text-2)", fontSize: 13, margin: "12px 0" }}>Totais e marcações preservados com a classificação da origem. A importação não confirma fechamento ou aprovação de horas. Competências em andamento contêm valores parciais.</p>
            <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
              {archive.files.map(file => <li key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
                <span>{file.tipo === "totais" ? "Totais mensais" : "Marcações de ponto"} · {file.consulta_inicio.split("-").reverse().join("/")} a {file.consulta_fim.split("-").reverse().join("/")}</span>
                <a href={`/pessoas/api/ponto/ahgora-arquivo?id=${file.id}`} style={{ color: "var(--brand)", padding: "8px 0" }}>Baixar dados completos (JSON)</a>
              </li>)}
            </ul>
          </details>
        ) : archive.error ? <p role="status" style={{ color: "var(--text-2)", marginBottom: 16 }}>{archive.error}</p> : null}
      />
    </div>
  );
}
