import {requireRole} from '@kph/auth/server';
import {createSupabaseServerClient} from '@kph/db/supabase/server';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;tipo?:string}>}){
 await requireRole(['founder','cfo','gm','pessoas']);
 const params=await searchParams;const page=Math.max(1,Math.min(10000,Number.parseInt(params.page??'1')||1));
 const type=params.tipo==='contato'?'contato':'identidade';const sb=await createSupabaseServerClient();
 let query=(sb as any)?.from('candidates').select('id,full_name,import_review',{count:'exact'}).not('import_identity_key','is',null);
 query=type==='identidade'?query?.is('cpf',null):query?.is('phone',null);
 const result=query?await query.order('full_name').order('id').range((page-1)*50,page*50-1):null;
 return <main className="max-w-5xl mx-auto p-5"><a className="underline" href="/pessoas/recrutamento/banco-talentos">← Banco de Talentos</a><h1 className="text-2xl font-semibold my-5">Conferência da base importada</h1>
 <p className="mb-4">Os registros foram preservados. Confira as fontes no perfil antes de complementar ou unir cadastros.</p>
 <nav className="flex gap-4 my-4"><a className="underline" href="?tipo=identidade">CPF ausente ou inválido</a><a className="underline" href="?tipo=contato">Sem telefone válido</a></nav>
 {result?.error?<p role="alert">Não foi possível carregar a conferência.</p>:<><p>{result?.count?.toLocaleString('pt-BR')??0} cadastros · página {page} · {type==='identidade'?'Identidade':'Contato'}</p><ul>{(result?.data??[]).map((r:{id:string;full_name:string;import_review:string[]})=><li className="border-b border-[var(--border)] py-4" key={r.id}><a className="underline font-medium" href={`/pessoas/recrutamento/${r.id}`}>{r.full_name}</a><p className="text-sm text-[var(--muted)]">{r.import_review.join(' · ')}</p></li>)}</ul><nav className="flex gap-6 my-4">{page>1&&<a href={`?tipo=${type}&page=${page-1}`}>Anterior</a>}{page*50<(result?.count??0)&&<a href={`?tipo=${type}&page=${page+1}`}>Próxima</a>}</nav></>}
 </main>;
}
