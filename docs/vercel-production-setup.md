# Vercel Production Setup

Use this when deploying `inderverse` to a fixed public address through Vercel.

## 1. Production Branch

The repository currently uses:

```text
codex-creator-platform-foundation
```

as the production branch. In Vercel:

1. Open the `inderverse` project.
2. Go to `Settings` -> `Git`.
3. Set `Production Branch` to `codex-creator-platform-foundation`.
4. Save.

The current GitHub repository has this branch as the remote HEAD/default branch, so PR-based deployment is not required for this release path.

## 2. Environment Variables

Use `docs/production-env.template` as the checklist. In Vercel, add every required key under:

```text
Settings -> Environment Variables -> Production
```

Recommended flow:

```bash
npm run env:secrets
```

Copy the generated secret values into Vercel. Do not commit generated values.

Keep these production flags disabled:

```env
ENABLE_DEV_MANUAL_AGE_VERIFICATION=false
ENABLE_STAGING_MOCK_AGE_VERIFICATION=false
ENABLE_DEV_COIN_CHARGE=false
ENABLE_DEV_SUBSCRIPTION_CHECKOUT=false
ENABLE_STAGING_MOCK_BILLING=false
```

## 3. Build Settings

Vercel should use the repository defaults:

```text
Install Command: npm ci
Build Command: npm run build
Output Directory: .next
```

Do not use static export. This app depends on Server Actions, Route Handlers, Supabase auth cookies, and scheduled internal jobs.

## 4. Cron Jobs

`vercel.json` defines:

```text
/api/internal/storage-cleanup?limit=25
/api/internal/webtoon-image-processing?limit=10
```

Vercel Cron sends:

```text
Authorization: Bearer ${CRON_SECRET}
```

So `CRON_SECRET` must be set in the Vercel Production environment.

## 5. Supabase

Before promoting the fixed address:

```bash
npx supabase db push
npm run check:db
```

Then configure Supabase Auth URL settings:

```text
Site URL:
https://your-domain.com

Additional Redirect URLs:
https://your-domain.com/auth/callback
https://your-domain.com/auth/reset-password
https://your-domain.com/auth/verify-email
```

## 6. Preflight

After production environment variables are set:

```bash
npm run check:prod
npm run check:db
```

If using GitHub Actions, run `Release Gate` manually and confirm `Production Preflight` passes.

## 7. Deploy

Once the branch, environment variables, and Supabase migration are ready:

1. Trigger a Vercel production deployment from `codex-creator-platform-foundation`.
2. Confirm the production URL loads.
3. Run the smoke tests in `docs/deployment-production.md`.
