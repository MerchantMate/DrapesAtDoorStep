const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const source = fs.readFileSync('services.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

class Element {
  constructor() {
    this.handlers = {};
    this.attributes = {};
    this.children = [];
    this.disabled = true;
    this.hidden = true;
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.classList = { toggle() {} };
  }
  addEventListener(type, handler) { this.handlers[type] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  reportValidity() { return true; }
  reset() { this.wasReset = true; }
  append(...children) { this.children.push(...children); }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.handlers.close?.(); }
  set innerHTML(_) { throw new Error('Untrusted HTML must never be rendered'); }
}

const enquiry = {
  name: 'Customer', email: 'customer@example.com', phone: '+91 99999 00000',
  address: 'Private visit address', preferred_date: '2099-01-01', preferred_time: '15:30',
  preferences: 'Cotton sarees', website: '', consent: 'on',
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const event = () => ({ preventDefault() {} });

async function setup(handler = () => ({}), config = { email_enabled: true, chat_enabled: true, today: '2026-10-17' }) {
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => ['#' + match[1], new Element()]));
  const faq = new Element();
  faq.dataset.faq = 'visits';
  faq.textContent = 'How do visits work?';
  const calls = [];
  const context = {
    window: { DRAPES_CONFIG: { apiBaseUrl: '' } },
    document: {
      querySelector(selector) { assert(elements[selector], `Missing HTML selector ${selector}`); return elements[selector]; },
      querySelectorAll() { return [faq]; },
      createElement() { return new Element(); },
    },
    FormData: class { constructor() { return Object.entries(enquiry)[Symbol.iterator](); } },
    crypto: { randomUUID }, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/config')) return { ok: true, json: async () => config };
      const response = await handler(url, options);
      return { ok: response.ok !== false, json: async () => response.body || response };
    },
  };
  vm.runInNewContext(source, context);
  await tick();
  return { elements, calls, faq };
}

test('missing credentials keep forms disabled and quick FAQ usable', async () => {
  const { elements, calls, faq } = await setup(undefined, {});
  assert.equal(elements['#enquiry-fields'].disabled, true);
  assert.equal(elements['#chat-fields'].disabled, true);
  assert.equal(elements['#chat-launcher'].hidden, false);
  await elements['#enquiry-form'].handlers.submit(event());
  assert.equal(calls.length, 1);
  faq.handlers.click();
  assert.equal(elements['#chat-log'].children.length, 2);
});

test('successful enquiry sends JSON once, has a retry ID and resets after acceptance', async () => {
  const { elements, calls } = await setup(() => ({ reference: 'DAD-TEST', message: 'Accepted; visit not confirmed.' }));
  assert.equal(elements['#enquiry-fields'].disabled, false);
  await elements['#enquiry-form'].handlers.submit(event());
  const sent = calls.find(call => call.url.endsWith('/enquiries'));
  const body = JSON.parse(sent.options.body);
  assert.equal(body.address, enquiry.address);
  assert.equal(body.email, enquiry.email);
  assert.equal(body.consent, true);
  assert.match(body.request_id, /^[0-9a-f-]{36}$/);
  assert.equal(sent.options.method, 'POST');
  assert(!sent.url.includes('Private'));
  assert.equal(elements['#enquiry-form'].wasReset, true);
  assert.match(elements['#enquiry-status'].textContent, /DAD-TEST/);
});

test('failed delivery preserves form data and the retry ID', async () => {
  const { elements, calls } = await setup(() => ({ ok: false, body: { error: 'Mail unavailable' } }));
  await elements['#enquiry-form'].handlers.submit(event());
  assert.equal(elements['#enquiry-form'].wasReset, undefined);
  assert.equal(elements['#enquiry-fields'].disabled, false);
  assert.match(elements['#enquiry-status'].textContent, /Mail unavailable/);
  await elements['#enquiry-form'].handlers.submit(event());
  const sent = calls.filter(call => call.url.endsWith('/enquiries'));
  assert.equal(JSON.parse(sent[0].options.body).request_id, JSON.parse(sent[1].options.body).request_id);
});

test('double submit while sending does not create two emails', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const { elements, calls } = await setup(() => pending);
  const first = elements['#enquiry-form'].handlers.submit(event());
  await elements['#enquiry-form'].handlers.submit(event());
  assert.equal(calls.filter(call => call.url.endsWith('/enquiries')).length, 1);
  finish({ reference: 'DAD-TEST', message: 'Accepted.' });
  await first;
});

test('AI receives chat only, renders plain text, and restores focus on close', async () => {
  const reply = '<img src=x onerror=alert(1)> This stays plain text.';
  const { elements, calls } = await setup(() => ({ reply }));
  elements['#chat-launcher'].handlers.click();
  elements['#chat-input'].value = 'How do home visits work?';
  await elements['#chat-form'].handlers.submit(event());
  const sent = calls.find(call => call.url.endsWith('/chat'));
  const body = JSON.parse(sent.options.body);
  assert.deepEqual(Object.keys(body).sort(), ['history', 'message']);
  assert(!sent.options.body.includes(enquiry.address));
  assert(!sent.options.body.includes(enquiry.email));
  assert.equal(elements['#chat-log'].children[1].children[1].textContent, reply);
  assert.equal(elements['#chat-fields'].disabled, false);
  elements['#chat-close'].handlers.click();
  assert.equal(elements['#chat-launcher'].attributes['aria-expanded'], 'false');
  assert.equal(elements['#chat-launcher'].focused, true);
});
