#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// npm run report [-- --json] [-- --min 3]
// Reads ratings.jsonl + every valid batch + agent/TASTE.md and prints the evidence report the agent uses in
// agent/learn.md. Read-only: it never edits TASTE.md. The agent (or you) does that, on purpose.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBatch, ID_RE } from '../lib/batch.mjs';
import { readRatings } from '../lib/ratings.mjs';
import { analyse, renderReport, MIN_EVIDENCE } from '../lib/taste.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const minArg = args.indexOf('--min');
const min = minArg >= 0 ? Math.max(1, parseInt(args[minArg + 1], 10) || MIN_EVIDENCE) : MIN_EVIDENCE;
const batchesDir = process.env.BATCHES_DIR ? resolve(process.env.BATCHES_DIR) : join(ROOT, 'batches');
const ratingsFile = process.env.RATINGS_FILE ? resolve(process.env.RATINGS_FILE) : join(ROOT, 'ratings.jsonl');
const tasteFile = process.env.TASTE_FILE ? resolve(process.env.TASTE_FILE) : join(ROOT, 'agent', 'TASTE.md');

const batches = [];
for (const id of (await readdir(batchesDir).catch(() => [])).filter((n) => ID_RE.test(n)).sort()) {
  const b = await loadBatch(batchesDir, id);
  if (b?.ok) batches.push(b.batch);
}
const { events, skipped } = await readRatings(ratingsFile);
const tasteMd = await readFile(tasteFile, 'utf8').catch(() => '');
const a = analyse({ events, batches, tasteMd, min });
if (args.includes('--json')) console.log(JSON.stringify({ ...a, skippedLines: skipped }, null, 2));
else {
  process.stdout.write(renderReport(a));
  if (skipped) console.log(`\n(${skipped} malformed line(s) in ratings.jsonl were skipped)`);
}
