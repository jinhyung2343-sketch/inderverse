# Server Account Groups

## Goal

Move Inderverse multi-account support from browser-only session switching to a server-backed ownership and responsibility model.

The platform should allow multiple accounts while preserving clear accountability for settlement, verification, moderation, and support.

The design principle is public pseudonymity with private operational traceability.
Public product surfaces must not reveal linked-account relationships, but authorized
platform operations must be able to investigate related accounts when safety,
settlement, fraud, legal, support, or compliance work requires it.

## Core model

### `account_groups`

The responsibility container for one person or organization.

Use this table when the platform needs to answer:

- which accounts are owned together
- which entity is responsible for settlement or abuse review
- whether identity, business, guardian, adult, or settlement verification exists at the group level

### `account_group_members`

Links Supabase auth users, represented by `profiles.id`, to an account group.

The initial production model allows one active group per auth user. This keeps the responsibility graph simple while Inderverse is still young. If team collaboration later requires one user to manage multiple creator organizations, add a separate team/organization membership model rather than weakening the ownership-group rule.

### `account_switch_audit_logs`

Records account switching and sensitive account-selection events.

Use this for:

- security reviews
- support investigations
- abuse/fraud analysis
- tracing which active account performed a sensitive action

### `account_group_verifications`

Stores group-level or member-level verification state.

Examples:

- identity verification
- business verification
- settlement verification
- adult verification
- guardian consent verification

## Current migration

Initial migration:

`supabase/migrations/044_account_groups.sql`

It creates:

- `account_groups`
- `account_group_members`
- `account_switch_audit_logs`
- `account_group_verifications`
- RLS read/update policies
- backfill groups for existing profiles
- automatic account group creation for newly created users

## Implementation phases

### Phase 1: schema foundation

Status: designed in migration `044_account_groups.sql`.

- create server-side account group tables
- backfill one owner group for each existing profile
- automatically create owner group for new signups
- keep browser-based account switching as the UX prototype

### Phase 2: linking API

Status: started.

The first server routes now support the account group foundation and switch auditing:

- `GET /api/auth/account-groups`
- `POST /api/auth/account-groups/link/confirm`
- `POST /api/auth/account-groups/switch`

Cross-account linking now runs as an internal accountability step instead of a
user-facing optional choice. When multiple valid stored account sessions are present
in the same browser, the app verifies the stored session token for the account being
linked, then moves that verified account into the current account owner's group
through the server-only `link_account_group_member` database function.

The later production hardening step is to replace stored-session proof with a
fresh reauthentication challenge, such as password confirmation or email OTP,
before memberships are merged into one group.

Add server routes for linking accounts into one group.

Required behavior:

- current account must be authenticated
- account being linked must reauthenticate
- server verifies both accounts
- server moves or merges membership only after explicit consent
- audit log records the linking action

Suggested routes:

- `POST /api/auth/account-groups/link/start`
- `POST /api/auth/account-groups/link/confirm`
- `POST /api/auth/account-groups/switch`
- `DELETE /api/auth/account-groups/members/[userId]`

### Phase 3: enforcement integration

Use account groups in systems where responsibility matters.

High-priority integrations:

- settlement eligibility
- creator channel ownership review
- moderation and suspension review
- payment/fraud checks
- adult verification and guardian consent review

### Phase 4: admin and support tooling

Build internal views for:

- group members
- verification states
- account switch logs
- linked-account abuse signals
- unlink requests and blocked unlink reasons

## Safety rules

- Users can have multiple accounts, but every account action must map to one active auth user.
- Server decisions should not trust browser local storage account lists.
- Account linking should always require fresh proof of control.
- Unlinking must be blocked when it would hide active settlement, enforcement, or legal obligations.
- Public identity remains account-specific unless the user explicitly chooses to disclose linkage.
- Linked-account graphs are private operational data, not public profile data.
- Direct table access to full linked-account membership, audit logs, and verification metadata is admin-only in the initial schema.
- User-facing account management should go through server APIs that return only the minimum safe fields required for the current workflow.

## Access model

The initial migration intentionally separates user self-management from operational visibility:

- users may see their own account group shell and their own membership row
- users do not directly query the full list of linked account members
- users do not directly query account switch audit logs
- users do not directly query raw account group verification records
- admins can inspect group membership, audit logs, and verification records for operations work

Future support, settlement, and trust-and-safety roles should narrow admin access further,
but the current `profiles.role = 'admin'` capability is the available platform operator gate.

## Relationship to current local UX

The browser-based account registry is still useful because it validates the user experience:

- settings shows multiple remembered accounts
- current account is obvious
- switching requires an explicit click
- expired sessions are removed or reauthenticated

The server model should replace local storage as the source of truth, but it does not need to replace the interaction pattern.
