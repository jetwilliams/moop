#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// npm run check [-- <batch-id> ...]   validate batches/<id>/batch.json (all batches when no id is given).
// Exit code 1 if any batch has errors. Warnings (e.g. no wildcard) do not fail.
import { readdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBatch, ID_RE } from '../lib/batch.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.env.BATCHES_DIR ? resolve(process.env.BATCHES_DIR) : join(ROOT, 'batches');
let ids = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (!ids.length) ids = (await readdir(dir).catch(() => [])).filter((n) => ID_RE.test(n));
if (!ids.length) { console.log('No batches found in batches/. Try: npm run demo'); process.exit(0); }
let failed = 0;
for (const id of ids.sort()) {
  const b = await loadBatch(dir, id);
  if (!b) { console.log(`✗ ${id}: no readable batch.json`); failed++; continue; }
  console.log(`${b.ok ? '✓' : '✗'} ${id} (${b.batch.items?.length ?? 0} items)`);
  for (const e of b.errors) console.log(`    error: ${e}`);
  for (const w of b.warnings) console.log(`    warning: ${w}`);
  if (!b.ok) failed++;
}
process.exit(failed ? 1 : 0);
