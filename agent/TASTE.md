# TASTE.md

The living brief for every batch. The agent rewrites it after each round of ratings (see `learn.md`); you can edit it
any time, and **what you say beats any rule in here**.

- **Version:** 1 <!-- bump on every edit; each batch.json records the tasteVersion it followed -->
- **Updated:** (date)

## How to read this file

Each rule is a `### R<n> · <short name>` heading followed by fields. Tools parse the headings and fields, so keep the shape.

- `rule:` the instruction, specific enough to act on and to check
- `why:` the evidence in words (quote your own comments, never paste lyrics or melodies from reference songs)
- `evidence:` counts from `npm run report` (`N for · M against`)
- `status:` `active` · `strong` (well supported) · `watch` (new or mixed) · `option` (loved, use about 1 in 4) · `retired`
- `since:` the batch where the rule was born

Rule ids are never reused. Retired rules move to **Retired** with a reason; they are not deleted.

## Never

Hard limits. Not up for a vote, not counted as evidence.

- Never sample or re-record copyrighted songs, and never copy a melody, hook or lyric from a reference track.
- Only built-in synths, your own recordings, or sounds whose licence you have checked (see `docs/licensing.md`).

## Active rules

### R1 · Fewer parts
- rule: At most 3–4 clearly audible parts at any moment. If you can't say what a layer does, cut it.
- why: (starter example) busy batches tend to get binned; space makes each sound count.
- evidence: 0 for · 0 against
- status: watch
- since: starter

### R2 · A loved thing becomes an option, not the default
- rule: When something gets loved (5 stars or a strong comment), add it as an option and use it in about 1 in 4 items. Never make it the new house style.
- why: (starter example) repeating a hit until it is the only thing you make wears it out fast.
- evidence: 0 for · 0 against
- status: active
- since: starter

### R3 · Change something every 8 bars
- rule: Every 8 bars, change one thing you can hear: a part enters or leaves, the filter moves, the chord changes. Never 16 identical bars.
- why: (starter example) loops that never move feel like a demo, not a track.
- evidence: 0 for · 0 against
- status: watch
- since: starter

## Options

Loved ideas the agent can reach for in about 1 in 4 items (see R2). One line each: the idea and where it came from.

- (empty)

## Watch list

Hunches from comments or tags that don't have enough evidence yet. Promote to a rule at 3+ consistent data points,
or straight away when you state it outright ("always…", "never…", "I hate…").

- (empty)

## Retired

Rules that stopped earning their place. Keep the id, the reason and the batch where it was retired.

- (empty)

## Changelog

- v1 · starter file
