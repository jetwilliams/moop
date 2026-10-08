# One-prompt setup

Clone this repo, start your coding agent (Claude Code, Codex or similar) **inside the repo folder**,
and paste the prompt below. The agent checks what you have, asks a few questions about your taste,
sets up the lab, and makes your first batch. Your answers are saved, so you can run the same prompt
again later to change things without starting over.

```text
Set up MOOP for me, using this repository as the guide.

STEP 0 — Read first.
Read README.md, docs/ (how-it-works, taste-rules, sending-to-phone, licensing), agent/ (TASTE.md,
make-batch.md, learn.md, render.md, batch-format.md), engines/README.md and samples/README.md.

STEP 1 — Check what already exists (read-only).
- Is there a moop.answers.md from a previous run? If yes, this is a RE-RUN: show me what's saved and
  ask what I want to change.
- Node.js version (needs 20+). Does `npm test` pass?
- Existing TASTE.md rules, batches/, ratings.jsonl, samples/?
Report what you found in a short list.

STEP 2 — Interview me, one short question at a time. Skip anything already answered.
- What kind of music do you want to grow? Describe the VIBE (energy, mood, tempo, textures),
  not songs to copy. Any artists you like as loose references? (We study feel only; we never copy
  melodies or sample their songs.)
- Anything you already know you dislike?
- How many tracks per batch (default 6: 5 that follow the rules + 1 wildcard)?
- Where will you listen and rate: on this computer, or on your phone? If phone: do you have a
  private network to this machine (e.g. Tailscale)? Never expose the lab to the public internet.
- Sounds: built-in synths only to start, or do you have your own recordings / CC0 samples to add?
- Which music engine? (Strudel is the default and fully built; others are stubs.)

STEP 3 — Plan.
Show me a short plan and wait for my OK.

STEP 4 — Build.
- Turn my answers into a starter agent/TASTE.md: a few clear rules, marked as "starting guesses"
  until ratings prove them. Show me the diff before saving.
- Save my answers to moop.answers.md (gitignored, no secrets).
- If I have samples: set up samples/samples.json for them and remind me to check each licence.
- Run `npm run demo` to check the lab works, then make my FIRST real batch following agent/make-batch.md.
- Start the lab with `npm run lab`. The one-time login link is written to .lab/login-link.txt: tell me
  where it is and how to open it on my device. Never print it in chat.

STEP 5 — Teach me the loop.
Explain in 5 short lines: rate the batch → tell you "learn" → you update TASTE.md from the ratings →
I ask for the next batch → repeat. That's "mooping a track."

Rules for you:
- Ask before installing anything or changing files that already existed.
- Never copy melodies or sample copyrighted songs; references are vibes, not templates.
- Never expose the lab publicly; never print login links or tokens.
```

## Re-running

Run the same prompt any time to change your vibe, batch size, sounds or how you listen. The agent
reads `moop.answers.md` and only changes what you ask it to.
