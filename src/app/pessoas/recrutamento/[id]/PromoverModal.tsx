'use client'
import { useUnit } from '@kph/auth/context'

import { useState, useTransition, type CSSProperties } from 'react'
import { UserCheck } from 'lucide-react'
import { validateCpf, normalizeCpf } from '@/lib/cpf'
import { promoverCandidato, type PromoverResult } from '../actions'


function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const mInput: CSSProperties = {
  background: 'var(--bg, #0F0E0B)',
  border: '1px solid var(--border, #2A2825)',
  borderRadius: 7,
  padding: '9px 12px',
  fontSize: 14,
  color: 'var(--text, #F0EDE8)',
  outline: 'none',
  fontFamily: 'var(--font-body, sans-serif)',
  width: '100%',
  boxSizing: 'border-box',
}

function MField({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-3, #6B6760)',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>}
    </div>
  )
}

export function PromoverModal({
  candidateId,
  defaultUnitId,
  defaultFuncao,
  defaultSalario,
}: {
  candidateId: string
  defaultUnitId: string | null
  defaultFuncao: string | null
  defaultSalario: number | null
}) {
  const { units } = useUnit()
  const UNIT_OPTIONS = units.map(unit => ({ id: unit.id, nome: unit.name }))
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<PromoverResult | null>(null)

  const [unitId, setUnitId] = useState(defaultUnitId ?? UNIT_OPTIONS[0]?.id ?? '')
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)
  const [funcao, setFuncao] = useState(defaultFuncao ?? '')
  const [salario, setSalario] = useState(defaultSalario ? String(defaultSalario) : '')
  const [dataAdmissao, setDataAdmissao] = useState(todayIso())

  function handleCpfChange(v: string) {
    setCpf(v)
    setCpfError(null)
  }

  function handleCpfBlur() {
    if (!cpf) return
    const check = validateCpf(cpf)
    if (!check.valid) setCpfError(check.message ?? 'CPF inválido')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cpfCheck = validateCpf(cpf)
    if (!cpfCheck.valid) {
      setCpfError(cpfCheck.message ?? 'CPF inválido')
      return
    }
    if (!funcao.trim()) return
    const salarioNum = parseFloat(salario)
    if (isNaN(salarioNum) || salarioNum <= 0) return

    startTransition(async () => {
      const res = await promoverCandidato({
        candidateId,
        unitId,
        cpf: normalizeCpf(cpf),
        funcao: funcao.trim(),
        salarioBase: salarioNum,
        dataAdmissao,
      })
      setResult(res)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: '#166534',
          color: '#BBF7D0',
          border: '1px solid #15803D',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-body, sans-serif)',
        }}
      >
        <UserCheck size={15} />
        Promover a Colaborador
      </button>
    )
  }

  return (
    <div
      onClick={() => !isPending && setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #171714)',
          border: '1px solid var(--border, #2A2825)',
          borderRadius: 12,
          padding: 28,
          width: '100%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {result?.success ? (
          /* ── Sucesso ── */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#14532D',
                border: '2px solid #166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <h3
              style={{
                color: '#BBF7D0',
                fontFamily: 'var(--font-display, serif)',
                fontSize: 18,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Promovido com sucesso!
            </h3>
            <p
              style={{
                color: 'var(--text-3, #6B6760)',
                fontSize: 12,
                marginBottom: 20,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              Employee ID: {result.employeeId}
            </p>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '10px 20px',
                background: '#166534',
                color: '#BBF7D0',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Fechar
            </button>
          </div>
        ) : (
          /* ── Formulário ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display, serif)',
                  fontSize: 17,
                  color: 'var(--text, #F0EDE8)',
                  fontWeight: 700,
                }}
              >
                Promover a Colaborador
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3, #6B6760)',
                  cursor: 'pointer',
                  fontSize: 20,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Unidade */}
            <MField label="Unidade de destino *">
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                style={mInput}
                required
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </MField>

            {/* CPF */}
            <MField label="CPF *" error={cpfError}>
              <input
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                onBlur={handleCpfBlur}
                placeholder="000.000.000-00"
                required
                style={{ ...mInput, borderColor: cpfError ? '#EF4444' : undefined }}
              />
            </MField>

            {/* Cargo / Função */}
            <MField label="Cargo / Função *">
              <input
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                placeholder="Ex: Auxiliar de Cozinha"
                required
                style={mInput}
              />
            </MField>

            {/* Salário */}
            <MField label="Salário combinado (R$) *">
              <input
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="2500.00"
                required
                style={mInput}
              />
            </MField>

            {/* Data de admissão */}
            <MField label="Data de admissão *">
              <input
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                type="date"
                required
                style={mInput}
              />
            </MField>

            {/* Erro da RPC */}
            {result && !result.success && (
              <div
                style={{
                  background: '#2D1515',
                  border: '1px solid #7F1D1D',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#FCA5A5',
                  fontSize: 13,
                }}
              >
                {result.error}
              </div>
            )}

            {/* Aviso */}
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-3, #6B6760)',
                lineHeight: 1.5,
                margin: 0,
                borderLeft: '2px solid var(--border, #2A2825)',
                paddingLeft: 10,
              }}
            >
              Esta ação cria um registro de colaborador e vincula o candidato.
              Irreversível — confirme o CPF antes de prosseguir.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: '1px solid var(--border, #2A2825)',
                  borderRadius: 8,
                  color: 'var(--text-3, #6B6760)',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || !!cpfError}
                style={{
                  padding: '10px 18px',
                  background: isPending ? 'var(--text-3, #6B6760)' : '#166534',
                  color: '#BBF7D0',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isPending || cpfError ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {isPending ? 'Promovendo...' : 'Confirmar promoção'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
