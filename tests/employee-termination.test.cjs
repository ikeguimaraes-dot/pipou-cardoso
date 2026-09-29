const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
class FixedDate extends Date {constructor(value){super(value===undefined?'2026-09-24T01:00:00Z':value)}}
function load(file,mocks,cache={}){if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,console,Date:FixedDate,Intl,require(name){if(name in mocks)return mocks[name];if(name==='server-only')return {};if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks,cache);if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+'.ts',mocks,cache);throw Error('Unexpected dependency '+name)}},{filename:file});return module.exports;}
const id='11111111-1111-4111-8111-111111111111';
const grant=(name,unit_id='A')=>({unit_id,brand_id:null,group_id:null,roles:{name}});
function fixture(options={}){
 const employee={id,unit_id:'A',ativo:true,status_rh:'ativo',data_admissao:'2026-01-01',data_demissao:null,...options.employee};const calls=[],invalidations=[];
 const tables={employees:[employee],terminations:[],user_roles:options.roles??[grant('pessoas')],units:[{id:'A',active:true,brand_id:'brand',brands:{group_id:'group'}},{id:'B',active:true,brand_id:'other',brands:{group_id:'other'}}]};
 const client={auth:{async getUser(){return {data:{user:options.anonymous?null:{id:'viewer'}},error:null}}},from(table){let filters=[],mutation=null,operation=null,single=false;const chain={select(){return chain},order(){return chain},eq(k,v){if(k!=='user_id')filters.push(r=>r[k]===v);return chain},is(k,v){filters.push(r=>r[k]===v);return chain},maybeSingle(){single=true;return chain},update(patch){operation='update';mutation=patch;calls.push(patch);return chain},insert(patch){operation='insert';mutation={id:'termination-id',...patch};calls.push(patch);return chain},delete(){operation='delete';return chain},then(resolve,reject){
 if(options.readFailure&&table==='employees'&&!mutation)return Promise.resolve({data:null,error:{message:'read failure'}}).then(resolve,reject);
 if(operation==='insert'){
  if(options.rlsDenied||options.writeFailure)return Promise.resolve({data:null,error:{message:'write failure'}}).then(resolve,reject);
  tables[table].push(mutation);return Promise.resolve({data:single?mutation:[mutation],error:null}).then(resolve,reject);
 }
 if(operation==='update'&&table==='employees'&&options.race){employee.ativo=false;employee.data_demissao='2026-09-10'};
 let rows=tables[table].filter(r=>filters.every(f=>f(r)));
 if(operation==='delete'){tables[table]=tables[table].filter(r=>!filters.every(f=>f(r)));return Promise.resolve({data:rows,error:null}).then(resolve,reject)}
 if(mutation&&options.rlsDenied)rows=[];
 const error=mutation&&options.writeFailure?{message:'write failure'}:null;
 if(mutation&&!error)rows.forEach(r=>Object.assign(r,mutation));
 return Promise.resolve({data:single?rows[0]??null:rows,error}).then(resolve,reject);
 }};return chain;}};
 const api=load('src/lib/pessoas/termination-server.ts',{'@kph/db/supabase/server':{createSupabaseServerClient:async()=>client},'next/cache':{revalidatePath:(...v)=>invalidations.push(v)}});
 return {action:(employeeId,date,reason='pedido_demissao')=>api.terminateEmployee(employeeId,date,reason),access:api.loadTerminationAccess,employee,calls,invalidations,tables};
}
test('RH saves date, reason and inactive flags, preserving the row',async()=>{const f=fixture();assert.equal((await f.action(id,'2026-09-20','justa_causa')).ok,true);assert.equal(f.employee.data_demissao,'2026-09-20');assert.equal(f.employee.ativo,false);assert.equal(f.employee.status_rh,'inativo');assert.equal(f.employee.id,id);assert.equal(f.tables.terminations[0].tipo_aviso,'justa_causa');assert.equal(f.invalidations.length,1)});
test('requires one of the four official termination reasons',async()=>{const f=fixture();assert.equal((await f.action(id,'2026-09-20','outro')).ok,false);assert.equal(f.calls.length,0)});
test('validates calendar, required date, admission and São Paulo date on the server',async()=>{for(const date of ['',null,'2026-02-30','2026-13-01','2025-12-31','2026-09-24','2026-09-20T00:00:00Z']){const f=fixture();assert.equal((await f.action(id,date)).ok,false,String(date));assert.equal(f.calls.length,0)}const f=fixture();assert.equal((await f.action(id,'2026-09-23')).ok,true)});
test('requires a verified identity and RH role',async()=>{for(const opts of [{anonymous:true},{roles:[grant('colaborador')]},{roles:[]}]){const f=fixture(opts);assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.calls.length,0)}});
test('cannot combine RH in A with collaborator in B to terminate someone in B',async()=>{const f=fixture({roles:[grant('pessoas','A'),grant('colaborador','B')],employee:{unit_id:'B'}});assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.calls.length,0)});
test('group RH scope permits a unit of that group',async()=>{const f=fixture({roles:[{...grant('head_rh',null),group_id:'group'}]});assert.equal((await f.action(id,'2026-09-20')).ok,true)});
test('already inactive or dated employees cannot be terminated again',async()=>{for(const employee of [{ativo:false},{data_demissao:'2026-09-01'}]){const f=fixture({employee});assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.calls.length,0)}});
test('a concurrent termination cannot overwrite the original date',async()=>{const f=fixture({race:true});assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.employee.data_demissao,'2026-09-10');assert.equal(f.invalidations.length,0)});
test('RLS denial and database failures never report success',async()=>{for(const opts of [{rlsDenied:true},{writeFailure:true},{readFailure:true}]){const f=fixture(opts);assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.employee.ativo,true);assert.equal(f.employee.data_demissao,null);assert.equal(f.invalidations.length,0)}});
test('invalid or missing employee cannot trigger a write',async()=>{for(const value of ['bad','22222222-2222-4222-8222-222222222222']){const f=fixture();assert.equal((await f.action(value,'2026-09-20')).ok,false);assert.equal(f.calls.length,0)}});

const viewer={id:'viewer',email:'manager@example.test',displayName:null,roles:[]};
const pipouManager={...viewer,roles:[{role:'pipou_admin',unitId:null,brandId:null,groupId:'group'}]};
test('Pipou manager action visibility does not depend on the pending-items lookup',async()=>{
 const f=fixture({anonymous:true});const access=await f.access(pipouManager,'A');
 assert.equal(access.allowed,true);assert.equal(access.error,null);
 // Presentation is not authorization: an expired session still cannot write.
 assert.equal((await f.action(id,'2026-09-20')).ok,false);assert.equal(f.calls.length,0);
});
test('scoped RH visibility still checks unit scope',async()=>{
 const f=fixture();assert.equal((await f.access(viewer,'A')).allowed,true);assert.equal((await f.access(viewer,'B')).allowed,false);
});
test('permission lookup failure is explicit instead of silently hiding the action',async()=>{
 const f=fixture({anonymous:true});const access=await f.access(viewer,'A');assert.equal(access.allowed,false);assert.match(access.error,/sessão/);
 const result=await f.action(id,'2026-09-20');assert.match(result.error,/Entre novamente/);assert.equal(f.calls.length,0);
});
test('missing UI identity does not gain termination controls',async()=>{
 const f=fixture();const access=await f.access(null,'A');assert.equal(access.allowed,false);assert.match(access.error,/Entre novamente/);
});
