import type { ReactNode } from 'react'
import { PipouBrand } from '@/components/brand/PipouBrand'

export const metadata = {
  title: 'Trabalhe Conosco · Pipou Academy',
  description: 'Veja as vagas abertas do Cardoso e candidate-se.',
}

export default function VagasLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <header
          style={{
            borderBottom: '1px solid rgba(140,140,140,0.2)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--background)',
          }}
        >
          <PipouBrand width={148} />
          <span style={{ color: '#8C8C8C', fontSize: 13 }}>·</span>
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body), sans-serif',
              fontWeight: 400,
            }}
          >
            Trabalhe Conosco
          </span>
        </header>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
          {children}
        </main>
      </div>
    </>
  )
}
