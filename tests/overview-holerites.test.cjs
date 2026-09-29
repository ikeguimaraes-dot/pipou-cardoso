const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const root=path.resolve(__dirname,'..');
class FixedDate extends Date{constructor(v){super(v===undefined?'2026-09-22T15:00:00Z':v)}}
class NextResponse extends Response {static redirect(url,init){return new NextResponse(null,{status:307,...init,headers:{...init?.headers,Location:String(url)}})}}
function load(file,mocks,cache={}){
 if(cache[file])return cache[file].exports;
 const module={exports:{}};cache[file]=module;
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,console,Date:FixedDate,Intl,Set,Map,URL,Response,require(name){
  if(name in mocks)return mocks[name];
  if(name==='server-only')return {};
  if(name==='next/server')return {NextResponse};
  if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks,cache);
  if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+'.ts',mocks,cache);
  throw Error('Unexpected dependency '+name);
 }},{filename:file});return module.exports;
}
const slipId='11111111-1111-4111-8111-111111111111';
const role=(name,unit_id='A',extra={})=>({roles:{name},unit_id,brand_id:null,group_id:null,...extra});
const unit=(id,active=true)=>({id,name:'Unidade '+id,active,brand_id:id==='B'?'brand-B':'brand-A',brands:{group_id:id==='B'?'group-B':'group-A'}});
function fixture(options={}){
 const tables={units:[unit('A'),unit('B'),unit('C',false)],user_roles:options.roles??[role('gm')],
  employees:[{id:'e1',unit_id:'A',ativo:true,data_admissao:'2026-09-01',data_demissao:null},{id:'e2',unit_id:'A',ativo:true,data_admissao:'2026-10-01',data_demissao:null},{id:'e3',unit_id:'A',ativo:false,data_admissao:'2020-01-01',data_demissao:'2026-09-05'},{id:'e4',unit_id:'B',ativo:true,data_admissao:'2026-09-02',data_demissao:'2026-09-25'}],
  vacation_schedules:[{id:'v1',unit_id:'A',status:'agendado',data_inicio:'2026-10-01'},{id:'v2',unit_id:'B',status:'agendado',data_inicio:'2026-10-01'}],
  employee_documents:[
   {id:'d1',employee_id:'e1',tipo:'aso',data_validade:'2026-01-01',data_emissao:'2025-01-01',created_at:null},
   {id:'d2',employee_id:'e1',tipo:'aso',data_validade:'2027-01-01',data_emissao:'2026-01-01',created_at:null},
   {id:'d3',employee_id:'e2',tipo:'aso',data_validade:'2026-09-01',data_emissao:'2026-01-01',created_at:null},
   {id:'d4',employee_id:'e3',tipo:'aso',data_validade:'2026-09-01',data_emissao:'2026-01-01',created_at:null},
   {id:'d5',employee_id:'e4',tipo:'aso',data_validade:'2026-09-01',data_emissao:'2026-01-01',created_at:null}],
  payslips:[{id:slipId,employee_id:'e1',unit_id:'A',pdf_url:'https://storage.example.test/slip.pdf',...options.slip}],...options.tables};
 const calls=[];
 const client={auth:{async getUser(){calls.push(['auth']);return {data:{user:options.anonymous?null:{id:'viewer'}},error:null}}},from(table){
  calls.push(['from',table]);let predicates=[],head=false,single=false,range=[0,Infinity];
  const val=(row,key)=>key.split('.').reduce((v,k)=>v?.[k],row);
  const chain={select(cols,opts){head=opts?.head??false;calls.push(['select',table,cols]);return chain},order(){return chain},
   eq(key,value){if(key!=='user_id')predicates.push(row=>val(row,key)===value);calls.push(['eq',table,key,value]);return chain},
   gte(key,value){predicates.push(row=>val(row,key)!=null&&val(row,key)>=value);return chain},lte(key,value){predicates.push(row=>val(row,key)!=null&&val(row,key)<=value);return chain},
   maybeSingle(){single=true;return chain},range(start,end){range=[start,end];calls.push(['range',table,start,end]);return chain},
   then(resolve,reject){
    if(options.fail===table)return Promise.resolve({data:null,count:null,error:{message:'fixture failure'}}).then(resolve,reject);
    let rows=(tables[table]??[]).map(row=>table==='employee_documents'?{...row,employees:tables.employees.find(e=>e.id===row.employee_id)}:row).filter(row=>predicates.every(p=>p(row)));
    const count=rows.length;rows=rows.slice(range[0],range[1]+1);
    return Promise.resolve({data:head?null:single?rows[0]??null:rows,count:head?count:null,error:null}).then(resolve,reject);
   }};return chain;
 }};
 const mocks={'@kph/db/supabase/server':{createSupabaseServerClient:async()=>client}};
 return {tables,calls,overview:load('src/lib/pessoas/overview-server.ts',mocks),route:load('src/app/api/holerites/pdf/route.ts',mocks)};
}
const request=(id=slipId)=>({nextUrl:new URL('https://app.example.test/api/holerites/pdf?id='+id)});

