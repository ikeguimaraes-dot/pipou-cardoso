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
const base = overrides => ({ id, unit_id: 'A', nome: 'Pessoa', sobrenome: 'Fictícia', ativo: true,
  cpf: '52998224725', pis: '12345678901', telefone: '11999999999', email: null, funcao: 'Cozinha',
  data_admissao: '2025-01-01', tipo_contrato: 'CLT', contato_emergencia_nome: 'Contato', contato_emergencia_tel: '11988888888',
  cep: '01234000', rua: 'Rua de teste', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP',
  tier: 'T1', data_demissao: null, ...overrides });
const units = [{ id: 'A', active: true, name: 'Unidade A', brand_id: 'brand-A', brands: { group_id: 'group-A' } },
  { id: 'B', active: true, name: 'Unidade B', brand_id: 'brand-B', brands: { group_id: 'group-B' } }];
const role = (name, unit_id = 'A') => ({ roles: { name }, unit_id, brand_id: null, group_id: null });

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

test('a filled active record has no basic pending items; inactive employees are excluded', () => {
  assert.equal(model.employeePendencias(base(), units[0]).length, 0);
  assert.equal(model.employeePendencias(base({ ativo: false, cpf: null }), units[0]).length, 0);
});
test('PIS is requested only for a known CLT contract and one contact channel is sufficient', () => {
  assert.equal(model.employeePendencias(base({ tipo_contrato: 'PJ', pis: null }), units[0]).length, 0);
  assert.equal(model.employeePendencias(base({ tipo_contrato: null, pis: null }), units[0]).some(i => i.code === 'pis'), false);
  const pending = model.employeePendencias(base({ pis: null, telefone: null }), units[0]);
  assert(pending.some(i => i.code === 'pis'));
  assert(pending.some(i => i.code === 'contato'));
});
test('invalid CPF and contradictory employment status are review tasks, never automatic corrections', () => {
  const pending = model.employeePendencias(base({ cpf: '123', data_demissao: '2026-01-01', tier: null }), units[0]);
  assert(pending.some(i => i.code === 'cpf' && i.priority === 'alta'));
  assert.equal(Object.keys(pending.find(i => i.code === 'vinculo').fields).length, 0);
  assert.equal(Object.keys(pending.find(i => i.code === 'nivel').fields).length, 0);
});
test('document history does not charge an expired file already replaced by a valid one', () => {
  const doc = { id: 'old', employee_id: id, tipo: 'aso', nome: 'ASO', file_path: 'fixture.pdf', data_validade: '2025-01-01', data_emissao: '2024-01-01', created_at: null };
  const newer = { ...doc, id: 'new', data_emissao: '2026-01-01', data_validade: '2027-01-01' };
  assert.equal(model.documentPendencias([base()], units, [doc, newer], '2026-09-22').length, 0);
  assert.equal(model.documentPendencias([base()], units, [doc], '2026-09-22')[0].priority, 'alta');
  assert.equal(model.documentPendencias([base()], units, [], '2026-09-22')[0].code, 'sem_documentos');
});
test('competence crosses year boundary and rejects invalid months', () => {
  assert.equal(model.defaultPeriod('2026-01-10'), '2025-12');
  assert.equal(model.validPeriod('2026-13'), false);
  assert.equal(model.validPeriod('2026-09'), true);
});
test('anonymous access stops before reading roles or employee data', async () => {
  const db = database({ anonymous: true });
  await assert.rejects(db.server.pendenciasContext, /Entre novamente/);
  assert.equal(db.calls.filter(c => c[0] === 'from').length, 0);
});
test('a collaborator cannot access the queue', async () => {
  const db = database({ tables: { user_roles: [role('colaborador')] } });
  await assert.rejects(db.server.pendenciasContext, /destinada ao RH/);
  assert(!db.calls.some(c => c[1] === 'employees'));
});
test('management role at A is not combined with collaborator access at B', async () => {
  const db = database({ tables: { user_roles: [role('gm', 'A'), role('colaborador', 'B')] } });
  const context = await db.server.pendenciasContext();
  assert.deepEqual(Array.from(context.units, u => u.id), ['A']);
});
test('brand/group scope is honored, while an unscoped non-founder is not elevated', async () => {
  const scoped = database({ tables: { user_roles: [{ ...role('head_rh', null), group_id: 'group-B' }] } });
  assert.deepEqual(Array.from((await scoped.server.pendenciasContext()).units, u => u.id), ['B']);
  const unscoped = database({ tables: { user_roles: [role('head_rh', null)] } });
  assert.equal((await unscoped.server.pendenciasContext()).units.length, 0);
});
test('cross-unit mutation and unexpected privileged fields are rejected', async () => {
  const db = database({ tables: { employees: [base({ unit_id: 'B', cpf: null })] } });
  assert.equal((await db.actions.completarPendencia({ employeeId: id, values: { cpf: '52998224725' }, expected: { cpf: null } })).ok, false);
  assert.equal((await db.actions.completarPendencia({ employeeId: id, values: { tier: 'T6' }, expected: { tier: null } })).ok, false);
  assert(!db.calls.some(c => c[0] === 'update'));
});
test('valid filling persists only the requested field and removes its pending item', async () => {
  const db = database();
  const result = await db.actions.completarPendencia({ employeeId: id, values: { cpf: '529.982.247-25' }, expected: { cpf: null } });
  assert.equal(result.ok, true);
  assert.equal(db.tables.employees[0].cpf, '52998224725');
  assert.equal(model.employeePendencias(db.tables.employees[0], units[0]).some(i => i.code === 'cpf'), false);
  assert.equal(db.tables.employees[0].tier, 'T1');
});
test('outdated forms and concurrent writes are rejected instead of overwriting', async () => {
  const changed = database({ tables: { employees: [base()] } });
  assert.equal((await changed.actions.completarPendencia({ employeeId: id, values: { cpf: '52998224725' }, expected: { cpf: null } })).ok, false);
  const race = database({ race: true });
  assert.equal((await race.actions.completarPendencia({ employeeId: id, values: { cpf: '52998224725' }, expected: { cpf: null } })).ok, false);
});
test('invalid CPF and future admission date never reach a database write', async () => {
  const db = database();
  for (const [key, value] of [['cpf', '123'], ['data_admissao', '2099-01-01']]) {
    assert.equal((await db.actions.completarPendencia({ employeeId: id, values: { [key]: value }, expected: { [key]: null } })).ok, false);
  }
  assert.equal(db.calls.length, 0);
});
test('failed document query is shown as unavailable, never as missing attachments', async () => {
  const db = database({ fail: 'employee_documents' });
  const snapshot = await db.server.loadPendencias('2026-08');
  assert(snapshot.errors.some(e => e.includes('Documentos')));
  assert(!snapshot.items.some(i => i.category === 'documentos'));
});
test('monthly coverage excludes future admissions and PJ; unlinked time records are not counted as covered', async () => {
  const db = database({ tables: { employees: [base(), base({ id: 'future', data_admissao: '2026-09-01' }), base({ id: 'pj', tipo_contrato: 'PJ' })],
    ponto_mensal: [{ id: 'time', unit_id: 'A', employee_id: null, periodo: '08/2026' }], payslips: [{ id: 'slip', employee_id: id, competencia: '2026-08-01' }] } });
  const snapshot = await db.server.loadPendencias('2026-08');
  const ponto = snapshot.routines.find(r => r.id.startsWith('ponto:'));
  assert.equal(ponto.status, 'parcial'); assert(ponto.detail.includes('0 de 1')); assert(ponto.detail.includes('sem vínculo'));
  assert.equal(snapshot.routines.find(r => r.id.startsWith('holerites:')).status, 'registrado');
  assert(!snapshot.routines.some(r => r.id.startsWith('gorjetas:')));
});
test('employee collection paginates beyond 500 records and keeps scope', async () => {
  const db = database({ tables: { employees: Array.from({ length: 501 }, (_, i) => base({ id: String(i) })) } });
  const snapshot = await db.server.loadPendencias('2026-08');
  assert.equal(snapshot.employeeCount, 501);
  assert(db.calls.some(c => c[0] === 'range' && c[1] === 'employees' && c[2] === 500));
});
test('local navigation and server share the same allowed roles', () => {
  const nav = load('lib/kph/ui/pessoas-navigation.ts');
  assert.deepEqual(Array.from(nav.PENDENCIAS_NAV_ITEM.roles).sort(), Array.from(model.PENDENCIAS_ROLES).sort());
});

test('Pipou administrator can see units without brands; scoped RH remains restricted',async()=>{
 const extra={id:'C',name:'HOS',active:true,brand_id:null,brands:null};
 const db=database({tables:{units:[...units,extra],user_roles:[{...role('pipou_admin',null),group_id:'group-A'}]}});
 assert.deepEqual(Array.from((await db.server.pendenciasContext()).units,u=>u.id),['A','B','C']);
});
