import { createServiceClient } from '@kph/db/supabase/server'
import { notFound } from 'next/navigation'
import { FormCandidatura } from './FormCandidatura'


type VagaDetalhe = {
  id: string
  cargo: string
  area: string | null
  unit_id: string
  units: { name: string } | null
  forma_contratacao: string | null
  horario_escala: string | null
  observacoes: string | null
}

async function getVaga(id: string): Promise<VagaDetalhe | null> {
  const sb = createServiceClient()
  if (!sb) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb as any)
    .from('job_openings')
    .select('id, cargo, area, unit_id, forma_contratacao, horario_escala, observacoes, units(name)')
    .eq('id', id)
    .eq('status', 'aberta')
    .eq('congelada', false)
    .eq('cancelada', false)
    .single()
  return data as VagaDetalhe | null
}

export const dynamic = 'force-dynamic'

export default async function VagaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vaga = await getVaga(id)
  if (!vaga) notFound()

  const unitNome = vaga.units?.name ?? 'Unidade'

  return (
    <div>
      {/* Breadcrumb */}
      <div
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontWeight: 400,
          fontSize: 12,
          color: '#8C8C8C',
          marginBottom: 20,
        }}
      >
        <a href="/vagas" style={{ color: '#8C8C8C', textDecoration: 'none' }}>
          ← Todas as vagas
        </a>
      </div>

      {/* Header da vaga */}
      <h1
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: '#F2F2F2',
          letterSpacing: -0.5,
          marginBottom: 6,
        }}
      >
        {vaga.cargo}
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontWeight: 400,
          color: '#8C8C8C',
          fontSize: 14,
          marginBottom: 4,
        }}
      >
        {unitNome}
        {vaga.area ? ` · ${vaga.area}` : ''}
        {vaga.forma_contratacao ? ` · ${vaga.forma_contratacao}` : ''}
        {vaga.horario_escala ? ` · ${vaga.horario_escala}` : ''}
      </p>
      {vaga.observacoes && (
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontWeight: 400,
            color: 'rgba(242,242,242,0.8)',
            fontSize: 14,
            marginTop: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {vaga.observacoes}
        </p>
      )}

      <hr
        style={{
          border: 'none',
          borderTop: '1px solid rgba(140,140,140,0.2)',
          margin: '32px 0',
        }}
      />

      <h2
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: '#F2F2F2',
          marginBottom: 24,
        }}
      >
        Candidate-se
      </h2>
      <FormCandidatura jobOpeningId={vaga.id} unitId={vaga.unit_id} cargo={vaga.cargo} />
    </div>
  )
}
