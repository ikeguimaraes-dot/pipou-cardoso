const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,console,Date,require(name){if(name in mocks)return mocks[name];if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks);throw Error('Unexpected dependency '+name)}},{filename:file});return module.exports;}
const model=load('src/lib/pessoas/motivos-vaga.ts');
// Independent expected list from pg_get_constraintdef, not imported from implementation.
const expected=['abertura_casa','aumento_quadro','adequacao_quadro','substituicao_desligamento','substituicao_promocao','substituicao_licenca'];
function server(options={}) {
 const writes=[],calls=[];
 const sb={from(table) {
  calls.push(table);
  return {
   select:()=>({eq:()=>({single:async()=>({data:{sla_dias_uteis:25}})})}),
   async insert(row) { writes.push(row); return {error:options.error?{message:'Database error'}:null}; }
  };
 }};
 const mocks={
  '@kph/db/supabase/server':{createServiceClient:()=>{calls.push('client');return sb}},
  '@kph/auth/server':{requireRole:async()=>{calls.push('auth');if(options.denied)throw Error('denied')}},
  'next/cache':{revalidatePath:p=>calls.push(p)}
 };
 return {writes,calls,actions:load('src/app/pessoas/vagas/actions.ts',mocks)};
}

const input={cargo:'Analista de DP',cargo_grupo_id:'group',unit_id:'HOS'};
test('canonical list is exactly the six database values, with all labels',()=>{assert.deepEqual(Array.from(model.MOTIVOS_VAGA),expected);for(const value of expected)assert(model.MOTIVO_VAGA_LABEL[value]);});
test('blank, whitespace, undefined and null normalize to null',()=>{for(const value of ['', '  ',null,undefined])assert.equal(model.normalizeMotivoVaga(value),null)});
for(const motivo of expected)test('server persists exact allowed reason: '+motivo,async()=>{const db=server();const result=await db.actions.criarVaga({...input,motivo_estruturado:motivo});assert.equal(result.ok,true);assert.equal(db.writes.length,1);assert.equal(db.writes[0].motivo_estruturado,motivo);assert.equal(db.calls[0],'auth');});
test('missing, legacy and tampered reasons cannot reach database access',async()=>{for(const value of ['',null,undefined,' ','substituicao_licenca_maternidade','substituicao_transferencia','reposicao_temporaria','novo_cargo','retorno_licenca','arbitrario',42,{}]){const db=server();const result=await db.actions.criarVaga({...input,motivo_estruturado:value});assert.equal(result.ok,false,String(value));assert.equal(db.writes.length,0);assert(!db.calls.includes('client'));}});
test('valid canonical input still requires role and cargo group',async()=>{const denied=server({denied:true});await assert.rejects(denied.actions.criarVaga({...input,motivo_estruturado:'substituicao_promocao'}));assert.equal(denied.writes.length,0);const db=server();assert.equal((await db.actions.criarVaga({...input,cargo_grupo_id:'',motivo_estruturado:'substituicao_promocao'})).ok,false);assert.equal(db.writes.length,0)});
test('database failure cannot be reported as a successful vacancy',async()=>{const db=server({error:true});assert.equal((await db.actions.criarVaga({...input,motivo_estruturado:'substituicao_promocao'})).ok,false)});

test('JD description snapshot is persisted and empty description becomes null',async()=>{for(const [description,expected] of [['  Responsabilidades e benefícios  ','Responsabilidades e benefícios'],['',null]]){const db=server();await db.actions.criarVaga({...input,motivo_estruturado:'aumento_quadro',description});assert.equal(db.writes[0].description,expected)}});
