import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBatch, loadBatch } from '../lib/batch.mjs';
import { goodBatch, tempProject } from './helpers.mjs';
import { join } from 'node:path';
import { rm, writeFile } from 'node:fs/promises';

test('a well-formed batch passes with no warnings', () => {
  const r = validateBatch(goodBatch());
  assert.equal(r.ok, true, r.errors.join('\n'));
  assert.deepEqual(r.warnings, []);
});

test('rejects non-objects and empty item lists', () => {
  assert.equal(validateBatch(null).ok, false);
  assert.equal(validateBatch([]).ok, false);
  assert.equal(validateBatch({ id: 'x', items: [] }).ok, false);
});

test('rejects bad ids, duplicates and path tricks in file names', () => {
  const b = goodBatch();
  b.id = 'Bad ID';
  b.items[1].id = 'a1';
  b.items[2].file = '../secret.js';
  b.items[3].file = 'w1.mp3';
  const r = validateBatch(b);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.startsWith('id:')));
  assert.ok(r.errors.some((e) => e.includes('duplicate')));
  assert.ok(r.errors.some((e) => e.startsWith('items[2].file')));
  assert.ok(r.errors.some((e) => e.startsWith('items[3].file')));
});

test('at most one wildcard; none is only a warning', () => {
  const two = goodBatch();
  two.items[0].wildcard = true;
  assert.equal(validateBatch(two).ok, false);
  const none = goodBatch();
  none.items[3].wildcard = false;
  delete none.items[3].breaks;
  const r = validateBatch(none);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => w.includes('no wildcard')));
});

test('rule references and tags are checked', () => {
  const b = goodBatch();
  b.items[0].follows = ['rule-1'];
  b.items[1].tags = ['Has Spaces'];
  const r = validateBatch(b);
  assert.ok(r.errors.some((e) => e.startsWith('items[0].follows')));
  assert.ok(r.errors.some((e) => e.startsWith('items[1].tags')));
});

test('unknown engines fail; stub engines need rendered audio', () => {
  const unknown = goodBatch();
  unknown.engine = 'nope';
  assert.equal(validateBatch(unknown).ok, false);
  const stub = goodBatch();
  stub.items[0] = { id: 'a1', title: 'One', file: 'a1.scd', engine: 'supercollider' };
  assert.ok(validateBatch(stub).errors.some((e) => e.includes('rendered audio file is required')));
  stub.items[0].audio = 'a1.mp3';
  assert.equal(validateBatch(stub).ok, true);
});

test('loadBatch checks files exist and the folder name matches', async () => {
  const root = await tempProject();
  const dir = join(root, 'batches');
  assert.equal((await loadBatch(dir, 'b-001')).ok, true);
  assert.equal(await loadBatch(dir, '../etc'), null);
  await rm(join(dir, 'b-001', 'a2.js'));
  const missing = await loadBatch(dir, 'b-001');
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some((e) => e.includes('not found')));
  const b = goodBatch(); b.id = 'other';
  await writeFile(join(dir, 'b-001', 'batch.json'), JSON.stringify(b));
  assert.ok((await loadBatch(dir, 'b-001')).errors.some((e) => e.includes('must match its folder')));
  await rm(root, { recursive: true, force: true });
});
