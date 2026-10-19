const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function catalog(response = { ok: true, status: 200, json: async () => ({ result: { category: {}, subCategory: {} } }) }) {
  const calls = [];
  const missing = new Error('NOT_FOUND');
  const context = {
    exports: {}, URLSearchParams,
    require(name) {
      if (name === 'next/navigation') return { notFound() { throw missing; } };
      if (name === '@/config/env') return { API_BASE_URL: 'https://api.example/api' };
      throw new Error(name);
    },
    fetch: async (...args) => { calls.push(args); return response; },
  };
  const code = ts.transpileModule(fs.readFileSync('lib/catalog-pages.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, context);
  return { ...context.exports, calls, missing };
}

test('discovery, legacy tag and malformed slugs never trigger a product fetch', async () => {
  const c = catalog();
  for (const category of ['.well-known', 'product-tag', 'wp-admin', '../admin', 'bad?slug=x']) {
    await assert.rejects(c.fetchCatalogPage('get-products-by-category', { category_slug: category }), c.missing);
  }
  assert.equal(c.calls.length, 0);
});

test('a missing backend category invokes the 404 boundary', async () => {
  const c = catalog({ ok: false, status: 404 });
  await assert.rejects(c.fetchCatalogPage('get-products-by-category', { category_slug: 'missing' }), c.missing);
});

test('a backend outage is reported as an error instead of a missing page', async () => {
  const c = catalog({ ok: false, status: 503 });
  await assert.rejects(c.fetchCatalogPage('get-products-by-category', { category_slug: 'assays' }), /Unable to load/);
});

test('valid catalog queries encode parameters and preserve pagination', async () => {
  const c = catalog();
  await c.fetchCatalogPage('get-products-by-sub-category', {
    category_slug: 'assays', sub_category_slug: 'respiratory', page: 2, orderBy: 'asc&extra=value',
  });
  const url = new URL(c.calls[0][0]);
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('orderBy'), 'asc&extra=value');
  assert.equal(url.searchParams.has('extra'), false);
});

test('unsupported discovery route returns an empty cacheable 404', () => {
  const context = { exports: {}, Response };
  const source = fs.readFileSync('app/.well-known/[...path]/route.ts', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  const response = context.exports.GET();
  assert.equal(response.status, 404);
  assert.match(response.headers.get('Cache-Control'), /max-age=3600/);
});
