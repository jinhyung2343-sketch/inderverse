# Staging Mock Beta

Use this setup for a closed beta before external PASS or PG integrations are ready.

## Environment

Set these only on the staging or preview deployment:

```env
APP_ENV=staging
ENABLE_STAGING_MOCK_AGE_VERIFICATION=true
ENABLE_STAGING_MOCK_BILLING=true
```

Keep production locked down:

```env
APP_ENV=production
ENABLE_STAGING_MOCK_AGE_VERIFICATION=false
ENABLE_STAGING_MOCK_BILLING=false
ENABLE_DEV_MANUAL_AGE_VERIFICATION=false
ENABLE_DEV_COIN_CHARGE=false
ENABLE_DEV_SUBSCRIPTION_CHECKOUT=false
```

## What The Mock Flow Does

- Test age verification writes an `age_verifications` record with the `manual` provider and sets `profiles.is_adult_verified=true`.
- Test subscriptions write local subscription state and set `profiles.is_subscribed=true`.
- Test Inderium charge writes wallet and transaction state through the existing `charge_coins` RPC.

## Safety Rules

- Do not take real money through mock billing.
- Do not represent mock age verification as legal identity verification.
- Use a separate staging Supabase project when inviting external testers.
- Run `npm run release:gate` before production deployment; it fails if mock flags are enabled for production.
