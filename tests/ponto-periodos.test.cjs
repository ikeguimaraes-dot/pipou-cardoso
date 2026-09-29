const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture(rows) {
  const calls = [];
  const client = { from(table) {
    assert.equal(table, 'ponto_mensal');
    let unit;
    const query = {
      select() { return query; },
      eq(key, value) { assert.equal(key, 'unit_id'); unit = value; return query; },
      order(key) { assert.equal(key, 'id'); return query; },
      async range(start, end) {
        calls.push([start, end]);
        return { data: rows.filter(r => r.unit_id === unit).slice(start, end + 1), error: null };
      },
    };
    return query;
  }};
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/lib/pessoas/ponto-mensal-actions.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Set, Array, require(name) {
    if (name === '@kph/db/supabase/server') return { createSupabaseServerClient: async () => client };
    if (name === '@kph/auth/server') return { requireUser: async () => ({}) };
    if (name === 'next/cache') return { revalidatePath() {} };
    throw Error(name);
  }});
  return { list: module.exports.listPontoPeriodos, calls };
}

test('histórico atravessa páginas sem perder competências e ordena pela data', async () => {
  const rows = Array.from({ length: 1000 }, () => ({ unit_id: 'meet', periodo: '12/2025' }));
  rows.push({ unit_id: 'meet', periodo: '01/2026' }, { unit_id: 'meet', periodo: '09/2024' });
  rows.push({ unit_id: 'outra', periodo: '10/2026' }, { unit_id: 'meet', periodo: '' });
  const f = fixture(rows);
  assert.deepEqual(await f.list('meet'), ['01/2026', '12/2025', '09/2024']);
  assert.deepEqual(f.calls, [[0, 499], [500, 999], [1000, 1499]]);
});

test('unidade sem dados retorna lista vazia', async () => {
  assert.deepEqual(await fixture([]).list('meet'), []);
});
