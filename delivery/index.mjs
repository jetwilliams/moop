// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// Delivery channels: how a finished batch reaches you. Swap any part.
// A channel exports { id, name, stub, notify({ batch, items, labUrl }) }:
//   batch  the parsed batch.json       items  [{ id, title, notes, audioPath|null }]       labUrl  where to rate it
// notify() only TELLS you a batch is ready (and may attach audio). Ratings always come back through the lab page
// (or your own reply parser), and nothing is ever approved, published or posted on your behalf.
import lab from './lab.mjs';
import telegram from './telegram.mjs';
import email from './email.mjs';

const CHANNELS = new Map([lab, telegram, email].map((c) => [c.id, c]));
export const getChannel = (id) => CHANNELS.get(id) || null;
export const listChannels = () => [...CHANNELS.values()];
