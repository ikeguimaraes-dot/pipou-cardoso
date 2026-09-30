/** Local operator import. Dry-run by default; source files and credentials are never committed. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import XLSX from 'xlsx';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const uuid=s=>{const h=hash(s);return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`};
const digits=s=>String(s??'').replace(/\D/g,'');
const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
export function validCpf(c){if(!/^\d{11}$/.test(c)||new Set(c).size===1)return false;for(const n of [9,10]){let v=0;for(let i=0;i<n;i++)v+=Number(c[i])*(n+1-i);v=(v*10)%11;if((v===10?0:v)!==Number(c[n]))return false}return true}
export function planBank(buffer,unitId,filename){
 const sha=hash(buffer),runId=uuid('cardoso-source:'+sha),book=XLSX.read(buffer,{type:'buffer',cellDates:true});
 const candidates=new Map(),records=[],counts={};
 for(const sheetName of ['AGENDA','EXTERNO','INTERNO']){
  const sheet=book.Sheets[sheetName];if(!sheet)throw Error(`Aba ausente: ${sheetName}`);
  const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:'',blankrows:true,dateNF:'yyyy-mm-dd'});
  const head=matrix.findIndex(r=>r.some(v=>['NOME','NOME COMPLETO'].includes(normal(v)))&&r.some(v=>normal(v)==='CPF'));
  if(head<0||head>15)throw Error(`Cabeçalho não identificado: ${sheetName}`);
  const headers=matrix[head].map(normal);const index=(...names)=>headers.findIndex(h=>names.includes(h));
  const nameIndex=index('NOME','NOME COMPLETO'),cpfIndex=index('CPF'),phoneIndex=index('CELULAR','WHATSAPP');
  counts[sheetName]=0;
  for(let i=head+1;i<matrix.length;i++){
   const row=matrix[i],name=String(row[nameIndex]??'').trim();if(!name)continue;
   const cpf=digits(row[cpfIndex]),valid=validCpf(cpf),identity=valid?'cpf:'+cpf:`unresolved:${sha}:${sheetName}:${i+1}`;
   const id=uuid('cardoso-person:'+identity);const flags=[];
   if(!valid)flags.push(cpf?'CPF inválido — conferir identidade':'CPF ausente — conferir identidade');
   let phone=digits(row[phoneIndex]);if(/^55\d{10,11}$/.test(phone))phone=phone.slice(2);
   if(!/^\d{10,11}$/.test(phone)){phone=null;flags.push('Sem telefone válido');}
   const get=(...names)=>String(row[index(...names)]??'').trim()||null;
   const candidate={id,full_name:name,cpf:valid?cpf:null,phone,email:null,unit_id:unitId,status:'banco_talentos',origem:'manual',area_interesse:get('QUAL VAGA VOCE ESTA CONCORRENDO ?','DESCRICAO CARGO'),cidade:get('CIDADE'),import_identity_key:identity,import_review:flags.slice(),observacoes:'Base histórica importada. Consulte as fontes originais abaixo. Situações antigas não representam avaliação atual nem disponibilidade confirmada.'};
   const previous=candidates.get(identity);
   if(previous){
    if(normal(previous.full_name)!==normal(name))previous.import_review.push('Variação de nome para o mesmo CPF');
    if(previous.phone&&phone&&previous.phone!==phone)previous.import_review.push('Telefones divergentes nas fontes');
    for(const field of ['phone','area_interesse','cidade'])if(!previous[field]&&candidate[field])previous[field]=candidate[field];
   }else candidates.set(identity,candidate);
   const fields={};matrix[head].forEach((h,j)=>{if(String(row[j]??'').trim())fields[String(h).trim().replace(/\s+/g,' ')||`Coluna ${j+1}`]=String(row[j]);});
   records.push({id:uuid(`${runId}:${sheetName}:${i+1}`),run_id:runId,candidate_id:id,sheet:sheetName,source_row:i+1,source_company_code:sheetName==='INTERNO'?get('COD EMP'):null,fields,review_flags:flags});counts[sheetName]++;
  }
 }
 const people=[...candidates.values()],phones=new Map();
 for(const p of people)if(p.phone){const same=phones.get(p.phone)??[];same.push(p);phones.set(p.phone,same);}
 for(const group of phones.values())if(group.length>1)for(const p of group)p.import_review.push('Telefone compartilhado — não unir automaticamente');
 for(const p of people){p.import_review=[...new Set(p.import_review)];if(p.phone)p.import_review=p.import_review.filter(v=>v!=='Sem telefone válido');}
 const summary={sheets:counts,source_rows:records.length,candidates:people.length,valid_cpf:people.filter(p=>p.cpf).length,identity_pending:people.filter(p=>!p.cpf).length,without_phone:people.filter(p=>!p.phone).length,with_review:people.filter(p=>p.import_review.length).length};
 return {people,records,run:{id:runId,source_sha256:sha,filename,unit_id:unitId,status:'loading',source_rows:records.length,candidate_count:people.length,summary},summary};
}
async function main(){
 const file=process.argv[2];if(!file)throw Error('Usage: node scripts/import-source-bank.mjs FILE [--commit]');
 const plan=planBank(fs.readFileSync(file),'85ec4ea4-3d44-4320-8301-59dfc0e20d64',file.split('/').pop());
 console.log(JSON.stringify(plan.summary));if(!process.argv.includes('--commit'))return;
 process.loadEnvFile('.env.local');const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(url!=='https://peuqfdgkxkiaszrvpgmq.supabase.co')throw Error('Unexpected destination');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 async function request(path,method,body,prefer='return=minimal'){
  const r=await fetch(url+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:prefer},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw Error(`Database request failed (${r.status}): ${await r.text()}`);
  const text=await r.text();return text?JSON.parse(text):null;
 }
 await request('talent_import_runs?on_conflict=id','POST',[plan.run],'resolution=ignore-duplicates,return=minimal');
 for(const [table,rows] of [['candidates',plan.people],['talent_source_records',plan.records]]){
  for(let i=0;i<rows.length;i+=200){await request(table+'?on_conflict=id','POST',rows.slice(i,i+200),'resolution=ignore-duplicates,return=minimal');if(i%2000===0)console.log(`${table}: ${Math.min(i+200,rows.length)}/${rows.length}`);}
 }
 // Verify every source row and distinct person before declaring complete.
 const actual=[];for(let offset=0;;offset+=1000){const page=await request(`talent_source_records?run_id=eq.${plan.run.id}&select=id,candidate_id&order=id&offset=${offset}&limit=1000`,'GET');actual.push(...page);if(page.length<1000)break;}
 if(actual.length!==plan.records.length||new Set(actual.map(r=>r.candidate_id)).size!==plan.people.length)throw Error('Count verification failed');
 await request('talent_import_runs?id=eq.'+plan.run.id,'PATCH',{status:'complete',completed_at:new Date().toISOString()});
 console.log(JSON.stringify({status:'complete',run_id:plan.run.id,verified_sources:actual.length,verified_candidates:new Set(actual.map(r=>r.candidate_id)).size}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
