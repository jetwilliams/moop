// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB engine: TidalCycles. Documented, not implemented. It lets a batch declare "engine": "tidal" today, as long as
// every item ships a rendered audio file (the lab page plays the audio; it cannot run TidalCycles code in the browser).
// How to wire it up: Write Tidal code; render with SuperDirt + a recording (e.g. SuperCollider's Server.record) to WAV, then ship the audio with the item.
export default {
  id: 'tidal',
  name: 'TidalCycles',
  fileExt: '.tidal',
  browserPlayer: null,
  stub: true,
  render: async () => { throw new Error('TidalCycles render is not implemented: see engines/README.md'); },
  docs: 'https://tidalcycles.org',
};
