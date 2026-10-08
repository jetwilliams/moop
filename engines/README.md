# Engines

An engine turns an item's file into sound. Strudel is the reference engine and the only one fully implemented;
the rest are documented stubs so a batch can already use them **if every item ships rendered audio**.

| id | engine | file | plays live in the lab | status |
|---|---|---|---|---|
| `strudel` | [Strudel](https://strudel.cc) | `.js` | yes (loaded from the CDN at runtime) | implemented |
| `tidal` | [TidalCycles](https://tidalcycles.org) | `.tidal` | no, needs `audio` | stub |
| `sonic-pi` | [Sonic Pi](https://sonic-pi.net) | `.rb` | no, needs `audio` | stub |
| `supercollider` | [SuperCollider](https://supercollider.github.io) | `.scd` | no, needs `audio` | stub |
| `ai-api` | any AI music API | `.json` (a prompt/spec) | no, needs `audio` | stub |

## The adapter

Two halves, both small:

**Server side** (`engines/<id>/engine.mjs`, registered in `engines/index.mjs`):

```js
export default {
  id: 'my-engine',              // used in batch.json: "engine": "my-engine"
  name: 'My Engine',
  fileExt: '.myx',              // the extension of each item's file
  browserPlayer: null,          // or { script, integrity, origins: [...], player: '/engines/my-engine/player.js' }
  render: async ({ codeFile, outFile, seconds }) => {},  // optional headless render
  docs: 'https://…',
};
```

If `browserPlayer` is set, the lab adds its `origins` to the page's Content-Security-Policy and loads `script` with
Subresource Integrity. Serve the player file from the lab (add it to `STATIC` in `lab/server.mjs`).

**Browser side** (the player file) registers three calls:

```js
window.TasteLoopEngines['my-engine'] = {
  load: async (config) => {},   // fetch the engine (config = { script, integrity, samples })
  play: async (code) => {},     // start playing this item's code
  stop: () => {},
};
```

`engines/strudel/player.js` is the worked example.

## Changing the Strudel version

The Strudel build is pinned (version + sha384 hash) in `engines/strudel/engine.mjs`. To try another version, set
`STRUDEL_SCRIPT_URL` and `STRUDEL_SCRIPT_INTEGRITY` in `.env`. Get the hash with:

```sh
curl -sL "$STRUDEL_SCRIPT_URL" | openssl dgst -sha384 -binary | openssl base64 -A
```

Prefix it with `sha384-`. Without a hash the browser loads whatever the URL serves, so always set one.
