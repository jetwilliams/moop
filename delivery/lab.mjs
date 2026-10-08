// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// The built-in channel: the lab page (lab/server.mjs). "Delivery" is just the batch appearing in the page's list,
// so notify() only returns a message for you; it sends nothing anywhere.
export default {
  id: 'lab',
  name: 'Lab page',
  stub: false,
  async notify({ batch, labUrl }) {
    return { ok: true, message: `Batch "${batch.title || batch.id}" (${batch.items.length} items) is ready in the lab: ${labUrl}` };
  },
};
