# Batch folder format

One batch = one folder in `batches/`, named after the batch id. Small batches get rated; big ones get skipped,
so aim for **5–8 items** (24 is the hard limit).

```
batches/
  2026-02-01-a/
    batch.json          # required: the manifest below
    a1.js               # one pattern file per item (the engine decides the extension; Strudel = .js)
    a1.mp3              # optional rendered audio (required for engines that can't play in the browser)
    a2.js
    ...
```

## batch.json

```json
{
  "id": "2026-02-01-a",
  "title": "Round 4: slower, more space",
  "created": "2026-02-01",
  "engine": "strudel",
  "tasteVersion": 4,
  "items": [
    {
      "id": "a1",
      "title": "Glass stairs II",
      "file": "a1.js",
      "audio": "a1.mp3",
      "notes": "Arp in A minor, 104 bpm, filter opens over 16 bars.",
      "follows": ["R1", "R3"],
      "tags": ["tempo:mid", "lead:arp"]
    },
    {
      "id": "w1",
      "title": "Wildcard: no drums at all",
      "file": "w1.js",
      "notes": "Tests whether R5 (always a kick) is really a rule.",
      "wildcard": true,
      "breaks": ["R5"],
      "tags": ["drums:none"]
    }
  ]
}
```

| field | required | meaning |
|---|---|---|
| `id` | yes | lowercase letters, digits, dashes; must equal the folder name |
| `title` | no | shown in the lab's batch picker |
| `created` | no | ISO date |
| `engine` | no | default engine for items (`strudel` if missing); see `engines/README.md` |
| `tasteVersion` | no | the TASTE.md version this batch followed |
| `items[].id` | yes | unique within the batch; same character rules as `id` |
| `items[].title` | yes | a short name (max 80 chars) |
| `items[].file` | yes | pattern file in this folder, no paths, extension from the engine |
| `items[].audio` | no | rendered `.mp3/.wav/.ogg/.m4a` in this folder. If present, the lab plays it instead of running the code |
| `items[].notes` | no | one or two lines: what this item tries. You see this in the lab |
| `items[].follows` | no | rule ids this item deliberately follows. Ratings become evidence for or against them |
| `items[].breaks` | no | rule ids a wildcard deliberately breaks. A liked wildcard counts AGAINST the rule |
| `items[].tags` | no | up to 12 free tags such as `tempo:slow`, `bass:sub`. Tags with a consistent signal become candidate rules |
| `items[].wildcard` | no | `true` for the one experimental item. At most one per batch |
| `items[].engine` | no | override the batch engine for one item |

Validate with `npm run check` (or `npm run check -- <batch-id>`). The lab hides invalid batches.

## ratings.jsonl (what comes back)

The lab appends one line per save. The latest line per `batch`/`item` wins; `"clear": true` un-rates an item.

```json
{"ts":"2026-02-01T20:14:03.112Z","batch":"2026-02-01-a","item":"a1","stars":4,"verdict":"keep","comment":"more space like this"}
```

`stars` is 1–5 or null, `verdict` is `keep`, `bin` or null, `comment` is plain text (max 1000 chars).
