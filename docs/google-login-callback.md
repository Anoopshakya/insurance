# Google login callback

Allow each deployed origin followed by /auth/callback in Supabase Authentication > URL Configuration > Redirect URLs, including http://localhost:3000/auth/callback for local development. The Site URL should match the intended production origin. Google Cloud should continue using the Supabase provider callback URL.

All Google buttons now return to the common callback. Popup sessionStorage retains a per-attempt identifier so homepage fallback on the same origin also completes. Only a correlated message from the expected popup or same-origin BroadcastChannel completes the parent flow. Tokens are not sent in messages. Existing authenticatedDestination checks determine the portal in the parent.

References: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/guides/auth/social-login/auth-google . Cross-origin Site URL fallback must be corrected in the Supabase dashboard; the application cannot bridge authentication across origins.
