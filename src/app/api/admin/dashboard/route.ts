import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { userHasPermission } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabase-server";

type CountQuery = { count: number | null; error: { message: string } | null };

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // The current permission catalog uses system:manage_roles as the
  // administrator boundary. Keep dashboard access aligned with that catalog.
  const allowed = await userHasPermission(decoded.uid, "system", "manage_roles");
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = supabaseServer();
  const [customers, partners, policies, leads, renewals, payouts, recentPolicies, policyValues, commissions] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }),
    db.from("agents").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("policies").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("renewals").select("id", { count: "exact", head: true }).lte("due_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).neq("status", "renewed"),
    db.from("payout_requests").select("amount_requested").in("status", ["pending", "approved", "processing"]),
    db.from("policies").select("id, policy_number, premium, status, created_at, customers(name), products(name), insurers(name)").order("created_at", { ascending: false }).limit(5),
    db.from("policies").select("premium"),
    db.from("earning_ledger").select("amount"),
  ]);

  const counted: CountQuery[] = [customers, partners, policies, leads, renewals];
  const firstError = [...counted, payouts, recentPolicies, policyValues, commissions].find((result) => result.error)?.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const pendingPayouts = (payouts.data ?? []).reduce((sum, row) => sum + Number(row.amount_requested), 0);
  return NextResponse.json({
    data: {
      metrics: {
        customers: customers.count ?? 0,
        activePartners: partners.count ?? 0,
        activePolicies: policies.count ?? 0,
        newLeads: leads.count ?? 0,
        renewalsDue: renewals.count ?? 0,
        pendingPayouts,
        premiumCollected: (policyValues.data ?? []).reduce((sum,row)=>sum+Number(row.premium),0),
        totalCommission: (commissions.data ?? []).reduce((sum,row)=>sum+Number(row.amount),0),
      },
      recentPolicies: recentPolicies.data ?? [],
      generatedAt: new Date().toISOString(),
    },
  });
}
