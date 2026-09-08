# Supabase Auth cutover

The application uses Supabase Auth for all portals and token verification. Authorization is read from the application users and role tables. Service-role keys are server-only. No email address automatically grants administrator permissions.

## Existing accounts

The audit on 2026-09-08 found 9 application users: 2 already linked to Supabase Auth and 7 requiring provisioning. Do not deploy the authentication cutover until these identities are linked.

1. Run supabase/migrations/202609080001_auth_identity_migration.sql in this project's Supabase SQL Editor (or your normal migration runner). It makes user foreign keys cascade on ID updates and installs a service-role-only linking function.
2. Run: node --env-file=.env scripts/migrate-auth-identities.mjs
3. Run: node --env-file=.env scripts/migrate-auth-identities.mjs --apply
4. Repeat the dry run. All application accounts should be linked, with no failures or missing emails.

The script creates missing Supabase Auth accounts with random passwords that are never printed. It sends no messages. Users of imported accounts must use Forgot password to verify their email and choose a Supabase password; previous provider passwords are not migrated. Existing Supabase accounts keep their passwords. An existing unverified account is never automatically linked unless this migration provisioned it.

The linking function changes the application user ID atomically and preserves roles, partner/customer relationships, and foreign-key audit references. Failed runs can resume. Provisioned Auth accounts are retained after a failed link to avoid deleting an account after an uncertain network result.

## Supabase project settings

Set the Site URL and allow these redirect URLs for each application origin:

- /auth/callback (partner invitation links)
- /auth/reset-password (all password recovery)
- /partner/login and /customer/login (existing Google sign-in flows)
- /partner/register (existing registration flow)

Enable email authentication and configure Supabase SMTP for delivery. Enable Google in Supabase if Google login is used. Invitation email delivery uses Supabase Auth when EMAIL_WEBHOOK_URL is absent; optional SMS/email webhooks remain supported. Admin login requires an active application administrator or the existing system/manage_roles permission.

Retain NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_APP_URL in deployment settings. Remove obsolete identity-provider variables from hosting settings. Existing provider sessions are not accepted; users must sign in through Supabase.

## Validation

Run npm test and npm run build. Test administrator login, restricted access, password changes/recovery, partner invitations/profile completion/approval/status changes, and customer login using Supabase accounts. External email delivery requires the project settings above.
