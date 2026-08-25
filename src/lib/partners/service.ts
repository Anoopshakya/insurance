import { adminAuth } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";
import { sendPartnerWelcome } from "@/lib/notifications/provider";
import { partnerInputSchema, type PartnerInput } from "./schema";

export function createAgentCode() {
  return `MP${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function createPartner(raw: PartnerInput, actorId: string) {
  const input = partnerInputSchema.parse(raw);
  const db = supabaseServer();
  if (input.mobile) { const { data } = await db.from("users").select("id").eq("phone", input.mobile).maybeSingle(); if (data) throw new Error("A user with this mobile number already exists"); }
  if (input.email) { const { data } = await db.from("users").select("id").eq("email", input.email).maybeSingle(); if (data) throw new Error("A user with this email already exists"); }

  let sponsorId: string | null = null;
  if (input.sponsorCode) {
    const { data: sponsor, error } = await db.from("agents").select("id").eq("agent_code", input.sponsorCode).maybeSingle();
    if (error) throw error;
    if (!sponsor) throw new Error("Sponsor code was not found");
    sponsorId = sponsor.id;
  }

  let firebaseUser;
  try {
    firebaseUser = await adminAuth.createUser({ email: input.email || undefined, phoneNumber: input.mobile || undefined, displayName: input.fullName, disabled: false });
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code.includes("already-exists")) throw new Error("A login account with this email or mobile already exists");
    throw error;
  }

  const agentCode = createAgentCode();
  let createdAgentId: string | null = null;
  try {
    await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: "partner", mustCompleteProfile: true });
    const now = new Date().toISOString();
    const { error: userError } = await db.from("users").insert({ id: firebaseUser.uid, email: input.email || null, phone: input.mobile || null, full_name: input.fullName, portal: "partner", status: "invited", created_at: now, updated_at: now });
    if (userError) throw userError;
    const { data: agent, error: agentError } = await db.from("agents").insert({ user_id: firebaseUser.uid, agent_code: agentCode, sponsor_id: sponsorId, agent_type: "partner", partner_type: input.partnerType || "standard", source: "admin_invite", region: input.state || null, agency_name: input.agencyName || null, designation: input.designation || null, joining_date: input.joiningDate || now.slice(0, 10), status: "invited", kyc_status: "not_started", performance_level: "starter", created_at: now, updated_at: now }).select().single();
    if (agentError) throw agentError;
    createdAgentId = agent.id;
    const { data: role, error: roleError } = await db.from("roles").select("id").eq("name", "agent").single();
    if (roleError) throw roleError;
    const { error: roleMapError } = await db.from("user_roles").insert({ user_id: firebaseUser.uid, role_id: role.id });
    if (roleMapError) throw roleMapError;
    if (input.dateOfBirth || input.gender || input.panNumber || input.aadhaarNumber || input.state || input.city || input.postalCode) {
      const { error: personalError } = await db.from("partner_personal_details").insert({ agent_id: agent.id, date_of_birth: input.dateOfBirth || null, gender: input.gender || null, pan_number: input.panNumber || null, aadhaar_last4: input.aadhaarNumber ? input.aadhaarNumber.slice(-4) : null, city: input.city || null, state: input.state || null, postal_code: input.postalCode || null, updated_at: now });
      if (personalError) throw personalError;
    }
    await db.from("audit_logs").insert({ entity_type: "agent", entity_id: agent.id, action: "invite", actor_id: actorId, after_state: agent });
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${base}/partner/register?${input.email ? `email=${encodeURIComponent(input.email)}` : `mobile=${encodeURIComponent(input.mobile)}`}`;
    const requestedChannels = [...(input.sendEmail === true || input.sendEmail === "true" ? ["email" as const] : []), ...(input.sendSms === true || input.sendSms === "true" ? ["sms" as const] : [])];
    const deliveryWasSelected = input.sendEmail !== undefined || input.sendSms !== undefined;
    const delivery = await sendPartnerWelcome({ mobile: input.mobile || undefined, email: input.email || undefined, fullName: input.fullName, agentCode, inviteUrl, channels: deliveryWasSelected ? requestedChannels : undefined });
    return { ...agent, fullName: input.fullName, mobile: input.mobile, email: input.email, inviteUrl, delivery };
  } catch (error) {
    await adminAuth.deleteUser(firebaseUser.uid).catch(() => undefined);
    if (createdAgentId) await db.from("agents").delete().eq("id", createdAgentId);
    await db.from("users").delete().eq("id", firebaseUser.uid);
    throw error;
  }
}
