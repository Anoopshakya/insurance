import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";

async function rows<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const result: T[] = [];
  for (let from = 0; ; from += 500) {
    const page = await query(from, from + 499);
    if (page.error || !page.data) throw Error("Team records unavailable");
    result.push(...page.data);
    if (page.data.length < 500) return result;
  }
}
export async function GET(req: NextRequest) {
  const user = await verifyRequestToken(req.headers.get("authorization"));
  if (!user || user.role !== "partner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const db = supabaseServer();
    const { data: agent, error } = await db.from("agents").select("id,invite_code,invite_enabled,invite_expires_at,status").eq("user_id", user.uid).single();
    if (error || !agent) throw Error("Partner unavailable");
    const [network, ancestry] = await Promise.all([
      rows((from, to) => db.from("network_closure").select("depth,member:agents!network_closure_descendant_id_fkey(id,agent_code,status,region,created_at,users:users!agents_user_id_fkey(full_name,phone))").eq("ancestor_id", agent.id).gt("depth", 0).order("descendant_id").range(from, to)),
      db.from("network_closure").select("depth").eq("descendant_id", agent.id).order("depth", { ascending: false }).limit(1),
    ]);
    if (ancestry.error) throw ancestry.error;
    const members = network.flatMap(row => {
      const member = Array.isArray(row.member) ? row.member[0] : row.member;
      if (!member) return [];
      const identity = Array.isArray(member.users) ? member.users[0] : member.users;
      return [{ depth: row.depth, member: { ...member, users: identity }, business: 0, commission: 0 }];
    });
    const byId = new Map(members.map(row => [row.member.id, row]));
    const ids = [...byId.keys()];
    // All financial reads are restricted to descendants established by the authenticated ancestor.
    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = ids.slice(offset, offset + 100);
      const [policies, earnings, adjustments, clawbacks] = await Promise.all([
        rows((a, b) => db.from("policies").select("id,agent_id,premium,status").in("agent_id", batch).order("id").range(a, b)),
        rows((a, b) => db.from("earning_ledger").select("id,agent_id,amount").in("agent_id", batch).order("id").range(a, b)),
        rows((a, b) => db.from("earning_adjustments").select("id,earning_id,amount_delta,earning:earning_ledger!inner(agent_id)").in("earning.agent_id", batch).order("id").range(a, b)),
        rows((a, b) => db.from("clawbacks").select("id,earning_id,amount,earning:earning_ledger!inner(agent_id)").in("earning.agent_id", batch).order("id").range(a, b)),
      ]);
      const cents = (value: unknown) => { const amount = Number(value); if (!Number.isFinite(amount)) throw Error("Invalid amount"); return Math.round(amount * 100); };
      const net = new Map(earnings.map(row => [row.id, cents(row.amount)]));
      for (const row of adjustments) if (net.has(row.earning_id)) net.set(row.earning_id, net.get(row.earning_id)! + cents(row.amount_delta));
      for (const row of clawbacks) if (net.has(row.earning_id)) net.set(row.earning_id, net.get(row.earning_id)! - cents(row.amount));
      for (const row of policies) if (["active", "issued", "expired"].includes(row.status) && byId.has(row.agent_id)) byId.get(row.agent_id)!.business += cents(row.premium);
      for (const row of earnings) if (byId.has(row.agent_id)) byId.get(row.agent_id)!.commission += net.get(row.id)!;
    }
    members.forEach(row => { row.business /= 100; row.commission /= 100; });
    const counts = [1, 2, 3].map(depth => members.filter(row => row.depth === depth).length);
    const params = req.nextUrl.searchParams;
    const level = Number(params.get("level")) || 0;
    const search = (params.get("search") || "").trim().toLowerCase();
    const status = params.get("status") || "all";
    const period = params.get("period") || "all";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const start = period === "month" ? today.slice(0, 7) + "-01" : period === "year" ? today.slice(0, 4) + "-01-01" : "";
    const filtered = members.filter(row => (!level || row.depth === level) && (status === "all" || row.member.status === status) && (!start || row.member.created_at.slice(0, 10) >= start) && (!search || [row.member.agent_code, row.member.users?.full_name, row.member.users?.phone].some(value => value?.toLowerCase().includes(search))));
    const sort = params.get("sort") || "newest";
    filtered.sort((a, b) => (sort === "business" ? b.business - a.business : sort === "commission" ? b.commission - a.commission : sort === "name" ? (a.member.users?.full_name || "").localeCompare(b.member.users?.full_name || "") : b.member.created_at.localeCompare(a.member.created_at)) || a.member.id.localeCompare(b.member.id));
    const pageSize = 10;
    const page = Math.min(Math.max(1, Math.floor(Number(params.get("page"))) || 1), Math.max(1, Math.ceil(filtered.length / pageSize)));
    const canInvite = agent.invite_enabled && !["suspended", "rejected", "deactivated"].includes(agent.status) && (!agent.invite_expires_at || Date.parse(agent.invite_expires_at) > Date.now()) && (ancestry.data?.[0]?.depth || 0) < 3;
    if (params.get("export") === "1") {
      const cell = (value: unknown) => { let text = String(value ?? ""); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
      const csv = [["Partner", "Code", "Contact", "Level", "Joined", "Business (INR)", "Commission earned (INR)", "Status"], ...filtered.map(row => [row.member.users?.full_name, row.member.agent_code, row.member.users?.phone, row.depth, row.member.created_at.slice(0, 10), row.business, row.commission, row.member.status])].map(row => row.map(cell).join(",")).join("\r\n");
      return new NextResponse("\uFEFF" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="my-team.csv"', "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ code: agent.invite_code, canInvite, expiresAt: agent.invite_expires_at, members: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, counts, page, pageSize }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load your team. Please try again." }, { status: 500 }); }
}
