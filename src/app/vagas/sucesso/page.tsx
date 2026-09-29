import Link from 'next/link'

export default async function VagasSucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string }>
}) {
  const { cargo } = await searchParams

  return (
    <div style={{ textAlign: 'center', paddingTop: 40, background: '#231F20' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(254,214,1,0.15)',
          border: '2px solid #FCD616',
          color: '#FCD616',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}
      >
        ✓
      </div>
      <h1
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: '#F2F2F2',
          marginBottom: 10,
        }}
      >
        Candidatura recebida!
      </h1>
      {cargo && (
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontWeight: 400,
            color: '#8C8C8C',
            fontSize: 15,
            marginBottom: 4,
          }}
        >
          Vaga:{' '}
          <strong style={{ fontFamily: "var(--font-body), sans-serif", fontWeight: 700, color: '#F2F2F2' }}>
            {cargo}
          </strong>
        </p>
      )}
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontWeight: 400,
          color: '#8C8C8C',
          fontSize: 14,
          maxWidth: 400,
          margin: '16px auto',
          lineHeight: 1.6,
        }}
      >
        Nossa equipe vai analisar seu perfil e entrar em contato caso haja compatibilidade.
      </p>
      <Link
        href="/vagas"
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '12px 24px',
          background: '#FCD616',
          color: '#231F20',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        Ver outras vagas
      </Link>
    </div>
  )
}
