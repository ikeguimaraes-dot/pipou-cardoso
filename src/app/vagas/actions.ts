import 'server-only'

import { createServiceClient } from '@kph/db/supabase/server'

type SubmitResult =
  | { success: true; candidateId: string }
  | { success: false; error: string }

export async function submitCandidatura(formData: FormData): Promise<SubmitResult> {
  const sb = createServiceClient()
  if (!sb) return { success: false, error: 'Erro de configuração interna.' }

  const fullName = (formData.get('full_name') as string | null)?.trim()
  if (!fullName) return { success: false, error: 'Nome completo é obrigatório.' }

  const jobOpeningId = formData.get('job_opening_id') as string | null
  const unitId = formData.get('unit_id') as string | null
  if (!jobOpeningId || !unitId) return { success: false, error: 'Vaga inválida.' }

  const { data: opening } = await sb.from('job_openings').select('id, unit_id, status').eq('id', jobOpeningId).maybeSingle()
  if (!opening || opening.unit_id !== unitId || opening.status !== 'aberta') return { success: false, error: 'Vaga indisponível.' }

  const pretensaoRaw = formData.get('pretensao_salarial') as string | null
  const pretensaoSalarial =
    pretensaoRaw && pretensaoRaw !== '' ? parseFloat(pretensaoRaw) : null

  const disponibilidade = (formData.get('disponibilidade_inicio') as string | null) || null

  const turnos = formData.getAll('turnos_disponiveis') as string[]

  // Gera ID antecipado para usar no path do CV
  const candidateId = crypto.randomUUID()

  // Upload de CV (opcional)
  let cvStoragePath: string | null = null
  const cvFile = formData.get('cv') as File | null
  if (cvFile && cvFile.size > 0) {
    if (cvFile.size > 10485760 || !['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(cvFile.type)) return { success: false, error: 'Envie um currículo PDF ou Word de até 10 MB.' }
    const ext = cvFile.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const path = `${candidateId}/cv.${ext}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (sb as any).storage
      .from('candidate-cvs')
      .upload(path, cvFile, { contentType: cvFile.type, upsert: false })
    if (uploadError) {
      return { success: false, error: 'Erro no upload do currículo. Tente novamente.' }
    }
    cvStoragePath = path
  }

  // INSERT do candidato
  // Notas sobre campos omitidos intencionalmente:
  //   access_code  → DEFAULT gen_random_uuid()::text (migration 20260623000001)
  //   interview_status → nullable no tipo Insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (sb as any).from('candidates').insert({
    id: candidateId,
    full_name: fullName,
    email: (formData.get('email') as string | null)?.trim() || null,
    phone: (formData.get('phone') as string | null)?.trim() || null,
    cidade: (formData.get('cidade') as string | null)?.trim() || null,
    bairro: (formData.get('bairro') as string | null)?.trim() || null,
    pretensao_salarial: pretensaoSalarial,
    disponibilidade_inicio: disponibilidade || null,
    turnos_disponiveis: turnos.length > 0 ? turnos : null,
    escolaridade_nivel: (formData.get('escolaridade_nivel') as string | null) || null,
    cv_storage_path: cvStoragePath,
    job_opening_id: jobOpeningId,
    unit_id: unitId,
    origem: 'portal',
    status: 'novo',
  })

  if (insertError) {
    // Limpa CV órfão se o INSERT falhou
    if (cvStoragePath) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any).storage.from('candidate-cvs').remove([cvStoragePath])
    }
    console.error('[submitCandidatura] insert error:', insertError)
    // 23505 = unique_violation; (phone, job_opening_id) únicos — mesma vaga
    if (insertError.code === '23505' && insertError.message?.includes('phone')) {
      return {
        success: false,
        error:
          'Você já se candidatou a esta vaga com este telefone. Nossa equipe já tem seu cadastro.',
      }
    }
    return { success: false, error: 'Erro ao salvar candidatura. Tente novamente.' }
  }

  return { success: true, candidateId }
}
