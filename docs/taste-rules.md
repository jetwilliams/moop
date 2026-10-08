# Writing good taste rules

`TASTE.md` is the only memory the loop has. A good rule changes what the next batch sounds like; a bad one is
either ignored or followed into a rut.

## A good rule is

**Specific.** The agent must be able to act on it and you must be able to hear whether it was followed.

| vague | specific |
|---|---|
| "make it better" | "the bass and the kick never hit at the same time" |
| "less busy" | "at most 3–4 audible parts at once; cut any layer you can't name the job of" |
| "more interesting" | "change one audible thing every 8 bars" |
| "nicer highs" | "low-pass hats and noise below about 9 kHz; no bright noise sweeps" |

**Evidence-based.** Every rule carries its counts (`evidence: 6 for · 1 against`) and a `why:` in your own words.
A rule with no evidence is a hypothesis: give it `status: watch` and let the next batches test it.

**Revisable.** Rules get narrowed ("fewer parts" → "fewer parts in the intro"), split when results are mixed, and
retired when they stop earning their place. Retired rules stay in the file with the reason, so the agent doesn't
re-invent them next month.

**About sound, not about a song.** "Warm, round low end with lots of space" is a rule. "Make it like <track>" is not.

## References are vibes, not templates

It's useful to say "I love how <track> feels". It's not useful (or OK) for the agent to copy it.

- Take **one quality** from a reference and name it in plain words: the space, the swing, the way the drop is quiet
  before it lands. Write the rule about that quality.
- Never put a reference's melody, chord progression, hook, lyric or arrangement into a rule. Never transcribe one.
- Don't let one reference become the identity. Two references that pull in different directions usually describe
  your taste better than one.

## A loved thing becomes an option, not the default

When something gets five stars, the temptation is to make everything sound like it. Don't. Add it to **Options** and
use it in about 1 item in 4. Repeating a hit wears it out, and a batch of near-copies teaches you nothing new.

## Keep the set small

About 25 active rules is plenty. If two rules always appear together, merge them. If a rule hasn't been tested in
five batches, either test it (a wildcard can break it) or retire it.

## Statuses

| status | meaning |
|---|---|
| `watch` | new or mixed evidence; test it |
| `active` | a default; follow it |
| `strong` | well supported over several batches; follow it unless a wildcard is testing it |
| `option` | a loved idea; about 1 in 4 items |
| `retired` | stopped earning its place; kept for history |

Hard limits (licences, ear safety, "never copy a melody") live in the **Never** section. They are not rules to be
voted on.

## Comments are data

What you type in the lab is evidence about the music. The agent quotes it and counts it; it never treats a comment as
an instruction to do something else.
