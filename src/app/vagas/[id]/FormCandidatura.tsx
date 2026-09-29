'use client'

import { useTransition, useState, useRef, type ReactNode, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { submitCandidatura } from '../actions'

const ESCOLARIDADE_OPTIONS = [
  { value: 'analfabeto', label: 'Não alfabetizado' },
  { value: 'fundamental_5_incompleto', label: 'Fund. Incompleto (até 5º ano)' },
  { value: 'fundamental_5_completo', label: 'Fund. Completo (até 5º ano)' },
  { value: 'fundamental_6_9', label: 'Fund. Incompleto (6º ao 9º ano)' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Ensino Médio Incompleto' },
  { value: 'medio_completo', label: 'Ensino Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
]

const TURNOS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral (abertura ao fechamento)' },
]

const inputStyle: CSSProperties = {
  background: '#222120',
  border: '1px solid rgba(140,140,140,0.3)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  color: '#F2F2F2',
  outline: 'none',
  fontFamily: "var(--font-body), sans-serif",
  width: '100%',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: '#8C8C8C',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function FormCandidatura({
  jobOpeningId,
  unitId,
  cargo,
}: {
  jobOpeningId: string
  unitId: string
  cargo: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await submitCandidatura(formData)
      if (!result.success) {
        setError(result.error)
      } else {
        router.push(`/vagas/sucesso?cargo=${encodeURIComponent(cargo)}`)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name="job_opening_id" value={jobOpeningId} />
      <input type="hidden" name="unit_id" value={unitId} />

      {/* Nome */}
      <Field label="Nome completo *">
        <input
          name="full_name"
          required
          placeholder="Seu nome completo"
          style={inputStyle}
        />
      </Field>

      {/* Email + Telefone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="E-mail">
          <input name="email" type="email" placeholder="seu@email.com" style={inputStyle} />
        </Field>
        <Field label="WhatsApp / Telefone">
          <input name="phone" type="tel" placeholder="(11) 99999-9999" style={inputStyle} />
        </Field>
      </div>

      {/* Cidade + Bairro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Cidade">
          <input name="cidade" placeholder="São Paulo" style={inputStyle} />
        </Field>
        <Field label="Bairro">
          <input name="bairro" placeholder="Itaim Bibi" style={inputStyle} />
        </Field>
      </div>

      {/* Pretensão + Disponibilidade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Pretensão salarial (R$)">
          <input
            name="pretensao_salarial"
            type="number"
            min="0"
            step="0.01"
            placeholder="2500"
            style={inputStyle}
          />
        </Field>
        <Field label="Disponibilidade de início">
          <input name="disponibilidade_inicio" type="date" style={inputStyle} />
        </Field>
      </div>

      {/* Escolaridade */}
      <Field label="Escolaridade">
        <select name="escolaridade_nivel" style={inputStyle}>
          <option value="">Selecione...</option>
          {ESCOLARIDADE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Turnos */}
      <Field label="Turnos disponíveis">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 4 }}>
          {TURNOS.map((t) => (
            <label
              key={t.value}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input type="checkbox" name="turnos_disponiveis" value={t.value} />
              <span
                style={{
                  fontFamily: "var(--font-body), sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: '#8C8C8C',
                }}
              >
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </Field>

      {/* CV */}
      <Field label="Currículo (PDF, DOC, DOCX ou imagem — máx. 10MB)">
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,image/jpeg,image/png"
          style={{ ...inputStyle, padding: '8px 12px' }}
        />
      </Field>

      {/* Erro */}
      {error && (
        <div
          style={{
            background: 'rgba(127,29,29,0.3)',
            border: '1px solid rgba(127,29,29,0.8)',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#FCA5A5',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          background: isPending ? '#8C8C8C' : '#FCD616',
          color: '#231F20',
          border: 'none',
          borderRadius: 8,
          padding: '14px 24px',
          fontSize: 15,
          fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: "var(--font-body), sans-serif",
          letterSpacing: 0.3,
          transition: 'background 0.15s',
        }}
      >
        {isPending ? 'Enviando candidatura...' : 'Enviar candidatura'}
      </button>
    </form>
  )
}
