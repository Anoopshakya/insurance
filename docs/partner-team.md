# My Team rollout

Apply supabase/migrations/202609120001_partner_team.sql manually before deploying this application version. Partner registration now uses its transactional register_partner function. No live database changes have been performed by this implementation.

The migration adds a unique user constraint, backfills random 64-character invitation codes for existing partners, and defaults codes for future partners. It preserves the existing three-level closure hierarchy and immutable sponsor relationship. If duplicate agents share a user_id, the migration stops without deleting anything; reconcile those records deliberately before retrying.

The migration restricts direct anonymous/authenticated access to agents and network_closure; this application accesses those tables through service-role server routes. register_partner is executable only by service_role. Partner authorization continues through verifyRequestToken and database roles; the invite never determines privileges or approval.

## Short invite codes

Apply `supabase/migrations/202609130003_short_partner_invite_codes.sql` after the original team migration. It replaces the default generator and regenerates every legacy code as eight uppercase alphanumeric characters. Generation excludes confusing I/O/0/1 characters, retries collisions, and preserves the unique index. Lowercase invite URLs are accepted and normalized to uppercase.

Existing partner IDs, sponsors, team relationships, expiry dates and enabled settings are preserved. Previously shared links and QR codes stop working; partners should share their new link from My Team after rollout. Reapplying the migration preserves the new codes. Apply the migration and deploy the route validation change together. The live database must be updated through the Supabase SQL editor or an authorized database connection.

## Behaviour

- /partner/team shows the illustrated empty state until the downline contains members. Populated teams show 10 members per page, direct and level 2 summaries, and a level 3 card when present. The scoped table includes name, code, phone, join date, status, issued policy premium and net earned commission. Row actions open partner details.
- Search matches name, code and mobile. Status, team level and join-date filters apply before sorting and pagination. Date filters use the current India calendar month/year; business and commission remain all-time totals. Business includes active, issued and expired policies, excluding cancelled/proposal records. Commission includes adjustments and clawbacks. Export downloads all matching rows as CSV, with spreadsheet formula protection.
- Invite Partner opens a modal with code/link copying, WhatsApp sharing and QR download/sharing. Invite via Details prepares a personalised WhatsApp draft using a name and mobile number; it does not create a partner record or automatically send a message. View Guide explains registration and team levels.
- Invite URL: /invite/<random-code>. Validation sets an HTTP-only, SameSite=Lax, secure-on-HTTPS cookie on the current hostname, lasting 30 days. Reloads and same-origin Google popup completion retain it. Successful registration clears it. Failed registration keeps it for retry.
- Use the same canonical hostname throughout authentication. Email confirmation redirects to /partner/register?account=1; allow this URL in Supabase Auth redirect settings for each environment, alongside the existing /auth/callback Google URL.
- Registration opened on a different browser/device does not have the invitation cookie. Open the original invite link on that device before completing partner registration. No referral is inferred from editable user metadata.
- Codes do not expire by default. Administrators can set agents.invite_enabled=false or invite_expires_at through trusted database administration to revoke/expire an invitation. Suspended, rejected and deactivated inviters cannot recruit. Level 3 partners retain a code but cannot extend the existing hierarchy beyond its configured limit.
- An invalid invite replaces any earlier cookie with an invalid marker; it cannot silently attribute to an older inviter. Registration blocks until a valid invitation is opened or the person explicitly chooses Continue without an invitation.
- Authenticated existing partners cannot move teams through a new invite. Registration retries return their original record. Self-referrals fail. User creation, partner creation, role assignment and hierarchy creation commit together or roll back together.
- WhatsApp opens a prefilled share composer; no messages are sent automatically. Native QR sharing falls back to PNG download where file sharing is unavailable. QR generation happens locally using node-qrcode (https://github.com/soldair/node-qrcode), without sending referral URLs to an external QR service.

## Verification

Database tests use PGlite with the existing network schema plus the new migration. They cover code generation, uniqueness, idempotency, invalid/expired/disabled links, self-referral, existing-account immutability, rollback, three-level closure and database privileges. API tests cover verified user scoping and cookie attribution for both provider types. Browser fixtures cover mobile/desktop light/dark layouts, QR download, level filters and retry, plus email/Google registration retaining an HTTP-only cookie through reload. Auth provider interactions are mocked; run a real email-confirmation and Google registration smoke test after applying the SQL and deploying. No live invitation messages or registrations were created during tests.
