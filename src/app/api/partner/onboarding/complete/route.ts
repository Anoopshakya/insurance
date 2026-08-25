import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, verifyRequestToken } from "@/lib/firebase-admin";
import { supabaseServer } from "@/lib/supabase-server";

const profileSchema = z.object({
  dateOfBirth: z.string().date(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  fatherOrSpouseName: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(100),
  panNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN"),
  aadhaarNumber: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => /^\d{12}$/.test(value), "Enter a valid 12-digit Aadhaar number"),
  city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid PIN code"),
  accountHolder: z.string().trim().min(2).max(100), bankName: z.string().trim().min(2).max(100),
  branchName: z.string().trim().min(2).max(100), accountType: z.enum(["savings", "current"]),
  accountNumber: z.string().trim().regex(/^\d{6,20}$/, "Enter a valid bank account number"),
  confirmAccountNumber: z.string().trim(), ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
}).superRefine((value, context) => { if (value.accountNumber !== value.confirmAccountNumber) context.addIssue({ code: "custom", path: ["confirmAccountNumber"], message: "Account numbers do not match" }); const dob = new Date(`${value.dateOfBirth}T00:00:00Z`); const adultDate = new Date(); adultDate.setUTCFullYear(adultDate.getUTCFullYear() - 18); if (dob > adultDate) context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Partner must be at least 18 years old" }); });

const fileTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
function validFile(value: FormDataEntryValue | null): value is File { return value instanceof File && value.size > 0 && value.size <= 5 * 1024 * 1024 && fileTypes.has(value.type); }

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded || decoded.role !== "partner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const form = await req.formData(); const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
    const input = profileSchema.parse(values); const panDocument = form.get("panDocument"); const aadhaarDocument = form.get("aadhaarDocument");
    if (!validFile(panDocument) || !validFile(aadhaarDocument)) return NextResponse.json({ error: "Upload PAN and Aadhaar documents as PDF, JPG or PNG under 5 MB each" }, { status: 400 });
    const db = supabaseServer(); const { data: agent, error: agentError } = await db.from("agents").select("id,status").eq("user_id", decoded.uid).single();
    if (agentError) return NextResponse.json({ error: agentError.message }, { status: 400 });
    if (agent.status === "active") return NextResponse.json({ error: "Approved profiles cannot be resubmitted" }, { status: 409 });
    const bucket = "kyc-documents"; const { data: buckets } = await db.storage.listBuckets(); if (!buckets?.some((item) => item.name === bucket)) await db.storage.createBucket(bucket, { public: false, fileSizeLimit: 5242880, allowedMimeTypes: [...fileTypes] });
    const uploads: Array<{ type: string; path: string; file: File }> = [{ type: "pan", path: `${agent.id}/pan-${crypto.randomUUID()}.${panDocument.name.split(".").pop()}`, file: panDocument }, { type: "aadhaar", path: `${agent.id}/aadhaar-${crypto.randomUUID()}.${aadhaarDocument.name.split(".").pop()}`, file: aadhaarDocument }];
    for (const upload of uploads) { const { error } = await db.storage.from(bucket).upload(upload.path, Buffer.from(await upload.file.arrayBuffer()), { contentType: upload.file.type }); if (error) throw error; }
    const now = new Date().toISOString();
    const { error: personalError } = await db.from("partner_personal_details").upsert({ agent_id: agent.id, date_of_birth: input.dateOfBirth, gender: input.gender, father_or_spouse_name: input.fatherOrSpouseName, occupation: input.occupation, pan_number: input.panNumber, aadhaar_last4: input.aadhaarNumber.slice(-4), city: input.city, state: input.state, postal_code: input.postalCode, updated_at: now }, { onConflict: "agent_id" });
    if (personalError) throw personalError;
    const { error: bankError } = await db.from("agent_bank_details").upsert({ agent_id: agent.id, account_holder: input.accountHolder, bank_name: input.bankName, branch_name: input.branchName, account_type: input.accountType, account_number: input.accountNumber, ifsc: input.ifsc, verification_status: "pending" }, { onConflict: "agent_id" }); if (bankError) throw bankError;
    await db.from("agent_documents").delete().eq("agent_id", agent.id).in("doc_type", ["pan", "aadhaar"]);
    const { error: documentError } = await db.from("agent_documents").insert(uploads.map((upload) => ({ agent_id: agent.id, doc_type: upload.type, file_url: upload.path, status: "submitted", created_at: now }))); if (documentError) throw documentError;
    await db.from("agents").update({ status: "under_review", kyc_status: "submitted", updated_at: now }).eq("id", agent.id); await db.from("users").update({ status: "pending_approval", updated_at: now }).eq("id", decoded.uid);
    const authUser = await adminAuth.getUser(decoded.uid); await adminAuth.setCustomUserClaims(decoded.uid, { ...authUser.customClaims, role: "partner", mustCompleteProfile: false }); await db.from("audit_logs").insert({ entity_type: "agent", entity_id: agent.id, action: "profile_submitted", actor_id: decoded.uid, after_state: { status: "under_review", kyc_status: "submitted", pan: `******${input.panNumber.slice(-4)}`, aadhaar: `********${input.aadhaarNumber.slice(-4)}` } });
    return NextResponse.json({ ok: true });
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid profile details", fields: error.flatten().fieldErrors }, { status: 400 }); return NextResponse.json({ error: error instanceof Error ? error.message : "Profile submission failed" }, { status: 400 }); }
}
