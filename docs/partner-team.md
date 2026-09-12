# My Team rollout

Apply supabase/migrations/202609120001_partner_team.sql manually before deploying this application version. Partner registration now uses its transactional register_partner function. No live database changes have been performed by this implementation.

The migration adds a unique user constraint, backfills random 64-character invitation codes for existing partners, and defaults codes for future partners. It preserves the existing three-level closure hierarchy and immutable sponsor relationship. If duplicate agents share a user_id, the migration stops without deleting anything; reconcile those records deliberately before retrying.

The migration restricts direct anonymous/authenticated access to agents and network_closure; this application accesses those tables through service-role server routes. register_partner is executable only by service_role. Partner authorization continues through verifyRequestToken and database roles; the invite never determines privileges or approval.

## Behaviour

- /partner/team shows direct, level 2 and level 3 counts, paginated members (20 per page), status and region. It does not expose member email, phone, bank or KYC information.
- Invite URL: /invite/<random-code>. Validation sets an HTTP-only, SameSite=Lax, secure-on-HTTPS cookie on the current hostname, lasting 30 days. Reloads and same-origin Google popup completion retain it. Successful registration clears it. Failed registration keeps it for retry.
- Use the same canonical hostname throughout authentication. Email confirmation redirects to /partner/register?account=1; allow this URL in Supabase Auth redirect settings for each environment, alongside the existing /auth/callback Google URL.
- Registration opened on a different browser/device does not have the invitation cookie. Open the original invite link on that device before completing partner registration. No referral is inferred from editable user metadata.
- Codes do not expire by default. Administrators can set agents.invite_enabled=false or invite_expires_at through trusted database administration to revoke/expire an invitation. Suspended, rejected and deactivated inviters cannot recruit. Level 3 partners retain a code but cannot extend the existing hierarchy beyond its configured limit.
- An invalid invite replaces any earlier cookie with an invalid marker; it cannot silently attribute to an older inviter. Registration blocks until a valid invitation is opened or the person explicitly chooses Continue without an invitation.
- Authenticated existing partners cannot move teams through a new invite. Registration retries return their original record. Self-referrals fail. User creation, partner creation, role assignment and hierarchy creation commit together or roll back together.
- WhatsApp opens a prefilled share composer; no messages are sent automatically. Native QR sharing falls back to PNG download where file sharing is unavailable. QR generation happens locally using node-qrcode (https://github.com/soldair/node-qrcode), without sending referral URLs to an external QR service.

## Verification

Database tests use PGlite with the existing network schema plus the new migration. They cover code generation, uniqueness, idempotency, invalid/expired/disabled links, self-referral, existing-account immutability, rollback, three-level closure and database privileges. API tests cover verified user scoping and cookie attribution for both provider types. Browser fixtures cover mobile/desktop light/dark layouts, QR download, level filters and retry, plus email/Google registration retaining an HTTP-only cookie through reload. Auth provider interactions are mocked; run a real email-confirmation and Google registration smoke test after applying the SQL and deploying. No live invitation messages or registrations were created during tests.
