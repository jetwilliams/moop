# samples/

Add your own recordings or CC0 sounds here. This folder ships **empty on purpose**: no audio files are included.

Everything in here except this README and `samples.example.json` is git-ignored, so your sounds stay on your machine.

## The map: samples.json

Strudel finds sounds through a JSON map. Copy `samples.example.json` to `samples.json` and edit it:

```json
{
  "_base": "/samples/",
  "kick": ["drums/kick-01.wav", "drums/kick-02.wav"],
  "shaker": ["perc/shaker-01.wav"],
  "pad": { "c3": "keys/pad-c3.wav", "c4": "keys/pad-c4.wav" }
}
```

- `_base` is prepended to every path. `/samples/` is where the lab serves this folder.
- A **list** gives numbered variations: `s("kick")` plays the first, `s("kick:1")` the second.
- An **object of notes** makes a pitched instrument: `note("e3 g3").s("pad")` repitches from the nearest note.
- Folders are fine (`drums/kick-01.wav`). Names: letters, digits, `-`, `_`, `.`. Formats: wav, mp3, ogg, flac, m4a.

## Pointing Strudel at it

- **In the lab:** nothing to do. If `samples/samples.json` exists, the lab loads it before playing anything, and the
  page may only fetch from its own origin (Content-Security-Policy), so sounds must live here.
- **At strudel.cc:** host the folder somewhere with CORS enabled and put `samples('https://your-host/samples.json')`
  at the top of your code. Or load a GitHub repo of your own: `samples('github:<user>/<repo>')`.
- **In batches:** the agent writes `s("kick")` etc. and never fetches sound from other URLs (`agent/make-batch.md`).

## Where to find sounds you can actually use

"Free to download" is **not** "free to use". Check the licence of **every** file, keep a note of where each came
from, and prefer CC0 (public domain dedication: no conditions).

- **Record your own.** A phone and a quiet room give you claps, knocks, breaths, keys, kitchenware. Yours, outright.
- **[Freesound](https://freesound.org):** use the licence filter and pick **Creative Commons 0**. Many Freesound files
  are CC-BY (credit required) or CC-BY-NC (no commercial use): those are not CC0.
- **[OpenGameArt](https://opengameart.org):** filter by licence, choose CC0.
- **[Kenney](https://kenney.nl/assets):** game asset packs, including audio, released as CC0.
- **Synthesize it.** Strudel's built-in oscillators and noise need no samples at all (see `patterns/examples`).

Be careful with: "royalty-free" packs (a licence with conditions, not public domain), sites with their own custom
licence, sample packs that came "with" something, and anything ripped from a song, film, game or video. Never sample
copyrighted recordings. See `docs/licensing.md`.

## Keep a ledger

Add a line per sound to a `SOURCES.md` you keep next to `samples.json` (it is git-ignored too unless you un-ignore
it): file, source URL, licence, date. Future you will thank you when a track gets released.
