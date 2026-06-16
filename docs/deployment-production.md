# Production Deployment Checklist

This checklist is for a fixed public domain deployment that should behave like a production launch, not a temporary local demo.

For Vercel-specific production setup, use `docs/vercel-production-setup.md`.

## 1. Build Gate

Run these before promoting a build:

```bash
npm ci
npm run release:gate
```

`npm run check:prod` loads `.env`, `.env.local`, `.env.production`, and `.env.production.local` if present. It does not print secret values; it only reports missing or unsafe configuration.

`npm run check:db` uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to verify that the production Supabase schema exposes the tables and columns used by the current code. Run it only against the intended production or staging project.

`npm run check:release-files` verifies that release-critical files are tracked by Git. This prevents local-only files from being omitted in a Git-based deployment.

GitHub Actions also runs `.github/workflows/release-gate.yml` on pull requests and pushes to `main` or `codex/**`. The regular CI job runs release-file, lint, type, and build checks. The `Production Preflight` job is manual-only through `workflow_dispatch` because it requires production secrets and checks the production Supabase schema.

If you want to run the gate manually, use the same sequence:

```bash
npm run check:release-files
npm run lint
npx tsc --noEmit
npm run build
npm run check:prod
npm run check:db
```

## 2. Required Environment Variables

Use `docs/production-env.template` as the source checklist, then set the real values in the hosting provider for production.

Generate long random internal secrets with:

```bash
npm run env:secrets
```

Print the Vercel Production key checklist with:

```bash
npm run env:vercel
```

Set these in the hosting provider:

```env
NEXT_PUBLIC_SUPABASE_URL=
APP_ENV=production
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=artwork-assets
NEXT_PUBLIC_SITE_URL=

INDERVERSE_SMTP_HOST=
INDERVERSE_SMTP_USER=
INDERVERSE_SMTP_PASS=
INDERVERSE_SMTP_FROM_EMAIL=
INDERVERSE_SMTP_FROM_NAME=

PASS_VERIFY_START_URL=
PHONE_VERIFY_START_URL=
AGE_VERIFICATION_STATE_SECRET=
AGE_VERIFICATION_PROVIDER_SECRET=
ENABLE_DEV_MANUAL_AGE_VERIFICATION=false
ENABLE_STAGING_MOCK_AGE_VERIFICATION=false

ENABLE_DEV_COIN_CHARGE=false
ENABLE_DEV_SUBSCRIPTION_CHECKOUT=false
ENABLE_STAGING_MOCK_BILLING=false

CRON_SECRET=
STORAGE_CLEANUP_SECRET=
WEBTOON_IMAGE_PROCESSING_SECRET=
INTERNAL_JOB_SECRET=

BANK_INFO_ENCRYPTION_SECRET=
```

Use long random values for `AGE_VERIFICATION_STATE_SECRET`, `AGE_VERIFICATION_PROVIDER_SECRET`, `CRON_SECRET`, `STORAGE_CLEANUP_SECRET`, `WEBTOON_IMAGE_PROCESSING_SECRET`, `INTERNAL_JOB_SECRET`, and `BANK_INFO_ENCRYPTION_SECRET`.

The application also accepts existing `SUPABASE_AUTH_SMTP_HOST`, `SUPABASE_AUTH_SMTP_USER`, `SUPABASE_AUTH_SMTP_PASS`, `SUPABASE_AUTH_SMTP_ADMIN_EMAIL`, and `SUPABASE_AUTH_SMTP_SENDER_NAME` values as SMTP fallbacks.

Do not rotate `BANK_INFO_ENCRYPTION_SECRET` after settlement bank info is stored unless a re-encryption migration is prepared.

Production must keep these disabled:

```env
ENABLE_DEV_MANUAL_AGE_VERIFICATION=false
ENABLE_STAGING_MOCK_AGE_VERIFICATION=false
ENABLE_DEV_COIN_CHARGE=false
ENABLE_DEV_SUBSCRIPTION_CHECKOUT=false
ENABLE_STAGING_MOCK_BILLING=false
```

Staging or closed beta deployments may enable mock flows with a separate environment:

```env
APP_ENV=staging
ENABLE_STAGING_MOCK_AGE_VERIFICATION=true
ENABLE_STAGING_MOCK_BILLING=true
```

Never reuse the staging environment variables on the production domain.

## 3. Supabase Production Setup

Apply all migrations to the production Supabase project before routing real users to the domain.

```bash
npx supabase db push
npm run check:db
```

The My Bottega flow depends on:

- `025_creator_agreement_consents.sql`
- `032_creator_channels_and_work_type_expansion.sql`
- `034_creator_channel_external_links.sql`
- `048_standardize_artwork_saves_to_channel_uuid.sql`
- `050_creator_channel_primary_bottega.sql`

Migration `050_creator_channel_primary_bottega.sql` adds `creator_channels.primary_work_type` and reloads the PostgREST schema cache. Without it, the app has a fallback, but the selected Bottega genre is not fully persisted.

Migration `052_supabase_storage_assets.sql` creates the public `artwork-assets` storage bucket used for covers, panels, and webtoon episode images. Keep `SUPABASE_STORAGE_BUCKET` aligned with that bucket name unless a separate migration is prepared.

## 4. Supabase Auth URL Configuration

Set the production domain as the Supabase Auth Site URL:

```text
https://your-domain.com
```

Add these redirect URLs:

```text
https://your-domain.com/auth/callback
https://your-domain.com/auth/reset-password
https://your-domain.com/auth/verify-email
```

If preview deployments are used for QA, add preview URLs separately and keep production redirects exact.

## 5. Supabase Storage

The app stores uploaded artwork in the Supabase Storage bucket configured by `SUPABASE_STORAGE_BUCKET`.

The bucket must be public for image delivery, while uploads are still issued through server-generated signed upload URLs. The service role key is used only server-side for:

- creating signed upload URLs
- server-side cover optimization
- webtoon image derivative generation
- deleting stale storage objects in cleanup jobs

## 6. Cron and Internal Jobs

`vercel.json` schedules:

- `/api/internal/storage-cleanup?limit=25`
- `/api/internal/webtoon-image-processing?limit=10`

Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. If another scheduler is used, send the same header or configure the dedicated internal job secrets.

## 7. Release Smoke Test

Run these flows against the production domain after deployment:

- sign up, email verification, login
- regular account hub shows `Bottega 열기`, not `My Bottega`
- creator registration agreement
- genre selection to Toon Bottega
- creator account hub shows `My Bottega`
- create a Toon draft and upload an image
- open public creator profile settings
- cancel creator registration and confirm the warning modal
- regular account no longer sees `My Bottega`

Do the cancellation test only on a throwaway production test account.

## 8. Rollback Notes

The Bottega migration is additive. If an application rollback is needed, keep `creator_channels.primary_work_type` in the database; older code will ignore it. Do not remove the column during an incident unless a separate data migration has been planned.

For domain rollback:

- keep Supabase Auth redirect URLs for both the old and new domains during transition
- keep `NEXT_PUBLIC_SITE_URL` aligned with the active canonical domain
- keep Supabase Storage bucket policies and uploaded image paths intact
