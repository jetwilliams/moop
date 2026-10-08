// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// The batch folder format: batches/<batch-id>/batch.json + one pattern file per item (+ optional rendered audio).
// See agent/batch-format.md for the human-readable spec. This module is the single source of truth for validation,
// used by the lab server, tools/check-batch.mjs and the tests.
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { getEngine, DEFAULT_ENGINE } from '../engines/index.mjs';

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;            // batch ids and item ids
export const RULE_RE = /^R[0-9]{1,4}$/;                         // taste rule ids, e.g. R7
export const TAG_RE = /^[a-z0-9][a-z0-9:_.-]{0,39}$/;           // free tags, e.g. "tempo:slow", "bass:sub"
export const AUDIO_RE = /^[a-z0-9][a-z0-9-]{0,63}\.(mp3|wav|ogg|m4a)$/;
export const MAX_ITEMS = 24;

const isStr = (v) => typeof v === 'string';
const strList = (v) => Array.isArray(v) && v.every(isStr);

/**
 * Validate a parsed batch.json object. Pure: no file system access unless `exists` is given.
 * @param {object} batch
 * @param {{ exists?: (file: string) => boolean, folderName?: string }} [opts]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateBatch(batch, opts = {}) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  if (!batch || typeof batch !== 'object' || Array.isArray(batch)) return { ok: false, errors: ['batch.json must be a JSON object'], warnings };

  if (!isStr(batch.id) || !ID_RE.test(batch.id)) err('id: lowercase letters, digits and dashes, max 64 chars');
  else if (opts.folderName && opts.folderName !== batch.id) err(`id "${batch.id}" must match its folder name "${opts.folderName}"`);
  if (batch.title != null && (!isStr(batch.title) || batch.title.length > 120)) err('title: a string of at most 120 chars');
  if (batch.created != null && (!isStr(batch.created) || Number.isNaN(Date.parse(batch.created)))) err('created: an ISO date like 2026-01-31');
  if (batch.tasteVersion != null && !Number.isInteger(batch.tasteVersion)) err('tasteVersion: an integer');
  const batchEngine = batch.engine ?? DEFAULT_ENGINE;
  if (!getEngine(batchEngine)) err(`engine: unknown engine "${batchEngine}"`);

  if (!Array.isArray(batch.items) || batch.items.length === 0) { err('items: a non-empty array'); return { ok: false, errors, warnings }; }
  if (batch.items.length > MAX_ITEMS) err(`items: at most ${MAX_ITEMS} per batch (small batches get rated; big ones get skipped)`);

  const seen = new Set();
  let wildcards = 0;
  batch.items.forEach((it, n) => {
    const at = `items[${n}]`;
    if (!it || typeof it !== 'object') return err(`${at}: must be an object`);
    if (!isStr(it.id) || !ID_RE.test(it.id)) err(`${at}.id: lowercase letters, digits and dashes`);
    else if (seen.has(it.id)) err(`${at}.id: duplicate id "${it.id}"`);
    else seen.add(it.id);
    if (!isStr(it.title) || !it.title.trim() || it.title.length > 80) err(`${at}.title: required, at most 80 chars`);
    if (it.notes != null && (!isStr(it.notes) || it.notes.length > 400)) err(`${at}.notes: a string of at most 400 chars`);

    const engineId = it.engine ?? batchEngine;
    const engine = getEngine(engineId);
    if (!engine) { err(`${at}.engine: unknown engine "${engineId}"`); return; }
    const fileRe = new RegExp(`^[a-z0-9][a-z0-9-]{0,63}\\${engine.fileExt}$`);
    if (!isStr(it.file) || !fileRe.test(it.file)) err(`${at}.file: a ${engine.fileExt} file name in the batch folder (no paths)`);
    else if (opts.exists && !opts.exists(it.file)) err(`${at}.file: "${it.file}" not found in the batch folder`);
    if (it.audio != null) {
      if (!isStr(it.audio) || !AUDIO_RE.test(it.audio)) err(`${at}.audio: an .mp3/.wav/.ogg/.m4a file name in the batch folder`);
      else if (opts.exists && !opts.exists(it.audio)) err(`${at}.audio: "${it.audio}" not found in the batch folder`);
    } else if (!engine.browserPlayer) {
      err(`${at}.audio: engine "${engineId}" cannot play in the browser, so a rendered audio file is required`);
    }

    for (const key of ['follows', 'breaks']) {
      if (it[key] == null) continue;
      if (!strList(it[key]) || !it[key].every((r) => RULE_RE.test(r))) err(`${at}.${key}: a list of rule ids like "R3"`);
    }
    if (it.tags != null && (!strList(it.tags) || !it.tags.every((t) => TAG_RE.test(t)) || it.tags.length > 12)) err(`${at}.tags: up to 12 short lowercase tags`);
    if (it.wildcard != null && typeof it.wildcard !== 'boolean') err(`${at}.wildcard: true or false`);
    if (it.wildcard) {
      wildcards++;
      if (!it.breaks?.length && !it.tags?.length) warn(`${at}: a wildcard should say what it tests (breaks: [...] or tags: [...])`);
    } else if (it.breaks?.length) warn(`${at}: breaks a rule but is not marked wildcard`);
  });
  if (wildcards === 0) warn('no wildcard item: include one per batch so new ideas can earn their way in');
  if (wildcards > 1) err(`${wildcards} wildcards: at most one per batch, so the rules stay the default`);
  return { ok: errors.length === 0, errors, warnings };
}

/** Read and validate batches/<id>/batch.json, checking that every referenced file exists. */
export async function loadBatch(batchesDir, id) {
  if (!ID_RE.test(id)) return null;
  const dir = join(batchesDir, id);
  let batch;
  try { batch = JSON.parse(await readFile(join(dir, 'batch.json'), 'utf8')); } catch { return null; }
  const files = new Set();
  for (const it of Array.isArray(batch?.items) ? batch.items : []) {
    for (const f of [it?.file, it?.audio]) {
      if (isStr(f) && /^[a-z0-9][a-z0-9.-]*$/.test(f)) {
        try { await access(join(dir, f)); files.add(f); } catch { /* missing: reported by validate */ }
      }
    }
  }
  const result = validateBatch(batch, { exists: (f) => files.has(f), folderName: id });
  return { batch, dir, ...result };
}
