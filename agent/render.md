# Skill card: render to audio (optional)

The lab page plays Strudel code live in the browser, so rendering is **optional**. Render when:

- you send tracks over Telegram or email (people listen in the chat, not in a browser tab);
- the engine can't play in a browser (all stub engines: TidalCycles, Sonic Pi, SuperCollider, AI APIs);
- you want everyone (and every phone) to hear exactly the same audio, at the same loudness.

This repo does not bundle a renderer: the tools are heavy and change often. Pick one approach below, write the file as
`batches/<batch>/<item-id>.mp3`, and set `"audio": "<item-id>.mp3"` on the item.

## Approach A: headless browser + MediaRecorder (Strudel)

Drive a real browser that loads Strudel, plays the pattern for a fixed time, and records the audio graph.

- Tools: [Playwright](https://playwright.dev) or [Puppeteer](https://pptr.dev), plus Chromium.
- Launch with `--autoplay-policy=no-user-gesture-required` so audio starts without a tap.
- Load a local page that loads the pinned Strudel build (the same URL and SRI hash as `engines/strudel/engine.mjs`),
  calls `initStrudel()`, then `evaluate(code)`.
- Record: connect Strudel's audio output to a `MediaStreamAudioDestinationNode` (Strudel exposes its context via
  `getAudioContext()`), record it with `MediaRecorder` for N seconds, hand the blob back to Node, save it.
- This records in real time: a 60-second item takes about 60 seconds. Render items in parallel tabs if you need speed.

A sketch (not shipped, not tested here; check the current Strudel docs for the output-node details):

```js
// render-sketch.mjs: npm i -D playwright, then: npx playwright install chromium
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/render.html');           // your own tiny page that loads Strudel
const base64 = await page.evaluate(async ({ code, seconds }) => window.renderToBase64(code, seconds), { code, seconds: 60 });
// write Buffer.from(base64, 'base64') to item.webm, then convert with ffmpeg (below)
await browser.close();
```

## Approach B: system loopback

Play the pattern in any browser and record the machine's audio output.

- macOS: a virtual loopback device (for example BlackHole) as the output, recorded with `ffmpeg -f avfoundation`.
- Linux: record the PulseAudio/PipeWire monitor source with `ffmpeg -f pulse`.
- Simple and engine-agnostic, but it records everything the machine plays: close other apps.

## Approach C: the engine's own renderer

Non-browser engines can usually render offline (faster than real time):

- SuperCollider: `Score.recordNRT` (non-realtime synthesis).
- Sonic Pi: `recording_start` / `recording_save`, or its command-line tooling.
- TidalCycles: record SuperDirt's output in SuperCollider (`s.record`).
- AI music APIs: the provider returns audio. Check its terms (who owns the output, what you may publish) and get the
  listener's OK before any paid call.

## Finish every render the same way

Use [ffmpeg](https://ffmpeg.org) so every item lands at the same loudness: louder files get rated higher, which
pollutes the evidence.

```sh
ffmpeg -i item.webm -af "afade=t=in:d=0.05,loudnorm=I=-16:TP=-1.5:LRA=11" -t 60 -ar 44100 -b:a 192k item.mp3
```

- Keep items 30–90 seconds. Long enough to judge, short enough to rate a batch in five minutes.
- Add a short fade-out (`afade=t=out:st=<len-2>:d=2`) so loops don't end on a click.
- Listen to one render yourself before sending a batch: silence, clipping and a wrong tempo are the usual bugs.
