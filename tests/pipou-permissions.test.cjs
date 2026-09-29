const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,console,Date,require(name){if(name in mocks)return mocks[name];if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks);throw Error('Unexpected dependency '+name)}},{filename:file});return module.exports;}
const {isPipouAdmin}=load('src/lib/pessoas/permissions.ts');
const grant=(role,scope={})=>({role,unitId:null,brandId:null,groupId:null,...scope});
test('only explicit group-level Pipou administration provides full visibility',()=>{
 assert.equal(isPipouAdmin({roles:[grant('pipou_admin',{groupId:'group'})]}),true);
 for(const field of ['unitId','brandId'])assert.equal(isPipouAdmin({roles:[grant('pipou_admin',{[field]:'scope',groupId:'group'})]}),false);
 for(const role of ['head_rh','pessoas','gm','head_financeiro','head_operacao','colaborador'])assert.equal(isPipouAdmin({roles:[grant(role,{groupId:'group'})]}),false);
 assert.equal(isPipouAdmin({roles:[grant('pipou_admin')]}),false);assert.equal(isPipouAdmin(null),false);
});
test('combining unrelated grants cannot produce Pipou administration',()=>{
 assert.equal(isPipouAdmin({roles:[grant('pipou_admin',{unitId:'A'}),grant('colaborador',{groupId:'group'})]}),false);
});
