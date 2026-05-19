# Bottega Production Release Notes

## Summary

This release prepares the creator platform for a production-grade Bottega flow.

- Regular accounts see `Bottega 열기`.
- Registered creator accounts see `My Bottega`.
- Creator registration now flows through agreement, genre selection, and genre-specific Bottega creation.
- Toon and Novel Bottega workspaces are split from the genre selection page.
- Creator registration cancellation is available with a destructive confirmation warning.
- Production deployment gates, environment checks, database schema checks, and GitHub Actions release checks are included.

## Key Changes

- Added `creator_channels.primary_work_type` migration.
- Added `src/lib/bottega.ts` for Bottega type, label, and route mapping.
- Added genre-specific `Toon Bottega` and `Novel Bottega` pages.
- Removed genre selection from already-registered creators' My Bottega.
- Added creator registration cancellation panel.
- Strengthened environment validation for Supabase, GCS, site URL, secrets, and settlement encryption.
- Strengthened route authorization to use the database profile role.
- Added release scripts:
  - `npm run check:release-files`
  - `npm run check:prod`
  - `npm run check:db`
  - `npm run release:gate`
  - `npm run env:secrets`
- Added GitHub Actions release gate.

## Pre-Deploy Checklist

- Push branch `codex-creator-platform-foundation`.
- Open PR into the deployment branch.
- Confirm CI `Build Gate` passes.
- Add production environment variables from `docs/production-env.template`.
- Generate internal secrets with `npm run env:secrets`.
- Apply Supabase migrations to the target database.
- Run `npm run check:prod`.
- Run `npm run check:db`.
- Run GitHub Actions `Production Preflight` manually.

## Manual Smoke Test

- Sign up with a regular account.
- Confirm the regular hub shows `Bottega 열기`, not `My Bottega`.
- Complete creator agreement.
- Select Toon Bottega.
- Confirm the creator lands on Toon Bottega without seeing the genre selector again.
- Confirm creator hub/settings show `My Bottega`.
- Open public profile settings.
- Confirm `작가 등록 취소` appears.
- Test cancellation only with a disposable account.
- Confirm the account returns to regular state and no longer sees `My Bottega`.

## Rollback

The Bottega database migration is additive. Keep `creator_channels.primary_work_type` in place during app rollback; older app versions can ignore it.
