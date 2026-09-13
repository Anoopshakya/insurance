import { supabaseServer } from "@/lib/supabase-server";
import { sendPartnerWelcome } from "@/lib/notifications/provider";
import { partnerInputSchema, partnerLoginEmail, type PartnerInput } from "./schema";
import { createIdentityCode } from "@/lib/identity-code";

export function createAgentCode(fullName: string) {
  return createIdentityCode("partner", fullName);
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

  const loginEmail=input.email||partnerLoginEmail(input.mobile);
  const temporaryPassword=input.mobile?.replace(/\D/g,"").slice(-6)||crypto.randomUUID().slice(0,10);
  const {data:authData,error:authError}=await db.auth.admin.createUser({email:loginEmail,password:temporaryPassword,email_confirm:true,user_metadata:{full_name:input.fullName,mobile:input.mobile,user_type:"partner"}});
  if(authError||!authData.user)throw new Error(authError?.message||"Could not create the partner login");
  const authUser={uid:authData.user.id};

  const agentCode = createAgentCode(input.fullName);
  let createdAgentId: string | null = null;
  try {
    const now = new Date().toISOString();
    const { error: userError } = await db.from("users").insert({ id: authUser.uid, email: input.email || loginEmail, phone: input.mobile || null, full_name: input.fullName, portal: "partner", status: "active", created_at: now, updated_at: now });
    if (userError) throw new Error(`Could not save the partner login: ${userError.message}`);
    const baseAgent = { user_id: authUser.uid, agent_code: agentCode, sponsor_id: sponsorId, agent_type: "partner", partner_type: input.partnerType || "standard", source: "admin_invite", region: input.state || null, joining_date: input.joiningDate || now.slice(0, 10), status: "draft", kyc_status: "not_started", performance_level: "starter", created_at: now, updated_at: now };
    let agentResult = await db.from("agents").insert({ ...baseAgent, name: input.fullName, ...(input.agencyName ? { agency_name: input.agencyName } : {}), ...(input.designation ? { designation: input.designation } : {}) }).select().single();
    if (agentResult.error?.message.includes("schema cache") && ["name","agency_name","designation"].some(column=>agentResult.error!.message.includes(column))) agentResult = await db.from("agents").insert(baseAgent).select().single();
    const { data: agent, error: agentError } = agentResult;
    if (agentError) throw new Error(`Could not save the partner profile: ${agentError.message}`);
    createdAgentId = agent.id;
    const { data: role, error: roleError } = await db.from("roles").select("id").eq("name", "partner").single();
    if (roleError) throw new Error(`Could not assign the partner role: ${roleError.message}`);
    const { error: roleMapError } = await db.from("user_roles").insert({ user_id: authUser.uid, role_id: role.id });
    if (roleMapError) throw new Error(`Could not assign access permissions: ${roleMapError.message}`);
    if (input.dateOfBirth || input.gender || input.panNumber || input.aadhaarNumber || input.addressLine1 || input.state || input.city || input.postalCode) {
      const { error: personalError } = await db.from("partner_personal_details").insert({ agent_id: agent.id, date_of_birth: input.dateOfBirth || null, gender: input.gender || null, pan_number: input.panNumber || null, aadhaar_last4: input.aadhaarNumber ? input.aadhaarNumber.slice(-4) : null, address_line1: input.addressLine1 || null, city: input.city || null, state: input.state || null, postal_code: input.postalCode || null, updated_at: now });
      if (personalError) throw new Error(`Could not save personal details: ${personalError.message}`);
    }
    if (input.accountNumber) {
      const { error: bankError } = await db.from("agent_bank_details").insert({ agent_id: agent.id, account_holder: input.accountHolder, bank_name: input.bankName, branch_name: input.branchName || null, account_type: input.accountType, account_number: input.accountNumber, ifsc: input.ifsc, verification_status: "pending" });
      if (bankError) throw new Error(`Could not save bank details: ${bankError.message}`);
    }
    await db.from("audit_logs").insert({ entity_type: "agent", entity_id: agent.id, action: "invite", actor_id: actorId, after_state: agent });
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${base}/partner/register?${input.email ? `email=${encodeURIComponent(input.email)}` : `mobile=${encodeURIComponent(input.mobile)}`}`;
    const requestedChannels = [...(input.sendEmail === true || input.sendEmail === "true" ? ["email" as const] : []), ...(input.sendSms === true || input.sendSms === "true" ? ["sms" as const] : [])];
    const deliveryWasSelected = input.sendEmail !== undefined || input.sendSms !== undefined;
    const delivery = await sendPartnerWelcome({ mobile: input.mobile || undefined, email: input.email || undefined, fullName: input.fullName, agentCode, inviteUrl, channels: deliveryWasSelected ? requestedChannels : undefined });
    return { ...agent, fullName: input.fullName, mobile: input.mobile, email: input.email, inviteUrl, delivery };
  } catch (error) {
    await db.auth.admin.deleteUser(authUser.uid).catch(() => undefined);
    if (createdAgentId) await db.from("agents").delete().eq("id", createdAgentId);
    await db.from("users").delete().eq("id", authUser.uid);
    throw error;
  }
}
