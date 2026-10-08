// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB engine: AI music API. Documented, not implemented. It lets a batch declare "engine": "ai-api" today, as long as
// every item ships a rendered audio file (the lab page plays the audio; it cannot run AI music API code in the browser).
// How to wire it up: The item file is a JSON prompt/spec (no code). A render function calls the provider of your choice and saves the audio. Check the provider's terms: who owns the output, and whether paid calls need your OK first.
export default {
  id: 'ai-api',
  name: 'AI music API',
  fileExt: '.json',
  browserPlayer: null,
  stub: true,
  render: async () => { throw new Error('AI music API render is not implemented: see engines/README.md'); },
  docs: 'docs/how-it-works.md#engines',
};
