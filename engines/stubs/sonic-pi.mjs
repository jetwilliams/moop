// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB engine: Sonic Pi. Documented, not implemented. It lets a batch declare "engine": "sonic-pi" today, as long as
// every item ships a rendered audio file (the lab page plays the audio; it cannot run Sonic Pi code in the browser).
// How to wire it up: Write a Sonic Pi buffer; render with recording_start/recording_save or the command-line tools, then ship the audio with the item.
export default {
  id: 'sonic-pi',
  name: 'Sonic Pi',
  fileExt: '.rb',
  browserPlayer: null,
  stub: true,
  render: async () => { throw new Error('Sonic Pi render is not implemented: see engines/README.md'); },
  docs: 'https://sonic-pi.net',
};
