import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sentiment, parseTaste, ruleEvidence, joinRatings, tagStats, suggest, analyse, renderReport } from '../lib/taste.mjs';
import { latestRatings, normalizeRating, parseRatings, cleanText } from '../lib/ratings.mjs';
import { goodBatch } from './helpers.mjs';

const ev = (item, extra) => ({ ts: 't', batch: 'b-001', item, ...extra });

test('sentiment: verdict wins, then stars', () => {
  assert.equal(sentiment({ verdict: 'keep', stars: 1 }), 1);
  assert.equal(sentiment({ verdict: 'bin', stars: 5 }), -1);
  assert.equal(sentiment({ stars: 5 }), 1);
  assert.equal(sentiment({ stars: 4 }), 1);
  assert.equal(sentiment({ stars: 3 }), 0);
  assert.equal(sentiment({ stars: 2 }), -1);
  assert.equal(sentiment({ comment: 'hm' }), 0);
  assert.equal(sentiment(null), 0);
});

test('latest rating per item wins, and clear removes it', () => {
  const m = latestRatings([ev('a1', { stars: 2 }), ev('a1', { stars: 5 }), ev('a2', { stars: 4 }), ev('a2', { clear: true })]);
  assert.equal(m.get('b-001/a1').stars, 5);
  assert.equal(m.has('b-001/a2'), false);
});

test('parseRatings skips malformed lines', () => {
  const { events, skipped } = parseRatings('{"batch":"b","item":"i","stars":3}\nnot json\n{"nope":1}\n\n');
  assert.equal(events.length, 1);
  assert.equal(skipped, 2);
});

test('normalizeRating validates and cleans', () => {
  assert.equal(normalizeRating({ batch: 'b-001', item: 'a1', stars: 6 }).ok, false);
  assert.equal(normalizeRating({ batch: 'b-001', item: 'a1', verdict: 'love' }).ok, false);
  assert.equal(normalizeRating({ batch: '../x', item: 'a1', stars: 3 }).ok, false);
  assert.equal(normalizeRating({ batch: 'b-001', item: 'a1' }).ok, false, 'empty ratings are rejected');
  const r = normalizeRating({ batch: 'b-001', item: 'a1', stars: 4, verdict: 'keep', comment: 'nice\u0000 ‮flip\n\nok', extra: 'dropped' });
  assert.equal(r.ok, true);
  assert.equal(r.rating.comment, 'nice flip ok');
  assert.equal('extra' in r.rating, false);
  assert.equal(normalizeRating({ batch: 'b-001', item: 'a1', clear: true }).rating.clear, true);
  assert.equal(cleanText('x'.repeat(2000)).length, 1000);
});

test('rule evidence: following + liked counts for, breaking + liked counts against', () => {
  const batch = goodBatch();
  const latest = latestRatings([
    ev('a1', { verdict: 'keep' }),          // follows R1, liked → R1 for
    ev('a2', { stars: 5, comment: 'yes' }), // follows R1,R2, liked → R1 for, R2 for
    ev('a3', { stars: 1 }),                 // follows R2, disliked → R2 against
    ev('w1', { verdict: 'keep' }),          // breaks R2, liked → R2 against
  ]);
  const rows = joinRatings(latest, [batch]);
  const e = ruleEvidence(rows);
  assert.deepEqual([e.R1.for, e.R1.against], [2, 0]);
  assert.deepEqual([e.R2.for, e.R2.against, e.R2.wildcardTests], [1, 2, 1]);
  assert.equal(e.R1.comments.length, 1);
});

test('a disliked wildcard counts FOR the rule it broke', () => {
  const rows = joinRatings(latestRatings([ev('w1', { verdict: 'bin' })]), [goodBatch()]);
  assert.equal(ruleEvidence(rows).R2.for, 1);
});

test('tag stats count likes, dislikes and mean stars', () => {
  const rows = joinRatings(latestRatings([ev('a1', { stars: 5 }), ev('a2', { stars: 2 }), ev('a3', { verdict: 'keep' })]), [goodBatch()]);
  const s = tagStats(rows);
  assert.deepEqual(s['tempo:slow'], { n: 2, liked: 1, disliked: 1, meanStars: 3.5 });
  assert.deepEqual(s['tempo:fast'], { n: 1, liked: 1, disliked: 0, meanStars: null });
});

const TASTE = `# TASTE
## Active rules
### R1 · Few parts
- rule: three or four parts
- status: active
### R2 · Change every 8 bars
- status: active
## Never
### R9 · No sampled songs
- status: never
`;

test('parseTaste reads ids, titles, fields and sections', () => {
  const rules = parseTaste(TASTE);
  assert.deepEqual(rules.map((r) => r.id), ['R1', 'R2', 'R9']);
  assert.equal(rules[0].title, 'Few parts');
  assert.equal(rules[0].fields.rule, 'three or four parts');
  assert.equal(rules[2].section, 'Never');
});

test('suggest: strengthen with clear support, review when evidence turns, watch below the minimum', () => {
  const rules = parseTaste(TASTE);
  const s = suggest({ R1: { for: 4, against: 1 }, R2: { for: 1, against: 3 }, R9: { for: 0, against: 9 } }, rules, {}, { min: 3 });
  const by = Object.fromEntries(s.map((x) => [x.id, x.action]));
  assert.equal(by.R1, 'strengthen');
  assert.equal(by.R2, 'review');
  assert.equal(by.R9, undefined, '"never" rules are not up for a vote');
  const thin = suggest({ R1: { for: 2, against: 0 } }, rules, {}, { min: 3 });
  assert.equal(thin.find((x) => x.id === 'R1').action, 'watch');
});

test('suggest proposes rules from tags with a consistent signal only', () => {
  const s = suggest({}, [], { 'bass:sub': { n: 4, liked: 4, disliked: 0 }, 'mood:mixed': { n: 4, liked: 2, disliked: 2 }, 'lead:arp': { n: 3, liked: 0, disliked: 3 } }, { min: 3 });
  const tags = s.filter((x) => x.kind === 'tag');
  assert.deepEqual(tags.map((t) => [t.id, t.direction]), [['bass:sub', 'like'], ['lead:arp', 'avoid']]);
});

test('analyse + renderReport produce a readable report end to end', () => {
  const events = [ev('a1', { stars: 5 }), ev('a2', { verdict: 'keep', comment: 'more of this' }), ev('a3', { stars: 4 }), ev('w1', { verdict: 'bin', comment: 'too busy' })];
  const a = analyse({ events, batches: [goodBatch()], tasteMd: TASTE, min: 3 });
  assert.equal(a.totals.rated, 4);
  assert.equal(a.evidence.R2.for, 3); // a2 + a3 followed and liked, w1 broke it and was binned
  assert.equal(a.suggestions.find((x) => x.id === 'R2').action, 'strengthen');
  const md = renderReport(a);
  assert.match(md, /# Taste report/);
  assert.match(md, /\*\*R2\*\* \(Change every 8 bars\): STRENGTHEN/);
  assert.match(md, /> too busy/);
});
