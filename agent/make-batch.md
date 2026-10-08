# Skill card: make a batch

**Goal:** write N new pieces of music as code that follow `agent/TASTE.md`, vary inside those rules, and include
exactly one wildcard. Any coding agent can follow this card; nothing here is tied to one model or vendor.

**Inputs:** `agent/TASTE.md`, the latest `npm run report` output (if there are ratings), the list of past batches in
`batches/`, and anything the listener said since the last batch.
**Output:** a valid folder `batches/<batch-id>/` (see `agent/batch-format.md`) and a one-paragraph summary for the listener.

## Steps

1. **Read the brief.** Read `TASTE.md` top to bottom. Note its version. Rules with status `never` and the **Never**
   section are hard limits. `strong` and `active` rules are defaults. `watch` rules are worth testing. Options are
   for about 1 item in 4, not more.
2. **Read the last round.** Skim the latest report and the last two batches. Don't repeat an idea that was binned
   unless you are deliberately testing a rewrite (say so in its notes).
3. **Plan before writing.** Default N = 6 (5 + 1 wildcard). Make a small table: item id, the idea in one line, which
   rules it follows, and what makes it different from its neighbours. Vary at least two of: key or mode, tempo,
   rhythm feel, texture, form. No two items should share a hook shape.
4. **Pick the wildcard.** Exactly one item breaks one rule on purpose (`"breaks": ["R3"]`) or tries something no rule
   covers yet (use `tags`). Write in its `notes` what it is testing. The wildcard is how rules get challenged and new
   ideas earn their way in, so make it a fair test: break one thing, keep the rest good.
5. **Write the code.** One file per item, `<item-id>.js` for Strudel. Rules for the code:
   - Original material only. Never transcribe or imitate a reference melody, hook or lyric. References are vibes,
     not templates: take one quality ("more space", "a warmer low end") and make it your own.
   - Sound sources: the engine's built-in synths, or the listener's own sample map in `samples/` (see
     `samples/README.md`). Don't fetch sounds from random URLs.
   - Ear-safe: keep master gain modest (individual parts around 0.2–0.6 with Strudel's `.gain`), tame harsh highs
     (`.lpf`), no sudden full-scale noise bursts. People rate on earbuds.
   - Self-contained: no network calls, no timers, no DOM access. The code is evaluated in the listener's browser.
   - Set the tempo at the top (`setcpm(bpm / 4)` in Strudel) and comment each part in one short line.
   - Aim for a piece that holds up for 1–2 minutes of looping, with movement every 8 bars (if your rules want it).
6. **Write `batch.json`.** Fill `follows`, `breaks`, `tags` and `notes` honestly: they are what turns ratings into
   evidence. Use consistent tag names across batches (`tempo:slow`, not `slow-tempo` one week and `chill` the next).
   Set `tasteVersion` to the TASTE.md version you followed.
7. **Check.** Run `npm run check -- <batch-id>`. Fix every error. A "no wildcard" warning means step 4 was skipped.
8. **Optional render.** If the listener rates from Telegram/email or the engine can't play in a browser, render
   audio (`agent/render.md`) and set each item's `audio`.
9. **Hand off.** Tell the listener the batch is ready (lab page link or your delivery channel) in two or three lines:
   what this round tries, and which item is the wildcard. Then stop. **Approval stays human:** you never rate,
   keep, publish or post anything on their behalf.

## Batch id

Use a sortable id: `YYYY-MM-DD-a` (then `-b`, `-c` the same day). The lab lists newest first by id.

## Common mistakes

- Ten items that are one idea in ten keys. Fewer, more different items teach more.
- Making the last loved thing the new default. That is what options (about 1 in 4) are for.
- A wildcard that breaks five rules at once: if it's binned, you learn nothing.
- Tags that describe intent instead of sound (`tags: ["good"]`).
