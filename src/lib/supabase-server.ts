// Server-only Supabase client using the service role key.
// NEVER import this file from a Client Component or expose the key to the browser.
// All privileged reads/writes (RBAC checks, earnings ledger writes, etc.)
// go through this client inside API route handlers / server actions only.

import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
