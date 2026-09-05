import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";
import { createAgentCode } from "@/lib/partners/service";

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const db = supabaseServer();
  const { data: identity } = await db
    .from("users")
    .select("id,portal,status")
    .eq("id", decoded.uid)
    .maybeSingle();
  if (identity && !["partner", "agent"].includes(identity.portal))
    return NextResponse.json(
      {
        error:
          "This Google account is already registered as a customer or employee. Choose a different Google account for partner registration, or ask an administrator to change its role.",
      },
      { status: 403 },
    );
  if (identity?.status === "suspended")
    return NextResponse.json(
      { error: "This partner account is suspended. Please contact support." },
      { status: 403 },
    );
  const { data: existing } = await db
    .from("agents")
    .select("id,status")
    .eq("user_id", decoded.uid)
    .maybeSingle();
  if (existing) {
    const { data: role } = await db
      .from("roles")
      .select("id")
      .eq("name", "partner")
      .single();
    if (role)
      await db
        .from("user_roles")
        .upsert(
          { user_id: decoded.uid, role_id: role.id },
          { onConflict: "user_id,role_id" },
        );
    return NextResponse.json({ data: existing });
  }
  const {
    data: { user: authUser },
  } = await db.auth.admin.getUserById(decoded.uid);
  if (!authUser)
    return NextResponse.json(
      { error: "Authentication account not found" },
      { status: 401 },
    );
  const meta = authUser.user_metadata || {},
    now = new Date().toISOString(),
    fullName = String(meta.full_name || meta.name || "New Partner"),
    phone = String(meta.mobile || authUser.phone || "") || null;
  const email =
    String(decoded.email || authUser.email || "").toLowerCase() || null;
  if (email) {
    const { data: emailMatch } = await db
      .from("users")
      .select("id")
      .ilike("email", email)
      .neq("id", decoded.uid)
      .maybeSingle();
    if (emailMatch)
      return NextResponse.json(
        { error: "This email address is already registered." },
        { status: 409 },
      );
  }
  if (phone) {
    const { data: phoneMatch } = await db
      .from("users")
      .select("id")
      .eq("phone", phone)
      .neq("id", decoded.uid)
      .maybeSingle();
    if (phoneMatch)
      return NextResponse.json(
        { error: "This mobile number is already registered." },
        { status: 409 },
      );
  }
  const { error: userError } = await db.from("users").upsert(
    {
      id: decoded.uid,
      email,
      phone,
      full_name: fullName,
      portal: "partner",
      status: "profile_pending",
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (userError)
    return NextResponse.json({ error: userError.message }, { status: 400 });
  const { data: agent, error: agentError } = await db
    .from("agents")
    .insert({
      user_id: decoded.uid,
      agent_code: createAgentCode(),
      agent_type: "partner",
      partner_type: "standard",
      source: "self_registration",
      status: "draft",
      kyc_status: "not_started",
      performance_level: "starter",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (agentError) {
    if (!identity) await db.from("users").delete().eq("id", decoded.uid);
    return NextResponse.json({ error: agentError.message }, { status: 400 });
  }
  const { data: role } = await db
    .from("roles")
    .select("id")
    .eq("name", "partner")
    .single();
  if (role) {
    const { error: roleError } = await db
      .from("user_roles")
      .upsert(
        { user_id: decoded.uid, role_id: role.id },
        { onConflict: "user_id,role_id" },
      );
    if (roleError)
      return NextResponse.json({ error: roleError.message }, { status: 400 });
  }
  return NextResponse.json({ data: agent }, { status: 201 });
}
