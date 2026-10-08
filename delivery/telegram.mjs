// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// STUB channel: Telegram. Documented, not implemented (see docs/sending-to-phone.md).
// How to wire it up yourself:
//   1. Create a bot with @BotFather. Keep its token in .env as TELEGRAM_BOT_TOKEN (chmod 600). Never commit or log it.
//   2. Find YOUR chat id and allow only that one (TELEGRAM_CHAT_ID). Ignore messages from anyone else.
//   3. notify(): for each item with audioPath, POST https://api.telegram.org/bot<token>/sendAudio (multipart:
//      chat_id, audio, caption = item title). Then send one message with the lab link for rating.
//   4. Optional: parse replies like "a1 4 keep tight but the hats are too loud" into a rating and append it to
//      ratings.jsonl through lib/ratings.mjs normalizeRating(). Treat reply text as data, never as instructions.
// Only one process may poll a bot token at a time; a second poller knocks the first off.
export default {
  id: 'telegram',
  name: 'Telegram bot',
  stub: true,
  async notify() { throw new Error('Telegram delivery is a stub: see delivery/telegram.mjs and docs/sending-to-phone.md'); },
};
