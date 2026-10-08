# How it works

Four moving parts, each swappable:

| part | default | swap it for |
|---|---|---|
| **the writer** | any coding agent following `agent/make-batch.md` | another agent, another model, or you |
| **the engine** | Strudel, live in the browser | TidalCycles, Sonic Pi, SuperCollider, an AI music API (`engines/`) |
| **the delivery** | the private lab page | Telegram, email (`delivery/`) |
| **the renderer** | none needed for Strudel | headless browser, loopback recording, the engine's own (`agent/render.md`) |

The fixed point in the middle is the data: `batch.json` going out, `ratings.jsonl` coming back, `TASTE.md` carrying
what was learned. As long as those three formats hold, any part can change.

## One round

1. **Make.** The agent reads `agent/TASTE.md` and writes `batches/<id>/`: 5–8 pattern files plus `batch.json`,
   one item marked as the wildcard. Each item lists the rules it `follows`, the rule a wildcard `breaks`, and
   free `tags`. `npm run check` validates it.
2. **Deliver.** The batch shows up in the lab page (newest first). Optional: render audio and/or notify yourself
   through another channel.
3. **Rate.** On your phone: play each item, give it 1–5 stars, keep or bin, and a comment if something stood out.
   Every save appends one line to `ratings.jsonl`. Five minutes per batch is the target.
4. **Learn.** The agent runs `npm run report`, which joins ratings to items and counts evidence for every rule and
   tag, then follows `agent/learn.md` to edit `TASTE.md`: strengthen, narrow, retire, propose, add options. Version
   bumped, changelog line added.
5. Repeat. Over a few rounds the rules stop being guesses and start being *your* taste, written down.

## Why the counting is in code

The agent is good at reading comments and writing rules; it is not reliable at tallying 40 ratings across six
batches in its head. `lib/taste.mjs` does the arithmetic the same way every time:

- **Sentiment** per item: `keep` → liked, `bin` → disliked; with no verdict, 4–5 stars → liked, 1–2 → disliked,
  3 → neutral. The verdict wins when they disagree.
- **Rule evidence:** following a rule and being liked counts *for* it; being disliked counts *against* it. A wildcard
  that **breaks** a rule flips that: liked counts *against* the rule, disliked counts *for* it. That is what makes
  wildcards useful: they are the only way a rule can be shown to be wrong rather than just untested.
- **Suggestions** need at least 3 decided data points (configurable): STRENGTHEN when support is at least two to one,
  REVIEW when the evidence has turned against a rule, WATCH otherwise. Tags with a consistent lean (80% one way) are
  PROPOSED as new rules. Rules in the Never section are never put to a vote.

The report suggests; the agent and you decide. Nothing edits `TASTE.md` automatically.

## The lab (security notes)

The lab is a private tool for one person, built like one:

- **Bound to 127.0.0.1** by default. Reach it from your phone through a private network you control (see
  `docs/sending-to-phone.md`). Never port-forward it or put it on the public internet.
- **One-time login links.** `npm run link` writes a link to `.lab/login-link.txt` (file mode 0600). It is never
  printed to the console or logs. Opening it once creates a session cookie (`HttpOnly`, `SameSite=Strict`,
  `Secure` behind HTTPS, 30 days); the link then dies. Unused links expire after 24 hours. Only SHA-256 hashes of
  links and sessions are stored. Failed logins are rate-limited. `npm run link -- --revoke` logs out every device.
- **Strict Content-Security-Policy:** `default-src 'none'`, scripts only from the lab itself and the pinned engine
  CDN origin, no inline scripts or styles, no framing, fetches only to the lab (plus origins you add explicitly).
  `'unsafe-eval'` is allowed because a live-coding engine has to evaluate pattern code; only code from your own
  `batches/` folder is ever evaluated. `data:` and `blob:` script sources are allowed because Strudel loads its
  audio worklets that way.
- **Subresource Integrity:** Strudel is loaded from a pinned version with a sha384 hash. If the CDN file changes,
  the browser refuses to run it.
- **textContent only:** the page never builds HTML from data, so a comment or title can't inject markup.
- **CSRF:** writes need JSON plus a custom `X-Lab` header on top of the `SameSite=Strict` cookie.
- **Input limits:** ids are strict slugs, file names can't contain paths, request bodies are capped at 4 KB,
  comments at 1000 characters with control and bidi characters stripped.

## Engines

See `engines/README.md` for the adapter shape (a server-side descriptor plus a three-call browser player). Strudel is
fully wired; the stubs let you use other engines today as long as each item ships a rendered audio file, which the
lab plays instead of running code.

## Files at a glance

```
agent/        skill cards for the agent + TASTE.md + the batch format
batches/      your batches (git-ignored)
delivery/     delivery channels (lab implemented; Telegram, email stubs)
docs/         you are here
engines/      engine adapters (Strudel implemented; others stubs)
lab/          the private rating page (Node 20, no dependencies)
lib/          batch validation, ratings, auth, taste aggregation
patterns/     original example patterns (CC0)
samples/      your own or CC0 sounds (git-ignored, ships empty)
tools/        link, demo, check, report
test/         node:test suites (npm test)
```
