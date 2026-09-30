const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={},cache={}){if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,Date,Intl,console,Error,self:mocks.__self,require(name){if(name in mocks)return mocks[name];if(name==='zod'||name==='xlsx')return require(name);if(name==='server-only')return {};if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts',mocks,cache);if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+'.ts',mocks,cache);throw Error(name)}});return module.exports;}

const {planTalentFile,guessTalentColumns,normalizeTalentPhone,TALENT_BATCH_ROWS}=load('src/lib/pessoas/talent-import.ts');
test('maps common Portuguese headers and ignores unknown columns',()=>{
 assert.deepEqual(Array.from(guessTalentColumns(['Nome completo','E-mail','WhatsApp','Cargo','CPF','Observações'])),['full_name','email','phone','area_interesse','','observacoes']);
 assert.equal(normalizeTalentPhone('+55 (11) 99999-0000'),'11999990000');
});
test('plans 10001 candidates and over 4 MB without truncation',()=>{
 const matrix=[['Nome','E-mail','Observações'],...Array.from({length:10001},(_,i)=>['Pessoa '+i,`fixture${i}@example.invalid`,'Histórico '.repeat(60)])];
 assert.ok(Buffer.byteLength(JSON.stringify(matrix))>4000000);
 const result=planTalentFile(matrix,['full_name','email','observacoes']);
 assert.equal(result.rows.length,10001);assert.equal(result.issues.length,0);assert.equal(Math.ceil(result.rows.length/TALENT_BATCH_ROWS),101);assert.equal(result.rows.at(-1).line,10002);
});
test('detects duplicate email and normalized phone even across batches',()=>{
 const result=planTalentFile([['Nome','Email','Phone'],['Pessoa A','A@EXAMPLE.INVALID','+55 (11) 99999-0000'],['Pessoa B','a@example.invalid',''],['Pessoa C','','11999990000']],['full_name','email','phone']);
 assert.equal(result.rows.length,1);assert.equal(result.duplicates.length,2);assert.equal(result.duplicates[1].line,4);
});
test('requires contact, rejects malformed fields and repeated mapping',()=>{
 const result=planTalentFile([['Nome','Email'],['Pessoa A',''],['Pessoa B','invalid']],['full_name','email']);
 assert.equal(result.issues.length,2);assert.equal(result.rows.length,0);
 assert.throws(()=>planTalentFile([['N','E'],['X','x@example.invalid']],['full_name','full_name']));
});
test('rejects excessive rows and bounds long observations',()=>{
 assert.throws(()=>planTalentFile([['N','E'],...Array(25001).fill(['Pessoa','a@example.invalid'])],['full_name','email']));
 const result=planTalentFile([['N','E','O'],['Pessoa','a@example.invalid','a'.repeat(2001)]],['full_name','email','observacoes']);assert.equal(result.issues.length,1);
});
function fixture(denied=false){let calls=0;const api=load('src/app/pessoas/recrutamento/importar-planilha/actions.ts',{'@kph/auth/server':{requireRole:async()=>{if(denied)throw Error('denied')}},'@kph/db/supabase/server':{createSupabaseServerClient:async()=>({rpc:async(name,args)=>{calls++;assert.equal(name,'cardoso_import_talents');assert.equal(args.p_rows[0].phone,'11999990000');return {data:{created:1,skipped:0,rows:[{row:1,status:args.p_commit?'created':'ready'}]},error:null}}})},'next/cache':{revalidatePath(){}}});return {api,get calls(){return calls}};}
const input={unitId:'11111111-1111-4111-8111-111111111111',commit:false,rows:[{full_name:'Pessoa Teste',email:'',phone:'+55 (11) 99999-0000',area_interesse:'',cidade:'',bairro:'',observacoes:''}]};
test('server enforces admin, row limit, strict fields and normalizes before RPC',async()=>{
 const f=fixture();assert.equal((await f.api.importTalentBatch(input)).ok,true);assert.equal(f.calls,1);
 assert.equal((await f.api.importTalentBatch({...input,rows:Array(101).fill(input.rows[0])})).ok,false);
 assert.equal((await f.api.importTalentBatch({...input,rows:[{...input.rows[0],status:'contratado'}]})).ok,false);assert.equal(f.calls,1);
 await assert.rejects(fixture(true).api.importTalentBatch(input));
});

function reader() {
 let response;
 const scope={postMessage(data){response=data}};
 load('src/app/pessoas/recrutamento/importar-planilha/reader.worker.ts',{__self:scope});
 return async file=>{await scope.onmessage({data:file});return response};
}
test('worker reads 10001 XLSX candidates, preserving headers and final row',async()=>{
 const XLSX=require('xlsx');
 const matrix=[['Nome','Email'],...Array.from({length:10001},(_,i)=>['Pessoa '+i,`candidate${i}@example.invalid`])];
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(matrix),'Base');
 const bytes=XLSX.write(workbook,{type:'buffer',bookType:'xlsx'});
 const result=await reader()({name:'base.xlsx',size:bytes.length,arrayBuffer:async()=>bytes});
 assert.equal(result.error,undefined);assert.equal(result.sheets.Base.length,10002);assert.equal(result.sheets.Base.at(-1)[0],'Pessoa 10000');
});
test('worker returns actionable errors for corrupt Excel, formulas and oversized CSV',async()=>{
 const read=reader();
 assert.match((await read({name:'base.xlsx',size:1,arrayBuffer:async()=>{throw Error('Arquivo ilegível')}})).error,/ilegível/);
 assert.match((await read({name:'base.csv',size:11*1024*1024})).error,/10 MB/);
 assert.match((await read({name:'base.csv',size:10,text:async()=>Array(25003).fill('Nome;Email').join('\n')})).error,/25.000/);
 const XLSX=require('xlsx'),book=XLSX.utils.book_new();
 const sheet=XLSX.utils.aoa_to_sheet([['Nome','Email'],['Pessoa','p@example.invalid']]);sheet.A2.f='1+1';
 XLSX.utils.book_append_sheet(book,sheet,'Base');
 const bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx'});
 assert.match((await read({name:'base.xlsx',size:bytes.length,arrayBuffer:async()=>bytes})).error,/fórmulas/);
});
