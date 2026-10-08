// Shared fixtures for the tests.
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const goodBatch = () => ({
  id: 'b-001',
  title: 'Test batch',
  created: '2026-01-31',
  engine: 'strudel',
  tasteVersion: 1,
  items: [
    { id: 'a1', title: 'One', file: 'a1.js', follows: ['R1'], tags: ['tempo:slow'] },
    { id: 'a2', title: 'Two', file: 'a2.js', follows: ['R1', 'R2'], tags: ['tempo:slow'] },
    { id: 'a3', title: 'Three', file: 'a3.js', follows: ['R2'], tags: ['tempo:fast'] },
    { id: 'w1', title: 'Wild', file: 'w1.js', wildcard: true, breaks: ['R2'], tags: ['rhythm:odd'] },
  ],
});

/** A temp project folder with one valid batch on disk. */
export async function tempProject(batch = goodBatch()) {
  const root = await mkdtemp(join(tmpdir(), 'taste-loop-'));
  const dir = join(root, 'batches', batch.id);
  await mkdir(dir, { recursive: true });
  for (const it of batch.items) await writeFile(join(dir, it.file), 'note("c3 e3 g3").s("sine")\n');
  await writeFile(join(dir, 'batch.json'), JSON.stringify(batch));
  await mkdir(join(root, 'samples'), { recursive: true });
  return root;
}
