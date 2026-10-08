#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// npm run demo → copy patterns/examples into batches/demo/ with a batch.json, so you can try the lab right away.
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'batches', 'demo');
try { await access(join(out, 'batch.json')); console.log('batches/demo already exists. Delete it to rebuild.'); process.exit(0); } catch {}
const items = [
  { id: 'ambient-pad', title: 'Slow tide', notes: 'Ambient pad: four blurred chords, a sparse high line, one drone.', follows: ['R1'], tags: ['tempo:slow', 'mood:calm', 'drums:none'] },
  { id: 'house-groove', title: 'Plain house', notes: 'Four-to-the-floor, offbeat bass, two-hit stab. Five parts only.', follows: ['R1', 'R3'], tags: ['tempo:mid', 'drums:four-floor'] },
  { id: 'lowkey-breakbeat', title: 'Late bus', notes: 'Low-key broken beat with swung hats and a dorian stab.', follows: ['R1'], tags: ['tempo:slow', 'drums:broken', 'mood:calm'] },
  { id: 'arpeggio', title: 'Glass stairs', notes: 'Eight-step arpeggio that shifts each bar, breathing filter.', follows: ['R1', 'R3'], tags: ['tempo:mid', 'lead:arp'] },
  { id: 'wildcard-polymeter', title: 'Five against four', notes: 'Wildcard: polymeter, nothing lines up for long.', wildcard: true, breaks: ['R3'], tags: ['rhythm:polymeter', 'lead:bell'] },
];
await mkdir(out, { recursive: true });
for (const it of items) { it.file = `${it.id}.js`; await copyFile(join(ROOT, 'patterns', 'examples', it.file), join(out, it.file)); }
const batch = { id: 'demo', title: 'Demo batch (example patterns)', created: new Date().toISOString().slice(0, 10), engine: 'strudel', tasteVersion: 1, items };
await writeFile(join(out, 'batch.json'), JSON.stringify(batch, null, 2) + '\n');
console.log('Wrote batches/demo/ (5 items). Start the lab with: npm run lab');
