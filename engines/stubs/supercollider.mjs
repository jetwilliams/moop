// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB engine: SuperCollider. Documented, not implemented. It lets a batch declare "engine": "supercollider" today, as long as
// every item ships a rendered audio file (the lab page plays the audio; it cannot run SuperCollider code in the browser).
// How to wire it up: Write an .scd score; render offline with Score.recordNRT (non-realtime) to WAV, then ship the audio with the item.
export default {
  id: 'supercollider',
  name: 'SuperCollider',
  fileExt: '.scd',
  browserPlayer: null,
  stub: true,
  render: async () => { throw new Error('SuperCollider render is not implemented: see engines/README.md'); },
  docs: 'https://supercollider.github.io',
};
