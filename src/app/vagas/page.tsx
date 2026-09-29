import { createServiceClient } from '@kph/db/supabase/server'
import Link from 'next/link'
import type { ReactNode } from 'react'


const FORMA_LABEL: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  temporario: 'Temporário',
  estagio: 'Estágio',
  freelance: 'Freela',
}

type Vaga = {
  id: string
  cargo: string
  area: string | null
  unit_id: string
  units: { name: string } | null
  forma_contratacao: string | null
  horario_escala: string | null
}

async function getVagasAbertas(): Promise<Vaga[]> {
  const sb = createServiceClient()
  if (!sb) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb as any)
    .from('job_openings')
    .select('id, cargo, area, unit_id, forma_contratacao, horario_escala, units(name)')
    .eq('status', 'aberta')
    .eq('congelada', false)
    .eq('cancelada', false)
    .order('created_at', { ascending: false })
  return (data ?? []) as Vaga[]
}

export const dynamic = 'force-dynamic'

export default async function VagasPage() {
  const vagas = await getVagasAbertas()

  return (
    <div>
      <style>{`.vaga-card:hover { border-color: rgba(254,214,1,0.4) !important; }`}</style>
      <h1
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: '#F2F2F2',
          letterSpacing: -0.6,
          marginBottom: 6,
        }}
      >
        Vagas abertas
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontWeight: 400,
          color: '#8C8C8C',
          fontSize: 14,
          marginBottom: 32,
        }}
      >
        {vagas.length === 0
          ? 'Nenhuma vaga aberta no momento. Volte em breve.'
          : `${vagas.length} vaga${vagas.length > 1 ? 's' : ''} disponíve${vagas.length > 1 ? 'is' : 'l'}`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vagas.map((v) => (
          <Link key={v.id} href={`/vagas/${v.id}`} style={{ textDecoration: 'none' }}>
            <div
              className="vaga-card"
              style={{
                border: '1px solid rgba(140,140,140,0.25)',
                borderRadius: 10,
                padding: '18px 20px',
                background: '#222120',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#F2F2F2',
                    marginBottom: 6,
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  {v.cargo}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag>{v.units?.name ?? 'Unidade'}</Tag>
                  {v.area && <Tag>{v.area}</Tag>}
                  {v.forma_contratacao && (
                    <Tag>{FORMA_LABEL[v.forma_contratacao] ?? v.forma_contratacao}</Tag>
                  )}
                  {v.horario_escala && <Tag>{v.horario_escala}</Tag>}
                </div>
              </div>
              <span style={{ color: '#FCD616', fontSize: 18, flexShrink: 0 }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-body), sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        color: '#8C8C8C',
        background: '#231F20',
        border: '1px solid rgba(140,140,140,0.3)',
        borderRadius: 4,
        padding: '2px 7px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}