test('overview counts only the selected authorized unit and excludes future movements',async()=>{
 const f=fixture({roles:[role('founder',null)]});const a=await f.overview.loadPessoasOverview('A');
 assert.equal(a.active,2);assert.equal(a.admissions,1);assert.equal(a.departures,1);assert.equal(a.vacations,1);assert.equal(a.expiredAsos,1);
 assert.equal(a.unitName,'Unidade A');assert.equal(a.error,null);
 assert.equal((await f.overview.loadPessoasOverview('B')).active,1);
});
test('overview never uses a collaborator grant to expand an RH role',async()=>{
 const f=fixture({roles:[role('gm','A'),role('colaborador','B')]});const result=await f.overview.loadPessoasOverview('B');
 assert(result.error);assert.equal(result.active,null);assert(!f.calls.some(c=>c[1]==='employees'));
});
test('query failure is unavailable rather than zero, while other indicators remain usable',async()=>{
 const f=fixture({fail:'vacation_schedules'});const result=await f.overview.loadPessoasOverview('A');
 assert.equal(result.vacations,null);assert.equal(result.active,2);assert(result.unavailable.includes('Férias'));
});
test('ASO uses data_validade and ignores older replaced or inactive employee documents',async()=>{
 const f=fixture();assert.equal((await f.overview.loadPessoasOverview('A')).expiredAsos,1);
 assert(f.calls.some(c=>c[0]==='select'&&c[1]==='employee_documents'&&c[2].includes('data_validade')));
 assert(!f.calls.some(c=>String(c).includes('data_vencimento')));
});
test('ASO query failure is explicitly unavailable',async()=>{
 const f=fixture({fail:'employee_documents'});const result=await f.overview.loadPessoasOverview('A');
 assert.equal(result.expiredAsos,null);assert(result.unavailable.includes('ASOs vencidos'));
});
test('ASO documents are paginated beyond the server limit',async()=>{
 const docs=Array.from({length:501},(_,i)=>({id:'d'+i,employee_id:'e1',tipo:'aso',data_validade:i===500?'2027-01-01':'2026-01-01',data_emissao:i===500?'2026-01-01':'2025-01-01'}));
 const f=fixture({tables:{employee_documents:docs}});assert.equal((await f.overview.loadPessoasOverview('A')).expiredAsos,0);
 assert(f.calls.some(c=>c[0]==='range'&&c[2]===500));
});
test('anonymous PDF requests cannot read data',async()=>{
 const f=fixture({anonymous:true});assert.equal((await f.route.GET(request())).status,401);
 assert(!f.calls.some(c=>c[0]==='from'));
});
test('a managerial role at A plus collaborator role at B cannot open B payslips',async()=>{
 const f=fixture({roles:[role('gm','A'),role('colaborador','B')],slip:{unit_id:'B'}});
 assert.equal((await f.route.GET(request())).status,403);
});
test('authorized PDF redirect is private and not cached',async()=>{
 const f=fixture();const response=await f.route.GET(request());
 assert.equal(response.status,307);assert.equal(response.headers.get('location'),'https://storage.example.test/slip.pdf');assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('a historical payslip keeps its own unit even if the employee moved',async()=>{
 const f=fixture({slip:{employee_id:'e4',unit_id:'A'}});assert.equal((await f.route.GET(request())).status,307);
});
test('legacy payslip without unit must derive an authorized employee unit',async()=>{
 assert.equal((await fixture({slip:{unit_id:null}}).route.GET(request())).status,307);
 assert.equal((await fixture({slip:{unit_id:null,employee_id:'e4'}}).route.GET(request())).status,403);
});
test('brand/group grants are scoped and historic inactive units remain accessible',async()=>{
 assert.equal((await fixture({roles:[role('head_rh',null,{brand_id:'brand-A'})],slip:{unit_id:'C'}}).route.GET(request())).status,307);
 assert.equal((await fixture({roles:[role('diretor',null,{group_id:'group-A'})],slip:{unit_id:'B'}}).route.GET(request())).status,403);
 assert.equal((await fixture({roles:[role('founder',null)],slip:{unit_id:'C'}}).route.GET(request())).status,307);
});
test('unauthorized roles, malformed IDs, invalid URLs and query failures fail closed',async()=>{
 assert.equal((await fixture({roles:[role('colaborador')]}).route.GET(request())).status,403);
 assert.equal((await fixture().route.GET(request('bad-id'))).status,400);
 assert.equal((await fixture({slip:{pdf_url:'javascript:alert(1)'}}).route.GET(request())).status,422);
 assert.equal((await fixture({fail:'payslips'}).route.GET(request())).status,503);
 assert.equal((await fixture({fail:'user_roles'}).route.GET(request())).status,503);
});
