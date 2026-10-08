// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// Auth for a private, single-person tool:
//   1. `npm run link` (or the first server start) issues a ONE-TIME login token. Only its sha256 is stored; the
//      plaintext link is written to a 0600 file for you to open on your phone. It is never printed to the console.
//   2. Opening /login?t=<token> redeems it once (it dies on use or after LINK_TTL) and creates a random session.
//   3. The session lives in an HttpOnly, SameSite=Strict cookie. Only the session's sha256 is stored on disk.
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const COOKIE = 'tl_s';
export const LINK_TTL = 24 * 3600e3;        // an unused login link expires after 24 h
export const SESSION_TTL = 30 * 24 * 3600e3; // a session lasts 30 days
const TOKEN_RE = /^[a-f0-9]{64}$/;

export const sha256 = (s) => createHash('sha256').update(String(s)).digest('hex');

/**
 * @param {{ stateFile?: string|null, now?: () => number }} opts  stateFile null = in-memory (tests)
 */
export function createAuth({ stateFile = null, now = Date.now } = {}) {
  let state = { links: {}, sessions: {} };
  // Re-read the file before every operation: `npm run link` (another process) adds links while the server runs.
  const load = () => {
    if (!stateFile) return;
    try { state = { links: {}, sessions: {}, ...JSON.parse(readFileSync(stateFile, 'utf8')) }; } catch { /* first run */ }
  };
  const save = () => {
    if (!stateFile) return;
    mkdirSync(dirname(stateFile), { recursive: true, mode: 0o700 });
    writeFileSync(stateFile, JSON.stringify(state, null, 1), { mode: 0o600 });
  };
  const prune = () => {
    const t = now();
    for (const [h, l] of Object.entries(state.links)) if (t - l.created > LINK_TTL) delete state.links[h];
    for (const [h, s] of Object.entries(state.sessions)) if (t - s.created > SESSION_TTL) delete state.sessions[h];
  };

  return {
    /** Issue a one-time login token. Returns the plaintext ONCE; the caller must not log it. */
    issueLink() {
      load(); prune();
      const token = randomBytes(32).toString('hex');
      state.links[sha256(token)] = { created: now() };
      save();
      return token;
    },
    /** Redeem a login token. Returns a new session id, or null. A token works once. */
    redeem(token) {
      load(); prune();
      if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null;
      const h = sha256(token);
      if (!state.links[h]) return null;
      delete state.links[h];
      const sid = randomBytes(32).toString('hex');
      state.sessions[sha256(sid)] = { created: now(), last: now() };
      save();
      return sid;
    },
    /** True if the session id is valid and unexpired. */
    check(sid) {
      if (typeof sid !== 'string' || !TOKEN_RE.test(sid)) return false;
      load();
      const s = state.sessions[sha256(sid)];
      if (!s) return false;
      if (now() - s.created > SESSION_TTL) { delete state.sessions[sha256(sid)]; save(); return false; }
      if (now() - s.last > 60e3) { s.last = now(); save(); }
      return true;
    },
    logout(sid) {
      load();
      if (typeof sid === 'string' && state.sessions[sha256(sid)]) { delete state.sessions[sha256(sid)]; save(); }
    },
    /** Revoke every session and pending link (e.g. you lost your phone). */
    revokeAll() { state = { links: {}, sessions: {} }; save(); },
    counts() { load(); prune(); return { links: Object.keys(state.links).length, sessions: Object.keys(state.sessions).length }; },
  };
}

/** A small fixed-window limiter for failed logins (per client address). */
export function createLimiter({ max = 10, windowMs = 10 * 60e3, now = Date.now } = {}) {
  const hits = new Map();
  return {
    blocked(key) { const h = hits.get(key); return !!h && now() - h.start < windowMs && h.n >= max; },
    fail(key) {
      const h = hits.get(key);
      if (!h || now() - h.start >= windowMs) hits.set(key, { start: now(), n: 1 }); else h.n++;
    },
  };
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export function sessionCookie(sid, { secure = false } = {}) {
  return `${COOKIE}=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secure ? '; Secure' : ''}`;
}
