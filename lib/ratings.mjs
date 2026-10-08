// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// ratings.jsonl: one JSON object per line, appended on every save. The LATEST line for a (batch, item) pair wins.
//   {"ts":"2026-01-31T09:12:00.000Z","batch":"b-001","item":"a1","stars":4,"verdict":"keep","comment":"..."}
//   {"ts":"...","batch":"b-001","item":"a1","clear":true}          ← un-rates an item
// stars: 1–5 or null · verdict: "keep" | "bin" | null · comment: plain text, at most 1000 chars.
import { readFile, appendFile } from 'node:fs/promises';
import { ID_RE } from './batch.mjs';

export const VERDICTS = new Set(['keep', 'bin']);
export const MAX_COMMENT = 1000;

/** Strip control characters and invisible/bidi formatting characters, collapse to one line, cap length. */
export function cleanText(s, max = MAX_COMMENT) {
  return String(s)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/[​-‏‪-‮⁠-⁩﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Validate a rating coming from the lab page. Returns { ok, rating } or { ok: false, error }.
 * Unknown fields are dropped.
 */
export function normalizeRating(input, now = () => new Date().toISOString()) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'not an object' };
  const { batch, item } = input;
  if (typeof batch !== 'string' || !ID_RE.test(batch)) return { ok: false, error: 'bad batch' };
  if (typeof item !== 'string' || !ID_RE.test(item)) return { ok: false, error: 'bad item' };
  if (input.clear === true) return { ok: true, rating: { ts: now(), batch, item, clear: true } };
  const stars = input.stars ?? null, verdict = input.verdict ?? null, comment = input.comment ?? '';
  if (stars !== null && !(Number.isInteger(stars) && stars >= 1 && stars <= 5)) return { ok: false, error: 'stars must be 1-5' };
  if (verdict !== null && !VERDICTS.has(verdict)) return { ok: false, error: 'verdict must be keep or bin' };
  if (typeof comment !== 'string') return { ok: false, error: 'comment must be text' };
  const clean = cleanText(comment);
  if (stars === null && verdict === null && !clean) return { ok: false, error: 'empty rating' };
  return { ok: true, rating: { ts: now(), batch, item, stars, verdict, comment: clean } };
}

/** Parse ratings.jsonl text; malformed lines are skipped (and counted). */
export function parseRatings(text) {
  const events = [];
  let skipped = 0;
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e && typeof e.batch === 'string' && typeof e.item === 'string') events.push(e); else skipped++;
    } catch { skipped++; }
  }
  return { events, skipped };
}

export async function readRatings(file) {
  try { return parseRatings(await readFile(file, 'utf8')); } catch { return { events: [], skipped: 0 }; }
}

export async function appendRating(file, rating) {
  await appendFile(file, JSON.stringify(rating) + '\n', { mode: 0o600 });
}

/** Latest rating per "batch/item" (cleared items removed). Events are applied in file order. */
export function latestRatings(events) {
  const out = new Map();
  for (const e of events) {
    const key = `${e.batch}/${e.item}`;
    if (e.clear) out.delete(key); else out.set(key, e);
  }
  return out;
}
