const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('public/form-protection.js', 'utf8');

function browser(siteKey = '') {
  const elements = [];
  const removed = [];
  let options;
  const document = {
    querySelectorAll: () => [],
    createElement: () => ({
      style: {}, children: [], setAttribute() {},
      appendChild(child) { this.children.push(child); },
      remove() { this.removed = true; },
    }),
    head: { appendChild() { throw new Error('Unexpected external script load'); } },
  };
  const window = {
    turnstile: {
      render(container, value) { options = value; return 'widget'; },
      remove(widget) { removed.push(widget); },
    },
  };
  const context = vm.createContext({
    window, document, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ site_key: siteKey, api_base_url: 'https://api.example/api/' }) }),
  });
  vm.runInContext(source, context);
  const form = {
    elements: {},
    appendChild(element) {
      elements.push(element);
      if (element.children?.[0]?.children?.[0]?.name === 'website') {
        const input = element.children[0].children[0];
        input.value = '';
        this.elements.website = input;
      }
    },
  };
  return { api: window.BPXFormProtection, form, removed, elements, options: () => options };
}

test('initialization inserts one inaccessible honeypot and preserves its value', async () => {
  const b = browser();
  b.api.initialize(b.form);
  b.api.initialize(b.form);
  assert.equal(b.elements.length, 1);
  assert.equal(b.form.elements.website.tabIndex, -1);
  b.form.elements.website.value = 'bot.example';
  assert.equal((await b.api.fields(b.form)).website, 'bot.example');
});

test('landing page endpoint preserves backend base path without duplicate slash', async () => {
  const b = browser();
  assert.equal(await b.api.endpoint('/panel-assessment/'), 'https://api.example/api/panel-assessment/');
});

test('each attempt generates a fresh challenge and cleans up the widget', async () => {
  const b = browser('public-key');
  for (const token of ['first-token', 'retry-token']) {
    const pending = b.api.fields(b.form);
    await new Promise(setImmediate);
    assert.equal(b.options().sitekey, 'public-key');
    assert.equal(b.options().action, 'contact_form');
    b.options().callback(token);
    assert.equal((await pending).turnstile_token, token);
  }
  assert.deepEqual(b.removed, ['widget', 'widget']);
});

test('challenge failures surface an error instead of submitting without a token', async () => {
  const b = browser('public-key');
  const pending = b.api.fields(b.form);
  await new Promise(setImmediate);
  b.options()['error-callback']();
  await assert.rejects(pending, /Spam protection failed/);
  assert.deepEqual(b.removed, ['widget']);
});
