# Monetization Roadmap

## Current state

The platform is moving to a hybrid model:

- subscription is the default way to read beyond teaser/free-preview episodes
- Inderium remains the wallet currency for individual episode ownership, creator support, and special access
- subscription revenue and Inderium direct revenue should stay on separate ledgers for settlement and refunds

`src/app/api/coins/charge/route.ts` returns `503` unless `ENABLE_DEV_COIN_CHARGE=true`.

`src/app/api/subscriptions/dev/route.ts` can toggle local subscription state outside production. It is a local test harness, not a real payment checkout.

Do not enable `ENABLE_DEV_COIN_CHARGE` in production. The current `charge_coins` RPC is useful for development balance seeding, but it does not verify payment provider callbacks, receipt status, amount integrity, currency, refund state, or idempotency against an external PG system.

## Production blocker

Before coin charging can be exposed to users, add server-side payment verification with a Korean PG provider such as Toss Payments or KG Inicis.

Minimum production requirements:

- create a pending payment intent on the server
- verify the PG approval result on the server, not in the browser
- compare approved amount, currency, order id, user id, and idempotency key
- persist provider transaction id and raw verification metadata
- credit coins only after successful provider verification
- handle duplicate callbacks idempotently
- handle cancellations, refunds, partial failures, and chargeback review
- keep service-role balance mutation server-only

## Near-term direction

The current access model uses creator-controlled teaser access plus subscription entitlement checks. Individual purchase should remain available through Inderium for readers who want ownership or one-off access.

When that work starts, keep it separate from payment-gateway integration:

- teaser/free-preview rules decide which episodes are publicly readable
- subscription entitlement decides access past the teaser boundary
- Inderium purchase records decide individual ownership
- PG integration decides how users pay for subscription or Inderium products

Keeping these layers separate makes the future migration away from wait-free safer and easier to test.
