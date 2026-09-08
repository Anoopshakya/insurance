import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { customerSyncSchema } from "@/lib/customers/schema";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const decoded = await verifyRequestToken(
    request.headers.get("authorization"),
  );
  if (!decoded?.email)
    return NextResponse.json(
      { error: "Please sign in with a verified email address." },
      { status: 401 },
    );
  const parsed = customerSyncSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid customer details." },
      { status: 400 },
    );
  const db = supabaseServer();
  const email = decoded.email.toLowerCase();
  const { data: agent } = await db
    .from("agents")
    .select("id")
    .eq("user_id", decoded.uid)
    .maybeSingle();
  const { data: identity } = await db
    .from("users")
    .select("portal,status")
    .eq("id", decoded.uid)
    .maybeSingle();
  if (agent || (identity && identity.portal !== "customer"))
    return NextResponse.json(
      { error: "This account belongs to another MagikPolicy portal." },
      { status: 403 },
    );
  if (identity?.status === "suspended")
    return NextResponse.json(
      { error: "This customer account is suspended. Please contact support." },
      { status: 403 },
    );

  const { data: existing } = await db
    .from("customers")
    .select("id,user_id,name,contact,email")
    .eq("user_id", decoded.uid)
    .maybeSingle();
  if (existing) {
    const { data: role } = await db
      .from("roles")
      .select("id")
      .eq("user_type", "customer")
      .eq("is_default", true)
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
  if (!parsed.data.allowCreate)
    return NextResponse.json(
      { error: "No customer account was found. Please register first." },
      { status: 404 },
    );
  const { data: emailMatch } = await db
    .from("customers")
    .select("id,user_id,email,contact")
    .ilike("email", email)
    .maybeSingle();
  const { data: mobileMatch } = parsed.data.mobile
    ? await db
        .from("customers")
        .select("id,user_id,email,contact")
        .eq("contact", parsed.data.mobile)
        .maybeSingle()
    : { data: null };
  if (emailMatch?.user_id && emailMatch.user_id !== decoded.uid)
    return NextResponse.json(
      { error: "This email address is already registered." },
      { status: 409 },
    );
  if (mobileMatch?.user_id && mobileMatch.user_id !== decoded.uid)
    return NextResponse.json(
      { error: "This mobile number is already registered." },
      { status: 409 },
    );
  if (emailMatch && mobileMatch && emailMatch.id !== mobileMatch.id)
    return NextResponse.json(
      {
        error:
          "The email address and mobile number belong to different customer records.",
      },
      { status: 409 },
    );
  const matchedCustomer = emailMatch || mobileMatch;

  const {
    data: { user: authUser },
  } = await db.auth.admin.getUserById(decoded.uid);
  const fullName =
    parsed.data.fullName ||
    String(
      authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || "",
    ) ||
    email.split("@")[0];
  const now = new Date().toISOString();
  const { error: userError } = await db.from("users").upsert(
    {
      id: decoded.uid,
      email,
      phone: parsed.data.mobile || authUser?.phone || null,
      full_name: fullName,
      portal: "customer",
      status: "active",
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (userError)
    return NextResponse.json({ error: userError.message }, { status: 400 });
  const customerMutation = matchedCustomer
    ? db
        .from("customers")
        .update({
          user_id: decoded.uid,
          name: matchedCustomer.id ? fullName : undefined,
          contact: parsed.data.mobile || matchedCustomer.contact,
          email,
          updated_at: now,
        })
        .eq("id", matchedCustomer.id)
    : db.from("customers").insert({
        user_id: decoded.uid,
        agent_id: null,
        name: fullName,
        contact: parsed.data.mobile || authUser?.phone || null,
        email,
        created_at: now,
        updated_at: now,
      });
  const { data: customer, error: customerError } = await customerMutation
    .select("id,user_id,name,contact,email")
    .single();
  if (customerError) {
    if (!identity) await db.from("users").delete().eq("id", decoded.uid);
    return NextResponse.json(
      {
        error:
          customerError.code === "23505"
            ? "This email address or mobile number is already registered."
            : customerError.message,
      },
      { status: customerError.code === "23505" ? 409 : 400 },
    );
  }
  const { data: role } = await db
    .from("roles")
    .select("id")
    .eq("user_type", "customer")
    .eq("is_default", true)
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
  return NextResponse.json({ data: customer }, { status: 201 });
}
