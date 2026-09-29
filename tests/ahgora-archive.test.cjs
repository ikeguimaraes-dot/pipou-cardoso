const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const zlib = require('node:zlib');
const id = '11111111-1111-4111-8111-111111111111';
class AccessError extends Error { constructor(status) { super(); this.status = status; } }

function fixture(options = {}) {
  let queried = false;
  const context = async () => {
    if (options.anonymous) throw new AccessError(401);
    return { units: [{ id: 'A' }], client: { from() {
      queried = true;
      const q = { select() { return q; }, eq() { return q; }, async maybeSingle() {
        return { error: options.error, data: { unit_id: 'A', arquivo: 'batidas.csv', linhas: [{ Nome: 'Teste', 'Tipo da Batida': 'Desconsiderada' }], resultado: { status: 'arquivado' }, ...options.row } };
      }};
      return q;
    } } };
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/api/ponto/ahgora-arquivo/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Uint8Array, require(name) {
    if (name === 'next/server') return { NextResponse: Response };
    if (name === 'node:zlib') return zlib;
    if (name.endsWith('/pendencias-server')) return { pendenciasContext: context, PendenciasAccessError: AccessError };
    throw Error(name);
  }});
  return { get: () => module.exports.GET({ nextUrl: new URL('https://pipou.test/api/ponto/ahgora-arquivo?id=' + id) }), queried: () => queried };
}

test('anonymous cannot query archived personnel records', async () => {
  const f = fixture({ anonymous: true }); assert.equal((await f.get()).status, 401); assert.equal(f.queried(), false);
});
test('archive from another unit is denied even when returned by database', async () => {
  assert.equal((await fixture({ row: { unit_id: 'B' } }).get()).status, 403);
});
test('unmapped company and incomplete archive cannot be downloaded', async () => {
  assert.equal((await fixture({ row: { unit_id: null } }).get()).status, 403);
  assert.equal((await fixture({ row: { resultado: { status: 'arquivando' } } }).get()).status, 409);
});
test('authorized export is compressed, private and preserves source classification', async () => {
  const response = await fixture().get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('content-encoding'), 'gzip');
  const rows = JSON.parse(zlib.gunzipSync(Buffer.from(await response.arrayBuffer())).toString());
  assert.equal(rows[0]['Tipo da Batida'], 'Desconsiderada');
});
