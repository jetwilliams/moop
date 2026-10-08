#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// The taste lab: a tiny private web page for rating a batch on your phone.
//   npm run lab     → http://127.0.0.1:8787 (bound to 127.0.0.1 by default; reach it from your phone over a private
//                     network such as Tailscale, never by exposing it to the public internet)
//   npm run link    → a fresh one-time login link, written to .lab/login-link.txt (mode 0600, never printed)
// Zero dependencies: Node 20+ built-ins only. Strudel is loaded by the BROWSER at runtime (see engines/strudel).
import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth, createLimiter, parseCookies, sessionCookie, COOKIE } from '../lib/auth.mjs';
import { loadBatch, ID_RE } from '../lib/batch.mjs';
import { normalizeRating, readRatings, appendRating, latestRatings } from '../lib/ratings.mjs';
import { getEngine, listEngines, DEFAULT_ENGINE } from '../engines/index.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac' };
const extOf = (f) => (f.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();

/** Load KEY=value lines from a .env file into process.env (existing env wins). No values are ever logged. */
export async function loadEnvFile(file) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

export function buildCsp(extraConnect = []) {
  const scriptOrigins = new Set();
  for (const e of listEngines()) {
    if (!e.browserPlayer) continue;
    for (const o of e.browserPlayer.origins) scriptOrigins.add(o);
  }
  const s = [...scriptOrigins].join(' ');
  const connect = ["'self'", ...extraConnect].join(' ');
  return [
    "default-src 'none'",
    // 'unsafe-eval' is needed because a live-coding engine evaluates pattern code in the page (that IS the product).
    // Only code from your own batches folder is ever evaluated. data: and blob: are for the engine's audio worklets
    // (Strudel ships its AudioWorklet modules as data: URLs). There is still no 'unsafe-inline'.
    `script-src 'self' 'unsafe-eval' blob: data: ${s}`.trim(),
    `worker-src 'self' blob: data: ${s}`.trim(),
    `connect-src ${connect}`,
    "media-src 'self' blob:",
    "img-src 'self' data:",
    "style-src 'self'",
    "font-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * @param {object} o
 * @param {string} [o.root]        project root
 * @param {string} [o.batchesDir]  default <root>/batches
 * @param {string} [o.ratingsFile] default <root>/ratings.jsonl
 * @param {string} [o.samplesDir]  default <root>/samples
 * @param {object} [o.auth]        from createAuth(); default persists to <root>/.lab/auth.json
 * @param {string[]} [o.extraConnect] extra connect-src origins (e.g. a sample host you trust)
 */
export function createLabServer(o = {}) {
  const root = o.root || ROOT;
  const batchesDir = o.batchesDir || join(root, 'batches');
  const ratingsFile = o.ratingsFile || join(root, 'ratings.jsonl');
  const samplesDir = o.samplesDir || join(root, 'samples');
  const auth = o.auth || createAuth({ stateFile: join(root, '.lab', 'auth.json') });
  const limiter = createLimiter();
  const csp = buildCsp(o.extraConnect || []);
  const SEC = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store',
  };
  const STATIC = {
    '/': [join(ROOT, 'lab/public/index.html'), 'text/html; charset=utf-8'],
    '/app.js': [join(ROOT, 'lab/public/app.js'), 'text/javascript; charset=utf-8'],
    '/app.css': [join(ROOT, 'lab/public/app.css'), 'text/css; charset=utf-8'],
    '/engines/strudel/player.js': [join(ROOT, 'engines/strudel/player.js'), 'text/javascript; charset=utf-8'],
  };

  const send = (res, code, body, type = 'text/plain; charset=utf-8', extra = {}) => {
    res.writeHead(code, { ...SEC, 'Content-Type': type, ...extra });
    res.end(body);
  };
  const json = (res, obj, code = 200) => send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8');

  async function sendFile(req, res, file, type) {
    const size = (await stat(file)).size;
    const r = (req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
    const base = { ...SEC, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' };
    if (r && (r[1] !== '' || r[2] !== '')) { // Range support: iPhone Safari needs it to play and seek audio
      const a = r[1] === '' ? Math.max(0, size - +r[2]) : +r[1];
      const z = r[1] !== '' && r[2] !== '' ? Math.min(+r[2], size - 1) : size - 1;
      if (!(a <= z && z < size)) { res.writeHead(416, { ...SEC, 'Content-Range': `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { ...base, 'Content-Range': `bytes ${a}-${z}/${size}`, 'Content-Length': z - a + 1 });
      return createReadStream(file, { start: a, end: z }).pipe(res);
    }
    res.writeHead(200, { ...base, 'Content-Length': size });
    createReadStream(file).pipe(res);
  }

  async function batchIds() {
    const names = await readdir(batchesDir).catch(() => []);
    return names.filter((n) => ID_RE.test(n)).sort().reverse();
  }

  async function readBody(req, limit = 4096) {
    let body = '';
    for await (const c of req) { body += c; if (body.length > limit) throw Object.assign(new Error('too large'), { code: 413 }); }
    return body;
  }

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://lab');
    const ip = req.socket.remoteAddress || '?';

    // ---- login: a one-time link → a session cookie, then redirect so the token leaves the address bar ----
    if (url.pathname === '/login') {
      if (limiter.blocked(ip)) return send(res, 429, 'Too many attempts. Try again later.');
      const sid = auth.redeem(url.searchParams.get('t'));
      if (!sid) { limiter.fail(ip); return send(res, 403, 'This link is invalid, expired or already used. Make a new one with: npm run link'); }
      const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.LAB_SECURE_COOKIE === '1';
      res.writeHead(303, { ...SEC, 'Set-Cookie': sessionCookie(sid, { secure }), Location: '/' });
      return res.end();
    }

    const sid = parseCookies(req.headers.cookie)[COOKIE];
    if (!auth.check(sid)) return send(res, 401, 'This lab is private. Open a fresh one-time link (npm run link on the machine running the lab).');

    if (req.method === 'GET' && STATIC[url.pathname]) {
      const [f, t] = STATIC[url.pathname];
      return send(res, 200, await readFile(f), t);
    }

    if (req.method === 'GET' && url.pathname === '/api/config') {
      const engines = {};
      for (const e of listEngines()) {
        const p = e.browserPlayer;
        engines[e.id] = { name: e.name, browser: p ? { script: p.script, integrity: p.integrity, player: p.player } : null };
      }
      const hasSamples = existsSync(join(samplesDir, 'samples.json'));
      return json(res, { defaultEngine: DEFAULT_ENGINE, engines, samples: hasSamples ? '/samples/samples.json' : null });
    }

    if (req.method === 'GET' && url.pathname === '/api/batches') {
      const { events } = await readRatings(ratingsFile);
      const latest = latestRatings(events);
      const out = [];
      for (const id of await batchIds()) {
        const b = await loadBatch(batchesDir, id);
        if (!b?.ok) continue; // invalid batches are hidden; run `npm run check` to see why
        out.push({ id, title: b.batch.title || id, count: b.batch.items.length, rated: b.batch.items.filter((i) => latest.has(`${id}/${i.id}`)).length });
      }
      return json(res, out);
    }

    if (req.method === 'GET' && url.pathname === '/api/batch') {
      const b = await loadBatch(batchesDir, url.searchParams.get('b') || '');
      if (!b?.ok) return send(res, 404, 'not found');
      const latest = latestRatings((await readRatings(ratingsFile)).events);
      const batchEngine = b.batch.engine || DEFAULT_ENGINE;
      return json(res, {
        id: b.batch.id, title: b.batch.title || b.batch.id,
        items: b.batch.items.map((i) => {
          const r = latest.get(`${b.batch.id}/${i.id}`);
          return { id: i.id, title: i.title, notes: i.notes || '', wildcard: !!i.wildcard, engine: i.engine || batchEngine, hasAudio: !!i.audio,
            rating: r ? { stars: r.stars ?? null, verdict: r.verdict ?? null, comment: r.comment || '' } : null };
        }),
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/code') {
      const b = await loadBatch(batchesDir, url.searchParams.get('b') || '');
      const it = b?.ok && b.batch.items.find((i) => i.id === url.searchParams.get('i'));
      if (!it) return send(res, 404, 'not found');
      const engine = getEngine(it.engine || b.batch.engine || DEFAULT_ENGINE);
      if (!engine?.browserPlayer) return send(res, 404, 'not found');
      return send(res, 200, await readFile(join(b.dir, it.file), 'utf8'), 'text/plain; charset=utf-8');
    }

    let m;
    if (req.method === 'GET' && (m = url.pathname.match(/^\/audio\/([a-z0-9-]+)\/([a-z0-9-]+)$/))) {
      const b = await loadBatch(batchesDir, m[1]);
      const it = b?.ok && b.batch.items.find((i) => i.id === m[2]);
      if (!it?.audio) return send(res, 404, 'not found');
      return sendFile(req, res, join(b.dir, it.audio), MIME[extOf(it.audio)]);
    }

    // Your own sample folder (see samples/README.md): only samples.json and audio files, no other paths.
    if (req.method === 'GET' && (m = url.pathname.match(/^\/samples\/((?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+)$/))) {
      const rel = m[1];
      const f = resolve(samplesDir, rel);
      if (!f.startsWith(resolve(samplesDir) + sep) || rel.split('/').some((p) => p.startsWith('.'))) return send(res, 404, 'not found');
      if (rel === 'samples.json') { try { return send(res, 200, await readFile(f), 'application/json; charset=utf-8'); } catch { return send(res, 404, 'not found'); } }
      if (!MIME[extOf(rel)]) return send(res, 404, 'not found');
      try { return await sendFile(req, res, f, MIME[extOf(rel)]); } catch { return send(res, 404, 'not found'); }
    }

    if (req.method === 'POST' && (url.pathname === '/api/rate' || url.pathname === '/api/logout')) {
      // CSRF hardening on top of SameSite=Strict: JSON only + a custom header (plain HTML forms can set neither).
      if (req.headers['x-lab'] !== '1' || !(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 400, 'bad request');
      if (url.pathname === '/api/logout') {
        auth.logout(sid);
        return send(res, 200, '{"ok":true}', 'application/json', { 'Set-Cookie': `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict` });
      }
      let input;
      try { input = JSON.parse(await readBody(req)); } catch (e) { return send(res, e.code === 413 ? 413 : 400, 'bad request'); }
      const n = normalizeRating(input);
      if (!n.ok) return json(res, { ok: false, error: n.error }, 400);
      const b = await loadBatch(batchesDir, n.rating.batch);
      if (!b?.ok || !b.batch.items.some((i) => i.id === n.rating.item)) return json(res, { ok: false, error: 'unknown item' }, 400);
      await appendRating(ratingsFile, n.rating);
      const r = n.rating;
      return json(res, { ok: true, rating: r.clear ? null : { stars: r.stars, verdict: r.verdict, comment: r.comment } });
    }

    send(res, 404, 'not found');
  };

  return createServer((req, res) => {
    handler(req, res).catch(() => { if (!res.headersSent) send(res, 500, 'error'); else res.destroy(); });
  });
}

/** Write a fresh one-time login link to <root>/.lab/login-link.txt (0600). Returns the file path, never the token. */
export async function writeLoginLink({ root = ROOT, auth, baseUrl }) {
  const token = auth.issueLink();
  const dir = join(root, '.lab');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, 'login-link.txt');
  await writeFile(file, `${baseUrl.replace(/\/+$/, '')}/login?t=${token}\n`, { mode: 0o600 });
  return file;
}

async function main() {
  await loadEnvFile(join(ROOT, '.env'));
  const port = +(process.env.LAB_PORT || 8787);
  const host = process.env.LAB_HOST || '127.0.0.1';
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) {
    console.warn(`WARNING: binding to ${host}. Only do this on a private network you control; never expose the lab publicly.`);
  }
  const extraConnect = (process.env.LAB_EXTRA_CONNECT || '').split(/[\s,]+/).filter((x) => /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(x));
  const auth = createAuth({ stateFile: join(ROOT, '.lab', 'auth.json') });
  const server = createLabServer({ auth, extraConnect });
  server.listen(port, host, async () => {
    console.log(`taste lab → http://${host}:${port}`);
    const c = auth.counts();
    if (!c.sessions && !c.links) {
      const f = await writeLoginLink({ auth, baseUrl: process.env.LAB_PUBLIC_URL || `http://127.0.0.1:${port}` });
      console.log(`A one-time login link was written to ${f.replace(ROOT + sep, '')} (open it once on your phone; it is not printed here).`);
    } else {
      console.log('Need a login link? Run: npm run link');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
