# Licensing

*This is a plain-language summary, not legal advice.*

## This repository: AGPL-3.0-or-later

Copyright (c) 2026 Jet Williams. Licensed under the GNU Affero General Public License, version 3 or (at your option)
any later version. Full text in `LICENSE`.

**Why AGPL.** The lab page exists to load and run [Strudel](https://strudel.cc), which is licensed
AGPL-3.0-or-later, and to serve that experience to a browser over a network. This repo deliberately does **not**
bundle Strudel: the browser fetches the official `@strudel/web` build from the jsDelivr npm CDN at runtime, pinned to
one version and checked with Subresource Integrity. Even so, the page is built around Strudel and is meant to run
alongside it, so we use the same licence. It is the simple, safe, compatible choice, and it keeps the whole project
in the same spirit as the tool it depends on.

What AGPL asks of you, in short: you may use, study, change and share this code. If you distribute it, or **run a
modified version that other people interact with over a network**, you must offer those people the source of your
version under the same licence. Running it privately for yourself asks nothing of you.

**Exception: the example patterns.** `patterns/examples/*.js` are dedicated to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Use them however you like.

## Your music is yours

The AGPL covers the **code of this tool**, not what you make with it. The patterns your agent writes for you, the
songs you shape through your ratings, and the audio you render are your work (and your agent's, under whatever terms
your agent provider sets; check them). The licence of a program does not normally extend to its output unless the
output contains parts of the program itself. Strudel pattern code is your own code calling Strudel's functions.

If you plan to release music commercially, check the terms of the AI service that wrote the code, too.

## Sounds and samples

The example patterns use **only Strudel's built-in synthesizers** (sine, triangle, square, sawtooth, white and pink
noise, and the synthesized kick `sbd`). They load no sample banks and no audio files.

The strudel.cc website can load sample collections by default (for example drum-machine and general sample banks
hosted elsewhere). Those collections come from many sources with different, sometimes unclear, licences, so this
project does not rely on them. If you use any sample pack, **check its licence yourself**.

For your own `samples/` folder:

- Prefer your own recordings and **CC0** sounds. CC-BY means you must credit the author. **NC** (non-commercial) and
  **ND** (no derivatives) licences rule out common uses. "Royalty-free" is a licence with conditions, not public
  domain.
- **"Free to download" is not "free to use".** Read the licence of every file and keep a ledger (file, source, licence).
- See `samples/README.md` for sources that let you filter by CC0.

## Never sample copyrighted songs. Don't copy melodies.

- Don't put recordings of other people's music (songs, stems, acapellas, loops ripped from tracks, film or game audio)
  into `samples/`, a pattern, or a render, unless you hold a licence for that use.
- Don't ask the agent to transcribe or reproduce a melody, hook, riff, chord progression *as arranged* or lyrics from
  an existing work. Melodies are protected even when you re-create them in code with your own sounds.
- Use references for **feel** only ("more space", "a warmer low end"), as described in `docs/taste-rules.md`. The
  agent's skill cards (`agent/make-batch.md`) say the same.

## Third-party names

Strudel, TidalCycles, Sonic Pi, SuperCollider, Tailscale, Telegram, Freesound and others are named only to describe
compatibility. They belong to their owners, and this project is not affiliated with or endorsed by them.
