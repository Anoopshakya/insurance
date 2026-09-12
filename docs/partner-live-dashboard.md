# Partner dashboard data

GET /api/partner/dashboard verifies the Supabase token and database role, then resolves the agent from that verified user. It does not accept a client-provided agent ID. Responses are private/no-store.

- Leads and customers: exact counts assigned to the partner's agent ID.
- Policies sold: own policies with issued, active or expired status. Proposals, pending and cancelled policies are excluded.
- Premium: premium on those sold policies.
- Categories: category counts and shares among those sold policies; missing category is Uncategorised.
- Recorded earnings: all own direct/network earning-ledger entries, plus earning adjustments, minus clawbacks. Includes pending/review entries; not a withdrawable balance.
- Paid and unpaid: split by ledger status paid; net of the same adjustments/clawbacks.
- Trend: six calendar months in Asia/Kolkata. Policies use record creation date, earnings use original ledger posting date. Later adjustments restate their original earning's month.
- Renewals: issued/active policies expiring from today through 30 days ahead, inclusive.
- Recent leads: latest five assigned leads, ordered by creation date and ID.

Queries page through records to avoid Supabase's default result cap. Counts are not based on the limited directory lists. Database failures produce an error, never fabricated zero totals. UI refreshes on load, every minute while visible, on returning after a minute, and via Refresh. Failed refresh retains the last successful figures with a warning and timestamp.

Removed placeholder totals, growth claims, chart/category data, sample leads, fake notification count, promotional offer and resource placeholders. Existing tables are used; no SQL migration or deployment was performed.

Validation: aggregation and partner-scope regression tests, read-only query execution against configured Supabase, and component browser tests with mocked responses. Browser fixture tests do not constitute a live authenticated user-session test.
