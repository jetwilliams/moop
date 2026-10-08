import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createLabServer, buildCsp } from '../lab/server.mjs';
import { createAuth } from '../lib/auth.mjs';
import { tempProject } from './helpers.mjs';

let root, server, base, auth;
before(async () => {
  root = await tempProject();
  auth = createAuth();
  server = createLabServer({ root, auth });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.close(); await rm(root, { recursive: true, force: true }); });

async function login() {
  const r = await fetch(`${base}/login?t=${auth.issueLink()}`, { redirect: 'manual' });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), '/');
  const cookie = r.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  return cookie.split(';')[0];
}
const rate = (cookie, body, headers = {}) => fetch(`${base}/api/rate`, {
  method: 'POST', headers: { cookie, 'Content-Type': 'application/json', 'X-Lab': '1', ...headers }, body: JSON.stringify(body),
});

test('everything is private without a session', async () => {
  for (const p of ['/', '/api/batches', '/api/batch?b=b-001', '/app.js', '/samples/samples.json']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 401, p);
  }
});

test('bad or reused login links are refused', async () => {
  assert.equal((await fetch(`${base}/login?t=nope`, { redirect: 'manual' })).status, 403);
  const t = auth.issueLink();
  assert.equal((await fetch(`${base}/login?t=${t}`, { redirect: 'manual' })).status, 303);
  assert.equal((await fetch(`${base}/login?t=${t}`, { redirect: 'manual' })).status, 403);
});

test('the page ships a strict CSP and security headers', async () => {
  const cookie = await login();
  const r = await fetch(base + '/', { headers: { cookie } });
  assert.equal(r.status, 200);
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /https:\/\/cdn\.jsdelivr\.net/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(csp, buildCsp());
});

test('lists batches, serves code, and saves ratings to ratings.jsonl', async () => {
  const cookie = await login();
  const list = await (await fetch(base + '/api/batches', { headers: { cookie } })).json();
  assert.deepEqual(list, [{ id: 'b-001', title: 'Test batch', count: 4, rated: 0 }]);
  const code = await fetch(`${base}/api/code?b=b-001&i=a1`, { headers: { cookie } });
  assert.match(await code.text(), /note\(/);

  const r = await rate(cookie, { batch: 'b-001', item: 'a1', stars: 4, verdict: 'keep', comment: '<b>tight</b>' });
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).rating, { stars: 4, verdict: 'keep', comment: '<b>tight</b>' }); // stored as plain text; the page uses textContent
  const lines = (await readFile(join(root, 'ratings.jsonl'), 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].item, 'a1');
  const b = await (await fetch(base + '/api/batch?b=b-001', { headers: { cookie } })).json();
  assert.equal(b.items.find((i) => i.id === 'a1').rating.stars, 4);
  assert.equal(b.items.find((i) => i.id === 'w1').wildcard, true);
});

test('rating API rejects CSRF-shaped, invalid and oversized requests', async () => {
  const cookie = await login();
  assert.equal((await rate(cookie, { batch: 'b-001', item: 'a1', stars: 3 }, { 'X-Lab': '' })).status, 400);
  assert.equal((await rate(cookie, { batch: 'b-001', item: 'a1', stars: 3 }, { 'Content-Type': 'text/plain' })).status, 400);
  assert.equal((await rate(cookie, { batch: 'b-001', item: 'zz', stars: 3 })).status, 400);
  assert.equal((await rate(cookie, { batch: 'b-001', item: 'a1', stars: 9 })).status, 400);
  assert.equal((await rate(cookie, { batch: 'b-001', item: 'a1', comment: 'x'.repeat(5000) })).status, 413);
});

test('no path traversal through batches, audio or samples', async () => {
  const cookie = await login();
  await writeFile(join(root, 'secret.txt'), 'nope');
  for (const p of ['/api/batch?b=..', '/api/code?b=b-001&i=../../secret', '/audio/b-001/a1', '/samples/../secret.txt', '/samples/%2e%2e/secret.txt', '/samples/.hidden.wav']) {
    const r = await fetch(base + p, { headers: { cookie } });
    assert.ok([400, 404].includes(r.status), `${p} → ${r.status}`);
  }
});

test('logout ends the session', async () => {
  const cookie = await login();
  const r = await fetch(base + '/api/logout', { method: 'POST', headers: { cookie, 'Content-Type': 'application/json', 'X-Lab': '1' }, body: '{}' });
  assert.equal(r.status, 200);
  assert.equal((await fetch(base + '/api/batches', { headers: { cookie } })).status, 401);
});
