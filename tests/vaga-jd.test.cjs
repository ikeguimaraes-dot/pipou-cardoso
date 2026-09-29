const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,console,Date,require(name){if(name in mocks)return mocks[name];if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks);throw Error('Unexpected dependency '+name)}},{filename:file});return module.exports;}
const {camposVagaDoJD}=load('src/lib/pessoas/vaga-jd.ts');
test('structured JD fills an editable description and requirements without inventing vacancy context',()=>{
 const jd={cargo:'Analista de DP',area:'Recursos Humanos',brand_id:'hos',tipo_contrato:'clt',objetivo_cargo:'Fechar a folha',req_formacao:'Administração',req_experiencia:'Dois anos',resp_gestao_operacional:'Conferir ponto',beneficios:'Vale refeição'};
 const fields=camposVagaDoJD(jd,['hos']);
 assert.equal(fields.cargo,'Analista de DP');assert.equal(fields.area,'Recursos Humanos');assert.equal(fields.forma_contratacao,'CLT');assert.equal(fields.brand_id,'hos');
 assert.match(fields.must_have,/Administração/);assert.match(fields.must_have,/Dois anos/);assert.match(fields.description,/Conferir ponto/);assert.match(fields.description,/Vale refeição/);
 for(const name of ['motivo_estruturado','cargo_grupo_id','unit_id','salario_min','nice_to_have','observacao'])assert.equal(name in fields,false);
});
test('legacy JDs preserve responsibilities and requirements',()=>{
 const fields=camposVagaDoJD({cargo:'Garçom',responsabilidades:'Atender mesas',requisitos:'Experiência em salão'},[]);
 assert.equal(fields.must_have,'Experiência em salão');assert.equal(fields.description,'Atender mesas');assert.equal(fields.forma_contratacao,'');
});
test('missing fields do not become undefined text or an unavailable brand',()=>{
 const fields=camposVagaDoJD({cargo:'Auxiliar',brand_id:'inactive',tipo_contrato:'outro'},['active']);
 assert.equal(fields.brand_id,'');assert.equal(fields.description,'');assert.equal(fields.must_have,'');assert.equal(fields.forma_contratacao,'');
});
