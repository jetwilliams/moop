import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAuth, createLimiter, parseCookies, sessionCookie, sha256, LINK_TTL, SESSION_TTL } from '../lib/auth.mjs';

test('a login link works exactly once', () => {
  const auth = createAuth();
  const t = auth.issueLink();
  const sid = auth.redeem(t);
  assert.match(sid, /^[a-f0-9]{64}$/);
  assert.equal(auth.check(sid), true);
  assert.equal(auth.redeem(t), null, 'second use fails');
});

test('garbage and unknown tokens are refused', () => {
  const auth = createAuth();
  for (const t of [undefined, '', 'abc', 'x'.repeat(64), 'a'.repeat(64)]) assert.equal(auth.redeem(t), null);
  assert.equal(auth.check('a'.repeat(64)), false);
  assert.equal(auth.check(undefined), false);
});

test('links and sessions expire', () => {
  let now = 1_000_000;
  const auth = createAuth({ now: () => now });
  const t = auth.issueLink();
  now += LINK_TTL + 1;
  assert.equal(auth.redeem(t), null);
  const sid = auth.redeem(auth.issueLink());
  now += SESSION_TTL + 1;
  assert.equal(auth.check(sid), false);
});

test('logout and revokeAll end sessions', () => {
  const auth = createAuth();
  const a = auth.redeem(auth.issueLink()), b = auth.redeem(auth.issueLink());
  auth.logout(a);
  assert.equal(auth.check(a), false);
  assert.equal(auth.check(b), true);
  auth.revokeAll();
  assert.equal(auth.check(b), false);
});

test('only hashes are stored on disk, with 0600 permissions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'taste-auth-'));
  const file = join(dir, 'auth.json');
  const auth = createAuth({ stateFile: file });
  const t = auth.issueLink();
  const sid = auth.redeem(auth.issueLink());
  const text = await readFile(file, 'utf8');
  assert.equal(text.includes(t), false);
  assert.equal(text.includes(sid), false);
  assert.ok(text.includes(sha256(sid)));
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  // a fresh instance (server restart) still knows the session
  assert.equal(createAuth({ stateFile: file }).check(sid), true);
  await rm(dir, { recursive: true, force: true });
});

test('limiter blocks after too many failures, then resets', () => {
  let now = 0;
  const l = createLimiter({ max: 3, windowMs: 1000, now: () => now });
  for (let i = 0; i < 3; i++) l.fail('ip');
  assert.equal(l.blocked('ip'), true);
  assert.equal(l.blocked('other'), false);
  now = 1001;
  assert.equal(l.blocked('ip'), false);
});

test('cookie helpers', () => {
  assert.deepEqual(parseCookies('a=1; tl_s=abc; b=x=y'), { a: '1', tl_s: 'abc', b: 'x=y' });
  const c = sessionCookie('abc', { secure: true });
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Strict/);
  assert.match(c, /Secure/);
  assert.doesNotMatch(sessionCookie('abc'), /Secure/);
});

test('a link issued by another process (npm run link) works on the running server', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'taste-auth-'));
  const file = join(dir, 'auth.json');
  const server = createAuth({ stateFile: file });
  const before = server.redeem(createAuth({ stateFile: file }).issueLink());
  const cli = createAuth({ stateFile: file });
  const sid = server.redeem(cli.issueLink());
  assert.ok(sid);
  assert.equal(server.check(before), true, 'existing sessions survive');
  assert.equal(cli.check(sid), true);
  await rm(dir, { recursive: true, force: true });
});
