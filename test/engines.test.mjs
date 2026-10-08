import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEngine, listEngines, DEFAULT_ENGINE } from '../engines/index.mjs';
import { listChannels, getChannel } from '../delivery/index.mjs';

test('Strudel is the default engine, pinned with Subresource Integrity', () => {
  const s = getEngine(DEFAULT_ENGINE);
  assert.equal(s.id, 'strudel');
  assert.match(s.browserPlayer.script, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@strudel\/web@\d+\.\d+\.\d+\//);
  assert.match(s.browserPlayer.integrity, /^sha384-/);
});

test('a custom Strudel URL never reuses the pinned hash, and must be https', () => {
  const s = getEngine('strudel');
  const custom = s.browserPlayerFor({ STRUDEL_SCRIPT_URL: 'https://example.org/strudel.js' });
  assert.equal(custom.integrity, '');
  assert.deepEqual(custom.origins, ['https://example.org']);
  assert.throws(() => s.browserPlayerFor({ STRUDEL_SCRIPT_URL: 'http://example.org/strudel.js' }));
});

test('every engine has the adapter shape; stubs say so and need audio', async () => {
  for (const e of listEngines()) {
    assert.equal(typeof e.id, 'string');
    assert.match(e.fileExt, /^\.[a-z]+$/);
    if (e.stub) {
      assert.equal(e.browserPlayer, null);
      await assert.rejects(() => e.render({}));
    }
  }
});

test('delivery channels: the lab works, the others are honest stubs', async () => {
  assert.ok(listChannels().length >= 3);
  const r = await getChannel('lab').notify({ batch: { id: 'b', items: [1, 2] }, labUrl: 'http://127.0.0.1:8787' });
  assert.equal(r.ok, true);
  await assert.rejects(() => getChannel('telegram').notify({}));
  await assert.rejects(() => getChannel('email').notify({}));
});
