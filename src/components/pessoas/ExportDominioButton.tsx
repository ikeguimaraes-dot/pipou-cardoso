"use client"
import { useState } from "react"
import { exportTxtDominio } from "@/lib/pessoas/payroll-dominio-actions"

// periodoId: UUID do payroll_fechamento_periodo (passado pelo ContabilidadeClient)
// mes/ano: usado pelo Holerites — action faz lookup do periodo_id internamente
type Props =
  | { periodoId: string; competencia: string; mes?: undefined; ano?: undefined }
  | { mes: number; ano: number; periodoId?: undefined; competencia?: undefined }

export function ExportDominioButton(props: Props) {
  const { periodoId = null, competencia: competenciaProp } = props as any
  const competencia: string =
    competenciaProp ??
    `${String((props as any).mes).padStart(2, "0")}/${(props as any).ano}`

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      const result = await exportTxtDominio(periodoId, competencia)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const blob = new Blob([result.txt], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Erro inesperado ao exportar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleExport}
        disabled={loading}
        title="Exportar TXT Domínio para a competência selecionada"
        style={{
          height: 34,
          padding: "0 14px",
          background: "var(--surface)",
          color: loading ? "var(--text-3)" : "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          transition: "opacity 0.15s",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>↓</span>
        {loading ? "Gerando…" : "TXT Domínio"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: 280,
            maxWidth: 420,
            padding: "10px 12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            fontSize: 12,
            color: "#B91C1C",
            lineHeight: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Exportação bloqueada</div>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 11,
              color: "#B91C1C",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}
