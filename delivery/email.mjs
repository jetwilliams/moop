// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB channel: email. Documented, not implemented.
// How to wire it up yourself: send one message to your own address with the lab link and (optionally) the rendered
// MP3s attached, through your provider's SMTP or API. Keep credentials in .env, never in code. Ratings still happen
// in the lab page, so the message only needs the link.
export default {
  id: 'email',
  name: 'Email',
  stub: true,
  async notify() { throw new Error('Email delivery is a stub: see delivery/email.mjs'); },
};
