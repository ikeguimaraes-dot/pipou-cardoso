const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, console, Date, Intl, Set, Map,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'server-only') return {};
      if (name === 'zod') return require('zod');
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts', mocks);
      if (name.startsWith('.')) return load(path.join(path.dirname(file), name) + '.ts', mocks);
      throw Error('Unexpected dependency: ' + name);
    },
  }, { filename: file });
  return module.exports;
}
const model = load('src/lib/pessoas/pendencias-model.ts');
const id = '11111111-1111-4111-8111-111111111111';
const base = overrides => ({ id, unit_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', nome: 'Pessoa', sobrenome: 'Fictícia', ativo: true,
  cpf: '52998224725', pis: '12345678901', telefone: '11999999999', email: null, funcao: 'Cozinha',
  data_admissao: '2025-01-01', tipo_contrato: 'CLT', contato_emergencia_nome: 'Contato', contato_emergencia_tel: '11988888888',
  cep: '01234000', rua: 'Rua de teste', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP',
  tier: 'T1', data_demissao: null, ...overrides });
const units = [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', active: true, name: 'Unidade A', brand_id: 'brand-A', brands: { group_id: 'group-A' } },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', active: true, name: 'Unidade B', brand_id: 'brand-B', brands: { group_id: 'group-B' } }];
const role = (name, unit_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') => ({ roles: { name }, unit_id, brand_id: null, group_id: null });

function database(options = {}) {
  const calls = [];
  const tables = { units, user_roles: [role('pessoas')], employees: [base({ cpf: null })], employee_documents: [], ponto_mensal: [], payslips: [], gorjeta_periodos: [], ...options.tables };
  const client = {
    auth: { async getUser() { calls.push(['auth']); return { data: { user: options.anonymous ? null : { id: 'verified-user' } }, error: null }; } },
    from(table) {
      calls.push(['from', table]);
      let predicates = [], range = [0, Infinity], update = null, single = false;
      const chain = {
        select() { return chain; }, order() { return chain; },
        eq(key, value) { predicates.push(row => row[key] === value); return chain; },
        is(key, value) { predicates.push(row => row[key] === value); return chain; },
        in(key, values) { predicates.push(row => values.includes(row[key])); return chain; },
        gte(key, value) { predicates.push(row => row[key] >= value); return chain; },
        lte(key, value) { predicates.push(row => row[key] <= value); return chain; },
        range(start, end) { range = [start, end]; calls.push(['range', table, start, end]); return chain; },
        maybeSingle() { single = true; return chain; },
        update(values) { calls.push(['update', table, values]); update = values; return chain; },
        then(resolve, reject) {
          if (options.fail === table) return Promise.resolve({ data: null, error: { message: 'fixture outage' } }).then(resolve, reject);
          let rows = (tables[table] ?? []).filter(row => predicates.every(p => p(row))).slice(range[0], range[1] + 1);
          if (table === 'user_roles') rows = tables[table]; // Fixture roles belong to the verified user.
          if (update && options.race) rows = [];
          if (update) rows.forEach(row => Object.assign(row, update));
          return Promise.resolve({ data: single ? rows[0] ?? null : rows, error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
  };
  const mocks = { '@kph/db/supabase/server': { createSupabaseServerClient: async () => client }, 'next/cache': { revalidatePath() {} } };
  return { calls, tables, mocks, server: load('src/lib/pessoas/pendencias-server.ts', mocks), actions: load('src/app/pessoas/pendencias/actions.ts', mocks) };
}


const bulk = load('src/lib/pessoas/bulk-model.ts');
const A = units[0].id, B = units[1].id;
const csv = (rows) => bulk.parseBulkMatrix(rows);
const action = db => load('src/app/pessoas/importacao-massa/actions.ts', db.mocks);
const matrix = [['cpf','telefone','email'],['529.982.247-25','11987654321','pessoa@example.com']];
async function prepare(db) {
 const r = await action(db).previewBulk({unitId:A,matrix}); assert.equal(r.ok,true);
 return r.rows.filter(r=>r.status==='ready').map(({line,cpf,employeeId,values,expected})=>({line,cpf,employeeId,values,expected}));
}
test('CSV handles BOM, separators, escaped quotes, CRLF and multiline cells',()=>{
 const rows=bulk.readBulkCsv('\uFEFFcpf;rua;numero\r\n52998224725;"Rua \"A\"\nCentro";1'.replace('Rua "A"','Rua ""A""'));
 assert.equal(rows.length,2); assert.equal(rows[1][1],'Rua "A"\nCentro');
 assert.equal(bulk.readBulkCsv('cpf,email\n52998224725,a@example.com')[1][1],'a@example.com');
 assert.throws(()=>bulk.readBulkCsv('cpf;rua\n52998224725;"aberto'));
 assert.throws(()=>bulk.readBulkCsv('cpf;rua\n52998224725;"a"x'));
});
test('unknown/duplicate headers, missing CPF and oversized datasets are rejected',()=>{
 for(const input of [[['nome','email'],['Pessoa','a@b.com']],[['cpf','tier'],['52998224725','T6']],[['cpf','email','E-mail'],['52998224725','a@b.com','b@c.com']]])assert.throws(()=>csv(input));
 assert.throws(()=>csv([['cpf','email'],...Array(201).fill(['52998224725','a@b.com'])]));
});
test('duplicates, invalid CPFs and leading zero loss are never guessed',()=>{
 assert(csv([['cpf','email'],['123','a@b.com']])[0].error);
 assert(csv([['cpf','email'],['5.2998224725E10','a@b.com']])[0].error);
 assert(csv([...matrix,matrix[1]]) .every(r=>r.error.includes('repetido')));
});
test('dates and values normalize; invalid dates, mail, phone and formulas are rejected',()=>{
 const row=csv([['CPF','Data de admissão','Tipo de contrato','UF'],['52998224725','01/02/2020','clt','sp']])[0];
 assert.equal(row.values.data_admissao,'2020-02-01');assert.equal(row.values.tipo_contrato,'CLT');assert.equal(row.values.estado,'SP');
 for(const [h,v] of [['data_admissao','31/02/2020'],['email','nao-email'],['telefone','123'],['rua','=HYPERLINK("x")']])assert(csv([['cpf',h],['52998224725',v]])[0].error);
});
test('preview preserves populated fields and requires an unambiguous active CPF inside the unit',()=>{
 const rows=csv(matrix); const employee=base({telefone:null,email:'existing@example.com'});
 const p=bulk.buildBulkPreview(rows,[employee],units[0])[0];assert.equal(p.status,'unchanged'); // existing email satisfies contact pending rule
 const e=base({telefone:null,email:null});
 const ready=bulk.buildBulkPreview(rows,[e],units[0])[0];assert.equal(ready.status,'ready');assert.equal(ready.expected.telefone,null);
 assert.equal(bulk.buildBulkPreview(rows,[{...e,unit_id:B}],units[0])[0].status,'invalid');
 assert.equal(bulk.buildBulkPreview(rows,[{...e,ativo:false}],units[0])[0].status,'invalid');
 assert.equal(bulk.buildBulkPreview(rows,[e,{...e,id:'duplicate'}],units[0])[0].status,'invalid');
});
test('spreadsheet report escapes formula prefixes and quotes',()=>{
 assert(bulk.bulkCsv([['=SUM(1)',' +formula','"quoted"']]).includes("'=SUM(1)"));
 assert(bulk.bulkCsv([['"quoted"']]).includes('""quoted""'));
});
test('anonymous and cross-unit previews and commits do not write',async()=>{
 const anonymous=database({anonymous:true});assert.equal((await action(anonymous).previewBulk({unitId:A,matrix})).ok,false);
 const db=database({tables:{user_roles:[role('pessoas',A),role('colaborador',B)]}});
 assert.equal((await action(db).previewBulk({unitId:B,matrix})).ok,false);
 const r={line:2,cpf:'52998224725',employeeId:id,values:{telefone:'11987654321'},expected:{telefone:null}};
 assert.equal((await action(db).commitBulk({unitId:B,rows:[r]})).ok,false);assert(!db.calls.some(c=>c[0]==='update'));
});
test('preview is read-only; commit fills pending data and replay cannot overwrite',async()=>{
 const db=database({tables:{employees:[base({telefone:null,email:null})]}});const rows=await prepare(db);
 assert(!db.calls.some(c=>c[0]==='update'));assert.equal(rows.length,1);
 const r=await action(db).commitBulk({unitId:A,rows});assert.equal(r.results[0].status,'importado');
 assert.equal(db.tables.employees[0].telefone,'11987654321');
 const replay=await action(db).commitBulk({unitId:A,rows});assert.equal(replay.results[0].status,'erro');
});
test('tampered identity, protected fields, empty batches and duplicate rows are rejected',async()=>{
 const db=database({tables:{employees:[base({telefone:null,email:null})]}});const rows=await prepare(db);
 for(const changed of [[],[rows[0],rows[0]],[{...rows[0],values:{tier:'T6'}}],[{...rows[0],values:{cpf:'52998224725'}}]])assert.equal((await action(db).commitBulk({unitId:A,rows:changed})).ok,false);
 const r=await action(db).commitBulk({unitId:A,rows:[{...rows[0],cpf:'11111111111'}]});assert.equal(r.results[0].status,'erro');
 assert(!db.calls.some(c=>c[0]==='update'));
});
test('changed values, changed unit and failed compare-and-set are reported per line',async()=>{
 for(const change of ['values','unit','cpf','race']){
  const db=database({race:change==='race',tables:{employees:[base({telefone:null,email:null})]}});const rows=await prepare(db);
  if(change==='values')db.tables.employees[0].telefone='11999999999';
  if(change==='unit')db.tables.employees[0].unit_id=B;
  if(change==='cpf')db.tables.employees[0].cpf='00000000000';
  const r=await action(db).commitBulk({unitId:A,rows});assert.equal(r.results[0].status,'erro',change);
 }
});
test('scope remains bound during the final save even for users with both units',async()=>{
 const db=database({tables:{user_roles:[role('founder')],employees:[base({unit_id:B,telefone:null,email:null})]}});
 const r=await db.actions.completarPendencia({employeeId:id,values:{telefone:'11987654321'},expected:{telefone:null},scope:{unitId:A,cpf:'52998224725'}});
 assert.equal(r.ok,false);assert(!db.calls.some(c=>c[0]==='update'));
});
test('database failures do not appear as a valid empty preview',async()=>{
 const db=database({fail:'employees'});assert.equal((await action(db).previewBulk({unitId:A,matrix})).ok,false);
});
test('preview paginates all authorized employee rows before matching',async()=>{
 const employees=Array.from({length:501},(_,i)=>base({id:String(i),cpf:String(i)}));employees[500]=base({telefone:null,email:null});
 const db=database({tables:{employees}});const rows=await prepare(db);assert.equal(rows.length,1);
 assert(db.calls.some(c=>c[0]==='range'&&c[2]===500));
});
