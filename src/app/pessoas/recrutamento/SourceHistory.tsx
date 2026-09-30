import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { requireRole } from "@kph/auth/server";

type Source = {id:string; sheet:string; source_row:number; source_company_code:string|null; fields:Record<string,string>; review_flags:string[]};
export async function SourceHistory({candidateId}:{candidateId:string}) {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb=await createSupabaseServerClient();
  if(!sb)return null;
  const {data,error}=await (sb as any).from("talent_source_records").select("id,sheet,source_row,source_company_code,fields,review_flags").eq("candidate_id",candidateId).order("sheet").order("source_row");
  if(error)return <p role="alert">Não foi possível carregar as fontes importadas. Atualize a página para tentar novamente.</p>;
  if(!data?.length)return null;
  return <section id="fontes-importadas" className="rounded-xl border border-[var(--border)] p-5 my-6">
    <h2 className="text-lg font-semibold">Histórico da base importada</h2>
    <p className="text-sm text-[var(--muted)] my-3">{data.length} registros de origem. Códigos de empresa identificam vínculos históricos; não indicam contratação atual pela Cardoso. Resultados e observações são históricos, sem decisão automática no processo atual.</p>
    {(data as Source[]).map(source=><details key={source.id} className="border-t border-[var(--border)] py-3">
      <summary className="cursor-pointer font-medium">{source.sheet} · linha {source.source_row}{source.source_company_code?` · empresa ${source.source_company_code}`:""}</summary>
      {!!source.review_flags.length&&<p className="my-3 text-sm">Conferência: {source.review_flags.join(" · ")}</p>}
      <dl className="grid gap-3 sm:grid-cols-2 mt-4">{Object.entries(source.fields).map(([label,value])=><div key={label}><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="text-sm whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
    </details>)}
  </section>;
}
export async function SourceBankSummary(){
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb=await createSupabaseServerClient();if(!sb)return null;
  const {data,error}=await (sb as any).from("talent_import_runs").select("status,source_rows,candidate_count,summary,completed_at").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error||!data)return null;
  const n=(v:number)=>v.toLocaleString("pt-BR");
  return <aside className="rounded-xl border border-[var(--border)] p-4 my-5">
    <h2 className="font-semibold">Base histórica {data.status==='complete'?'disponível':'em importação'}</h2>
    <p className="text-sm mt-2">{n(data.candidate_count)} cadastros · {n(data.source_rows)} registros de origem preservados.</p>
    <p className="text-sm text-[var(--muted)] mt-2">{n(data.summary.identity_pending??0)} cadastros com identidade a conferir · {n(data.summary.without_phone??0)} sem telefone válido. Os cadastros estão disponíveis para consulta; disponibilidade e contato devem ser confirmados antes de encaminhar para vagas.</p>
    <p className="text-sm mt-2">Abra o perfil para consultar “Histórico da base importada”. <a className="underline" href="/pessoas/recrutamento/banco-talentos/conferencia">Conferir pendências da base →</a></p>
  </aside>;
}
