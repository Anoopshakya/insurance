import { supabaseServer } from "@/lib/supabase-server";

type WelcomeMessage = { mobile?: string; email?: string; fullName: string; agentCode: string; inviteUrl: string; channels?: Array<"email" | "sms"> };

export type DeliveryResult = { channel: "email" | "sms"; status: "sent" | "queued" | "failed"; detail?: string };

function welcomeText(input: WelcomeMessage) {
  return `You are invited to join MagikPolicy as a partner, ${input.fullName}. Partner ID: ${input.agentCode}. Verify your email or mobile and complete your profile here: ${input.inviteUrl}`;
}

async function deliver(channel: "email" | "sms", input: WelcomeMessage): Promise<DeliveryResult> {
  const url = channel === "email" ? process.env.EMAIL_WEBHOOK_URL : process.env.SMS_WEBHOOK_URL;
  if (channel === "email" && !url && input.email && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestType: "EMAIL_SIGNIN", email: input.email, continueUrl: input.inviteUrl, canHandleCodeInApp: true }) });
      return response.ok ? { channel, status: "sent" } : { channel, status: "failed", detail: "Firebase email-link delivery failed" };
    } catch (error) { return { channel, status: "failed", detail: error instanceof Error ? error.message : "Firebase email delivery failed" }; }
  }
  if (!url) return { channel, status: "queued", detail: "Provider webhook is not configured" };
  try {
    const recipient = channel === "email" ? input.email : input.mobile;
    if (!recipient) return { channel, status: "queued", detail: "No recipient for this channel" };
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(process.env.NOTIFICATION_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ to: recipient, subject: "Complete your MagikPolicy partner profile", message: welcomeText(input), event: "partner_invitation" }) });
    return response.ok ? { channel, status: "sent" } : { channel, status: "failed", detail: `Provider returned ${response.status}` };
  } catch (error) {
    return { channel, status: "failed", detail: error instanceof Error ? error.message : "Delivery failed" };
  }
}

export async function sendPartnerWelcome(input: WelcomeMessage) {
  const channels: Array<"email" | "sms"> = input.channels ?? [...(input.email ? ["email" as const] : []), ...(input.mobile ? ["sms" as const] : [])];
  const results = await Promise.all(channels.map((channel) => deliver(channel, input)));
  const db = supabaseServer();
  if (results.length) await db.from("message_logs").insert(results.map((result) => ({ channel: result.channel, recipient: result.channel === "email" ? input.email : input.mobile, status: result.status, sent_at: result.status === "sent" ? new Date().toISOString() : null })));
  return results;
}
