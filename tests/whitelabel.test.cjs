const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, env, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, process: { env }, require(name) {
    if (name in mocks) return mocks[name];
    if (name === '@/lib/tenant') return load('src/lib/tenant.ts', env);
    throw Error(name);
  }});
  return module.exports;
}
test('customer origins never include the source tenant', () => {
  const config = load('src/lib/tenant.ts', { NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://customer.example.test', NEXT_PUBLIC_PORTAL_URL: 'https://portal.example.test/path' });
  assert.equal(config.allowedOrigins().join(','), 'https://customer.example.test,https://portal.example.test');
  assert.equal(load('src/lib/tenant.ts', { NODE_ENV: 'production' }).allowedOrigins().length, 0);
});
function middleware(env, user, admin = true) {
  let authCalls = 0;
  const response = { next: () => ({ headers: new Map(), cookies: { set() {} }, type: 'next' }),
    json: (body, init) => ({ body, ...init }), redirect: url => ({ redirect: String(url) }) };
  const mod = load('src/middleware.ts', env, {
    'next/server': { NextResponse: response },
    '@supabase/ssr': { createServerClient: () => ({ rpc: async () => ({data: admin, error: null}), auth: { getUser: async () => { authCalls++; return { data: { user } }; } } }) },
  });
  const request = (pathname, action = false) => ({ url: `https://customer.example.test${pathname}`, nextUrl: new URL(`https://customer.example.test${pathname}`), headers: new Map(action ? [['next-action','private-action']] : []), cookies: { getAll: () => [] }, method: 'GET' });
  return { run: (pathname, action) => mod.middleware(request(pathname, action)), calls: () => authCalls };
}
const configured = { NEXT_PUBLIC_SUPABASE_URL: 'https://tenant.example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' };
test('anonymous private pages use local login and APIs return 401', async () => {
  const m = middleware(configured, null);
  assert.match((await m.run('/pessoas')).redirect, /^https:\/\/customer.example.test\/auth\/login/);
  assert.equal((await m.run('/api/agentes/maya/send')).status, 401);
  assert.equal(m.calls(), 2);
});
test('missing configuration fails closed and public login remains accessible', async () => {
  const m = middleware({}, null);
  assert.equal((await m.run('/pessoas')).status, 503);
  assert.equal((await m.run('/auth/login')).type, 'next');
  assert.equal(m.calls(), 0);
});
test('verified session reaches the protected page', async () => {
  const m = middleware(configured, { id: 'test-user' });
  assert.equal((await m.run('/pessoas/orkestri')).type, 'next');
  assert.equal(m.calls(), 1);
});

function payrollFixture(period = { id: 'period', unit_id: 'customer-unit', cod_empresa: '99999', competencia: '09/2026', status: 'ABERTO' }) {
  const calls = [];
  const rows = { payroll_fechamento_periodo: period,
    payroll_fechamento_linha: [{ employee_id: 'employee', origem_lancamento: 'AUTO', valor: 1 }],
    employees: [{ id: 'employee', nome: 'Teste' }], payroll_dominio_cadastro: [{ employee_id: 'employee' }] };
  const client = { from(table) {
    const q = { select() { return q; }, eq(key, value) { calls.push({ table, key, value }); return q; }, in() { return q; },
      limit() { return q; }, maybeSingle() { return q; }, single() { return q; },
      then(resolve, reject) { return Promise.resolve({ data: rows[table], error: null }).then(resolve, reject); } };
    return q;
  }, async rpc(name, args) { calls.push({ rpc: name, args }); return { data: 'fixture-line\n', error: null }; } };
  const code = load('src/lib/pessoas/payroll-dominio-actions.ts', {}, {
    '@kph/db/supabase/server': { createServiceClient: () => client },
    '@kph/auth/server': { requireUser: async () => ({ id: 'admin' }), isFounder: () => true },
    '@kph/auth/unit': { getCurrentUnit: async () => ({ id: 'customer-unit' }) },
  });
  return { code, calls };
}
test('payroll uses the selected period company and unit', async () => {
  const f = payrollFixture(); const result = await f.code.exportTxtDominio('period', '09/2026');
  assert.equal(result.ok, true);
  assert.equal(result.filename, 'FOLHA_99999_09_2026.txt');
  const rpc = f.calls.find(call => call.rpc);
  assert.equal(rpc.args.p_unit_id, 'customer-unit');
  assert.equal(rpc.args.p_cod_empresa, '99999');
});
test('payroll stops before export when company or competence does not match', async () => {
  for (const period of [ { unit_id: 'customer-unit', competencia: '09/2026', cod_empresa: null },
    { unit_id: 'customer-unit', competencia: '08/2026', cod_empresa: '99999' } ]) {
    const f = payrollFixture(period);
    assert.equal((await f.code.exportTxtDominio('period', '09/2026')).ok, false);
    assert(!f.calls.some(call => call.rpc));
  }
});
test('payroll without period searches only the current authorized unit', async () => {
  const f = payrollFixture();
  assert.equal((await f.code.exportTxtDominio(null, '09/2026')).ok, true);
  assert(f.calls.some(call => call.table === 'payroll_fechamento_periodo' && call.key === 'unit_id' && call.value === 'customer-unit'));
});

test('signed-in account without admin grant is denied', async () => {
  const m = middleware(configured, {id: 'unassigned'}, false);
  assert.equal((await m.run('/pessoas')).status, 403);
});
test('public page cannot be used to invoke a private Server Action', async () => {
  const m = middleware(configured, null);
  assert.equal((await m.run('/vagas')).type, 'next');
  assert.match((await m.run('/vagas', true)).redirect, /auth\/login/);
  assert.equal((await middleware(configured, {id:'unassigned'},false).run('/auth/login',true)).status, 403);
});
