# Delivery channels

How a finished batch reaches you. Swap any part. See `docs/sending-to-phone.md` for the full picture.

| id | channel | status |
|---|---|---|
| `lab` | the private lab page (`npm run lab`) | implemented |
| `telegram` | a Telegram bot you own | documented stub (`telegram.mjs`) |
| `email` | email to yourself | documented stub (`email.mjs`) |

A channel exports `{ id, name, stub, notify({ batch, items, labUrl }) }`. It only tells you a batch is ready (and may
attach audio). It never rates, approves, publishes or posts anything for you.
