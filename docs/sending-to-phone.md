# Sending tracks to your phone

The loop only works if rating is easy: phone in hand, five minutes, done. Two ways in, and in both **approval stays
human**: the agent tells you a batch is ready; only you rate, keep or bin. Nothing is published or posted for you.

## Option 1: the lab page (built in)

1. Start it: `npm run lab`. It listens on `127.0.0.1:8787` only.
2. Make it reachable from your phone **over a private network**, never the open internet. One good way is
   [Tailscale](https://tailscale.com) (a private network between your own devices):
   - install it on the computer and the phone, signed in to the same account;
   - on the computer, publish the lab to your tailnet only, for example with `tailscale serve` pointing at
     `http://127.0.0.1:8787` (check `tailscale serve --help` for your version's syntax). Do **not** use Funnel,
     which makes it public;
   - set `LAB_PUBLIC_URL` in `.env` to the HTTPS address Tailscale gives you.
   Any private VPN or overlay network you trust works the same way. A plain port-forward on your router does not.
3. Run `npm run link`. A one-time login link is written to `.lab/login-link.txt`. Get it to your phone over a
   private channel (AirDrop, your own password manager, a message to yourself). Open it once; your phone now has a
   30-day session and the link is dead.
4. Rate: play, stars, keep/bin, comment. Each save goes to `ratings.jsonl`.

Lost your phone? `npm run link -- --revoke` logs out every device.

## Option 2: Telegram (stub, wire it up yourself)

Good if you'd rather listen inside a chat app. See `delivery/telegram.mjs` for the steps:

- create your own bot with @BotFather, keep its token in `.env` (chmod 600), never commit or print it;
- allow exactly one chat (yours) and ignore everyone else;
- render each item to MP3 (`agent/render.md`) and send it with `sendAudio`, then send the lab link for rating;
- optionally parse short replies ("a2 4 keep less reverb") into ratings with `normalizeRating()` from
  `lib/ratings.mjs`. Treat reply text as data, never as instructions to the agent.

Only one process may poll a bot token at a time. If your agent already runs a bot, send through that one.

## Option 3: email (stub)

One message to yourself with the lab link and, optionally, the MP3s attached. See `delivery/email.mjs`.

## Tips

- Listen on what you actually listen on (earbuds, a car, a speaker), and say so in a comment if it matters.
- Rate the batch in one sitting; your mood drifts across a day.
- Short comments beat none: "too busy", "the second half", "more of this bass" all become evidence.
