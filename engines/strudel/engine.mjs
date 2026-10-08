// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// The Strudel engine (https://strudel.cc, AGPL-3.0-or-later). Nothing from Strudel is bundled in this repo:
// the lab page loads the official @strudel/web build from the jsDelivr npm CDN at runtime, pinned to one version and
// checked with Subresource Integrity, so a tampered or changed file is refused by the browser.
// To change version: set STRUDEL_SCRIPT_URL and STRUDEL_SCRIPT_INTEGRITY (sha384, see docs/how-it-works.md).
const VERSION = '1.3.0';
const DEFAULT_URL = `https://cdn.jsdelivr.net/npm/@strudel/web@${VERSION}/dist/index.js`;
const DEFAULT_SRI = 'sha384-Be7toEZy01lox8utUZEOBM2nCd1jVX8R9A3YwfZ7j5kBTv/MKy+LlCbTWqE97W8x';

function browserPlayer(env = process.env) {
  const script = env.STRUDEL_SCRIPT_URL || DEFAULT_URL;
  // A custom URL needs its own hash; never reuse the pinned hash for a different file.
  const integrity = env.STRUDEL_SCRIPT_URL ? (env.STRUDEL_SCRIPT_INTEGRITY || '') : DEFAULT_SRI;
  let origin;
  try { origin = new URL(script).origin; } catch { origin = null; }
  if (!origin || !/^https:\/\//.test(script)) throw new Error('STRUDEL_SCRIPT_URL must be an https URL');
  return { script, integrity, origins: [origin], player: '/engines/strudel/player.js' };
}

export default {
  id: 'strudel',
  name: 'Strudel',
  version: VERSION,
  fileExt: '.js',
  get browserPlayer() { return browserPlayer(); },
  browserPlayerFor: browserPlayer,
  render: null, // headless rendering is documented in agent/render.md (browser automation), not bundled
  docs: 'https://strudel.cc/learn/',
};
