const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Date, Intl, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    return load(path.join(path.dirname(file), name) + '.ts', mocks);
  }});
  return module.exports;
}
const model = load('src/lib/pessoas/orkestri-model.ts');
const base = { id: 'A', name: 'Casa A', active: 10, admissions: 1, departures: 3, vacancies: 2, overdue: 1, absences: 0, overtime: 0, pending: 5, urgent: 2 };
test('prioritizes staffing and vacancy delays, with source and evidence for every finding', () => {
  const findings = model.interpretPeople([base], 'Período de teste');
  assert.equal(findings.length, 3);
  assert.equal(findings[0].id, 'A:quadro');
  assert.equal(findings[1].id, 'A:vagas');
  assert.match(findings[0].evidence, /Saldo de -2/);
  assert(findings.every(item => item.source && item.href && item.period && item.recommendation));
  assert.equal(model.turnover(base), 20);
});
test('unavailable data never becomes zero or a healthy assessment', () => {
  const unit = { ...base, active: null, admissions: null, departures: null, overdue: null, urgent: null };
  assert.equal(model.interpretPeople([unit], 'x').length, 0);
  assert.equal(model.turnover(unit), null);
  assert.equal(model.turnover({ ...base, active: 0 }), null);
});
test('SLA uses weekdays, ignores future openings, and excludes end date', () => {
  assert.equal(model.workingDays('2026-09-18', '2026-09-21'), 1);
  assert.equal(model.workingDays('2026-09-21', '2026-09-21'), 0);
  assert.equal(model.workingDays('2026-09-25', '2026-09-21'), 0);
});
function fixture({ fail, many = false, pendingError = false } = {}) {
  const calls = [];
  const employee = { id: '1', unit_id: 'A', ativo: true, data_admissao: '2026-09-01', data_demissao: null };
  const tables = {
    employees: many ? Array.from({ length: 501 }, (_, i) => ({ ...employee, id: String(i) })) : [employee,
      { ...employee, id: '2', data_admissao: '2026-10-01' },
      { ...employee, id: '3', ativo: false, data_admissao: '2020-01-01', data_demissao: '2026-09-10' },
      { ...employee, id: '4', unit_id: 'B' }],
    job_openings: [], absences: [], overtime_records: [],
  };
  const client = { from(table) {
    calls.push(['from', table]); let predicates = [], range = [0, Infinity];
    const value = (row, key) => key.split('.').reduce((v, k) => v?.[k], row);
    const chain = { select() { return chain; }, order() { return chain; },
      in(key, values) { calls.push(['in', table, key, [...values]]); predicates.push(row => values.includes(value(row, key))); return chain; },
      gte(key, v) { predicates.push(row => value(row, key) >= v); return chain; },
      lte(key, v) { predicates.push(row => value(row, key) <= v); return chain; },
      range(a, b) { range = [a, b]; calls.push(['range', table, a]); return chain; },
      then(resolve, reject) { return Promise.resolve(fail === table ? { data: null, error: {} } : {
        data: tables[table].filter(row => predicates.every(p => p(row))).slice(range[0], range[1] + 1), error: null,
      }).then(resolve, reject); },
    }; return chain;
  }};
  const server = load('src/lib/pessoas/orkestri-server.ts', {
    './pendencias-server': { pendenciasContext: async () => ({ client, units: [{ id: 'A', name: 'Casa A' }] }),
      PendenciasAccessError: Error,
      loadPendencias: async () => ({ items: [{ unitId: 'A', priority: 'alta' }], errors: pendingError ? ['Fonte indisponível'] : [], period: '2026-09' }) },
    './pendencias-model': { saoPauloDate: () => '2026-09-24', defaultPeriod: () => '2026-09' },
  });
  return { calls, server };
}
test('rejects unauthorized unit before reading HR records', async () => {
  const f = fixture();
  await assert.rejects(f.server.loadOrkestri('B', '30'));
  assert.equal(f.calls.length, 0);
});
test('scopes every source, excludes future movements, and returns aggregate data only', async () => {
  const f = fixture(); const result = await f.server.loadOrkestri(null, '30');
  assert.equal(result.summaries[0].active, 1);
  assert.equal(result.summaries[0].admissions, 1);
  assert.equal(result.summaries[0].departures, 1);
  assert.equal(result.summaries[0].urgent, 1);
  for (const table of ['employees', 'job_openings', 'absences', 'overtime_records']) {
    assert(f.calls.some(c => c[0] === 'in' && c[1] === table && c[2].endsWith('unit_id') && c[3].join() === 'A'));
  }
  assert.equal(result.employees, undefined);
});
test('reads all pages and exposes failures instead of false zeros', async () => {
  const f = fixture({ many: true, fail: 'job_openings', pendingError: true });
  const result = await f.server.loadOrkestri('A', '90');
  assert.equal(result.summaries[0].active, 501);
  assert.equal(result.summaries[0].overdue, null);
  assert.equal(result.summaries[0].pending, null);
  assert.equal(result.errors.length, 2);
  assert(f.calls.some(c => c[0] === 'range' && c[1] === 'employees' && c[2] === 500));
});
