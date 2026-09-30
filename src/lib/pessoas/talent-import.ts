import { z } from "zod";
export const TALENT_FILE_BYTES = 10 * 1024 * 1024;
export const TALENT_FILE_ROWS = 25000;
export const TALENT_BATCH_ROWS = 100;
export const TALENT_FIELDS = {full_name:"Nome completo",email:"E-mail",phone:"Telefone / WhatsApp",area_interesse:"Cargo / área de interesse",cidade:"Cidade",bairro:"Bairro",observacoes:"Observações"} as const;
export type TalentField = keyof typeof TALENT_FIELDS;
export function normalizeTalentPhone(value: string) {
  const digits=value.replace(/\D/g,"");
  return /^(55)(\d{10,11})$/.test(digits)?digits.slice(2):digits;
}
export const talentRowSchema=z.object({
  full_name:z.string().trim().min(2,"Informe o nome completo.").max(250),
  email:z.string().trim().toLowerCase().max(250).refine(v=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),"E-mail inválido."),
  phone:z.string().trim().max(40).refine(v=>!v||/^\+?[\d\s().-]+$/.test(v),"Telefone inválido.").transform(normalizeTalentPhone).refine(v=>!v||/^\d{10,15}$/.test(v),"Telefone deve incluir DDD."),
  area_interesse:z.string().trim().max(250),cidade:z.string().trim().max(250),bairro:z.string().trim().max(250),observacoes:z.string().trim().max(2000),
}).strict().refine(v=>!!v.email||!!v.phone,"Informe e-mail ou telefone para identificar e evitar duplicidades.");
export type TalentRow=z.infer<typeof talentRowSchema>;
export type TalentIssue={line:number;message:string};
export type TalentPlan={rows:{line:number;values:TalentRow}[];issues:TalentIssue[];duplicates:TalentIssue[];total:number};
const key=(s:string)=>s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
export function guessTalentColumns(headers:string[]):string[] {
  const aliases:Record<string,TalentField>={nome:"full_name",nomecompleto:"full_name",candidato:"full_name",fullname:"full_name",name:"full_name",email:"email",enderecoemail:"email",telefone:"phone",celular:"phone",whatsapp:"phone",phone:"phone",cargo:"area_interesse",funcao:"area_interesse",areainteresse:"area_interesse",area:"area_interesse",cidade:"cidade",city:"cidade",bairro:"bairro",observacoes:"observacoes",observacao:"observacoes",obs:"observacoes"};
  const used=new Set<string>();return headers.map(h=>{const field=aliases[key(h)];if(!field||used.has(field))return "";used.add(field);return field;});
}
export function planTalentFile(matrix:string[][],mapping:string[]):TalentPlan {
  const selected=mapping.filter(Boolean);
  if(selected.some(f=>!(f in TALENT_FIELDS))||new Set(selected).size!==selected.length||!selected.includes("full_name")||!selected.some(f=>f==="email"||f==="phone"))throw Error("Mapeie Nome completo e pelo menos E-mail ou Telefone. Cada campo deve aparecer uma única vez.");
  const source=matrix.slice(1).map((cells,i)=>({cells,line:i+2})).filter(r=>r.cells.some(c=>c.trim()));
  if(!source.length||source.length>TALENT_FILE_ROWS)throw Error("Use entre 1 e 25.000 candidatos por aba.");
  const rows:TalentPlan["rows"]=[],issues:TalentIssue[]=[],duplicates:TalentIssue[]=[];
  const emails=new Map<string,number>(),phones=new Map<string,number>();
  for(const {cells,line} of source){
    const input=Object.fromEntries(Object.keys(TALENT_FIELDS).map(f=>[f,""]));
    mapping.forEach((field,i)=>{if(field)input[field]=cells[i]?.trim()??"";});
    const result=talentRowSchema.safeParse(input);
    if(!result.success)issues.push({line,message:result.error.issues.map(i=>i.message).join(" ")});
    else {
      const r=result.data;const previous=(r.email?emails.get(r.email):undefined)??(r.phone?phones.get(r.phone):undefined);
      if(previous!==undefined)duplicates.push({line,message:`E-mail ou telefone repetido da linha ${previous}; não será cadastrado novamente.`});
      else { rows.push({line,values:r}); if(r.email)emails.set(r.email,line); if(r.phone)phones.set(r.phone,line); }
    }
  }
  return {rows,issues,duplicates,total:source.length};
}
