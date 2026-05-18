# Monetization Roadmap

## Current state

Episode purchase and wait-free unlock flows exist as prototype access mechanisms, but coin balance top-up is intentionally disabled outside local development.

`src/app/api/coins/charge/route.ts` returns `503` unless `ENABLE_DEV_COIN_CHARGE=true`.

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

The next access-model redesign is expected to replace the prototype wait-free model with creator-controlled teaser access plus subscription entitlement checks.

When that work starts, keep it separate from payment-gateway integration:

- teaser/free-preview rules decide which episodes are publicly readable
- subscription entitlement decides access past the teaser boundary
- PG integration decides how users pay for subscription or coin products

Keeping these layers separate makes the future migration away from wait-free safer and easier to test.
