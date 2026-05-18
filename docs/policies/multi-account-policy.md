# Inderverse Multi-Account Policy

## Policy stance

Inderverse allows one person to hold and switch between multiple accounts.

This is an intentional creator-friendly policy. Reader activity, creator operations,
settlement, experimentation, and brand separation can require different identities.
The platform should support that flexibility while keeping responsibility and abuse
controls clear.

## Allowed use

- A user may keep separate reader and creator accounts.
- A user may keep separate creator accounts for different pen names, brands, projects, or business purposes.
- A user may switch the active account from settings when multiple accounts are registered on the same device.
- Each account keeps its own library, profile, creator channel, consent state, verification state, and settlement state.

## Prohibited use

Multiple accounts must not be used for:

- rating, comment, like, purchase, or recommendation manipulation
- self-dealing, fake support, or settlement abuse
- evading suspension, age gates, guardian consent, identity verification, or moderation decisions
- harassment, impersonation, spam, fraud, or coordinated policy violations
- hiding ownership where disclosure is required for settlement, legal, or safety reasons

## Product behavior

- Settings should show accounts registered on the current device.
- The active account should be visually clear.
- Switching accounts should require an explicit user action.
- Expired or invalid stored sessions should be removed or require fresh login.
- The UI should never blur responsibility: every action should be attributable to the active account.
- Linked-account ownership data must not be exposed publicly.
- Platform management and operations staff may access linked-account data only when needed for safety, moderation, settlement, fraud, legal, support, or compliance work.
- Internal accountability linking should not be presented as an optional public identity choice. When platform evidence verifies account control, related accounts may be linked internally for operations and enforcement while remaining publicly separate.

## Privacy and accountability

Inderverse protects public pseudonymity. Users may separate reader, creator, pen-name,
brand, or business identities, and other users should not be able to infer account
linkage from public product surfaces.

This public separation does not remove platform accountability. Internally, Inderverse
may evaluate related accounts together when handling illegal activity, malicious
multi-account use, settlement abuse, harassment, manipulation, verification bypass,
or enforcement evasion.

The linked-account graph is private operational data. It should be visible only to
authorized platform administrators, trust and safety operators, settlement operators,
or support staff with a legitimate work reason.

## Current implementation

The current local implementation is browser-scoped:

- accounts are remembered in local storage after login/session verification
- settings displays remembered accounts
- selecting an account swaps the active Supabase session
- hidden accounts are removed from the local account list only

This implementation is useful for prototype UX, but it is not the final platform authority.
It does not prove ownership across devices, does not create a server-side account group,
and should not be used for settlement or enforcement decisions by itself.

## Future server model

For the production-grade model, add a server-side account group layer.

Initial architecture note: `docs/architecture/server-account-groups.md`
Initial schema migration: `supabase/migrations/044_account_groups.sql`

Suggested concepts:

- `account_groups`: the human or organization-level ownership container
- `account_group_members`: links auth users to an account group
- `account_group_roles`: owner, manager, creator, finance, support, etc.
- `account_switch_audit_logs`: records account switching and sensitive actions
- `account_group_verifications`: stores identity, business, age, guardian, or settlement verification state where appropriate

Important rule: accounts may be multiple, but the responsibility model must remain clear.
Public anonymity and internal accountability are both required.

## Future implementation notes

- Account linking should require reauthentication for both the current account and the account being added.
- Unlinking should be blocked when it would orphan settlement, moderation, or legal records.
- Settlement-capable creator accounts should require stronger verification than reader-only accounts.
- Moderation systems should detect linked-account abuse patterns without exposing private account links publicly.
- Public identity should remain account-specific unless the user chooses otherwise.
- Internal tools may need group-level visibility for safety, fraud, settlement, and support workflows.

## Recommended policy copy

Inderverse permits users to hold and switch between multiple accounts for reader,
creator, pen-name, brand, or business purposes. Multiple accounts may not be used
to manipulate platform signals, evade enforcement, bypass verification, commit fraud,
or obscure responsibility where disclosure is required. Account-level freedom is
supported, but abuse and responsibility are evaluated across related accounts when
necessary for platform safety, settlement, and legal compliance.
