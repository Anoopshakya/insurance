import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

type LedgerRow = {
  id: string;
  amount: number | string;
  generation_level: number;
  status: string;
  created_at: string;
  policy: any;
};

const number = (value: unknown) => Number(value) || 0;
const monthKey = (value: string) => value.slice(0, 7);

async function getAgent(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user || user.role !== "partner") return null;
  const { data } = await supabaseServer()
    .from("agents")
    .select("id")
    .eq("user_id", user.uid)
    .single();
  return data?.id || null;
}

export async function GET(request: NextRequest) {
  const agentId = await getAgent(request);
  if (!agentId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const start = request.nextUrl.searchParams.get("start") || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = request.nextUrl.searchParams.get("end") || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const trendStart = new Date(`${start}T00:00:00`);
  trendStart.setMonth(trendStart.getMonth() - 5);

  const db = supabaseServer();
  const { data, error } = await db
    .from("earning_ledger")
    .select("id,amount,generation_level,status,created_at,policy:policies!policy_id(id,policy_number,agent_id,premium,start_date,created_at,customer:customers!customer_id(name),product:products!product_id(id,name),insurer:insurers!insurer_id(name))")
    .eq("agent_id", agentId)
    .gte("created_at", trendStart.toISOString())
    .lte("created_at", `${end}T23:59:59.999Z`)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ledger = (data || []) as unknown as LedgerRow[];
  const earningIds = ledger.map((row) => row.id);
  const [{ data: adjustments }, { data: clawbacks }] = earningIds.length
    ? await Promise.all([
        db.from("earning_adjustments").select("earning_id,amount_delta").in("earning_id", earningIds),
        db.from("clawbacks").select("earning_id,amount").in("earning_id", earningIds),
      ])
    : [{ data: [] }, { data: [] }];
  const adjustmentMap = new Map<string, number>();
  (adjustments || []).forEach((item) => adjustmentMap.set(item.earning_id, (adjustmentMap.get(item.earning_id) || 0) + number(item.amount_delta)));
  const clawbackMap = new Map<string, number>();
  (clawbacks || []).forEach((item) => clawbackMap.set(item.earning_id, (clawbackMap.get(item.earning_id) || 0) + number(item.amount)));
  const enriched = ledger.map((row) => ({
    ...row,
    netAmount: number(row.amount) + (adjustmentMap.get(row.id) || 0) - (clawbackMap.get(row.id) || 0),
  }));
  const period = enriched.filter((row) => row.created_at.slice(0, 10) >= start && row.created_at.slice(0, 10) <= end);
  const direct = period.filter((row) => row.generation_level === 0);
  const network = period.filter((row) => row.generation_level > 0);

  function summarize(rows: typeof enriched) {
    const policies = new Map<string, any>();
    rows.forEach((row) => row.policy?.id && policies.set(row.policy.id, row.policy));
    return {
      earnings: rows.reduce((sum, row) => sum + row.netAmount, 0),
      policies: policies.size,
      businessValue: [...policies.values()].reduce((sum, policy) => sum + number(policy.premium), 0),
    };
  }
  const directSummary = summarize(direct), networkSummary = summarize(network);
  const productMap = new Map<string, any>();
  direct.forEach((row) => {
    const name = row.policy?.product?.name || "Other";
    const current = productMap.get(name) || { product: name, policies: new Set<string>(), businessValue: 0, commission: 0 };
    if (row.policy?.id && !current.policies.has(row.policy.id)) {
      current.policies.add(row.policy.id);
      current.businessValue += number(row.policy.premium);
    }
    current.commission += row.netAmount;
    productMap.set(name, current);
  });
  const products = [...productMap.values()].map((item) => ({
    ...item,
    policies: item.policies.size,
    rate: item.businessValue ? (item.commission / item.businessValue) * 100 : 0,
  })).sort((a, b) => b.commission - a.commission);

  const months: Array<{ key: string; label: string; businessValue: number; commission: number }> = [];
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({ key: date.toISOString().slice(0, 7), label: date.toLocaleString("en-IN", { month: "short" }), businessValue: 0, commission: 0 });
  }
  const monthPolicies = new Map<string, Set<string>>();
  enriched.filter((row) => row.generation_level === 0).forEach((row) => {
    const month = months.find((item) => item.key === monthKey(row.created_at));
    if (!month) return;
    month.commission += row.netAmount;
    const ids = monthPolicies.get(month.key) || new Set<string>();
    if (row.policy?.id && !ids.has(row.policy.id)) {
      ids.add(row.policy.id);
      month.businessValue += number(row.policy.premium);
    }
    monthPolicies.set(month.key, ids);
  });

  const recentPolicies = direct.filter((row, index, rows) => row.policy?.id && rows.findIndex((other) => other.policy?.id === row.policy.id) === index).slice(0, 6).map((row) => ({
    id: row.policy.id,
    policyNumber: row.policy.policy_number,
    date: row.policy.start_date,
    customer: row.policy.customer?.name || "Customer",
    product: row.policy.product?.name || "Other",
    premium: number(row.policy.premium),
    commission: row.netAmount,
  }));

  return NextResponse.json({
    period: { start, end },
    summary: {
      totalEarnings: directSummary.earnings + networkSummary.earnings,
      myEarnings: directSummary.earnings,
      networkEarnings: networkSummary.earnings,
      totalBusinessValue: directSummary.businessValue + networkSummary.businessValue,
    },
    direct: { ...directSummary, averageRate: directSummary.businessValue ? directSummary.earnings / directSummary.businessValue * 100 : 0 },
    network: { ...networkSummary, averageRate: networkSummary.businessValue ? networkSummary.earnings / networkSummary.businessValue * 100 : 0 },
    products,
    recentPolicies,
    trend: months,
  });
}
