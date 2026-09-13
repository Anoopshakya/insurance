import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRequestToken } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase-server";
import { personalSchema, identitySchema, bankSchema, personalColumns, bankColumns, formValues } from "@/lib/partners/onboarding";

const fileTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
function validFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= 5 * 1024 * 1024 && fileTypes.has(value.type);
}
async function loadProfile(db: ReturnType<typeof supabaseServer>, agentId: string) {
  const results = await Promise.all([
    db.from("partner_personal_details").select("*").eq("agent_id", agentId).maybeSingle(),
    db.from("agent_bank_details").select("*").eq("agent_id", agentId).maybeSingle(),
    db.from("agent_documents").select("doc_type").eq("agent_id", agentId).in("doc_type", ["pan", "aadhaar"]),
  ]);
  for (const result of results) if (result.error) throw result.error;
  const personal = results[0].data;
  const values = { ...formValues(personal, personalColumns), ...formValues(results[1].data, bankColumns), panNumber: personal?.pan_number || "" };
  const personalSaved = personalSchema.safeParse(values).success;
  const identitySaved = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(personal?.pan_number || "") && /^\d{4}$/.test(personal?.aadhaar_last4 || "") && ["pan", "aadhaar"].every(type => results[2].data?.some(doc => doc.doc_type === type));
  return { values, personalSaved, identitySaved, aadhaarLast4: personal?.aadhaar_last4 || "", step: personalSaved ? identitySaved ? 3 : 2 : 1 };
}
export async function GET(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded || decoded.role !== "partner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const db = supabaseServer();
    const { data: agent, error } = await db.from("agents").select("id,status,kyc_status").eq("user_id", decoded.uid).single();
    if (error) throw error;
    return NextResponse.json({ data: { ...await loadProfile(db, agent.id), status: agent.status, kycStatus: agent.kyc_status } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load profile details" }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded || decoded.role !== "partner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const form = await req.formData();
    const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
    const step = z.enum(["1", "2", "3"]).parse(form.get("step"));
    const db = supabaseServer();
    const { data: agent, error } = await db.from("agents").select("id,status,kyc_status").eq("user_id", decoded.uid).single();
    if (error) throw error;
    if (agent.status === "active" || !["not_started", "skipped", "rejected"].includes(agent.kyc_status)) return NextResponse.json({ error: "Submitted or approved profiles cannot be resubmitted" }, { status: 409 });
    const now = new Date().toISOString();
    if (step === "1") {
      const input = personalSchema.parse(values);
      const row = Object.fromEntries(Object.entries(personalColumns).map(([field, column]) => [column, input[field as keyof typeof input] || null]));
      const { error } = await db.from("partner_personal_details").upsert({ ...row, agent_id: agent.id, updated_at: now }, { onConflict: "agent_id" });
      if (error) throw error;
    } else {
      const saved = await loadProfile(db, agent.id);
      if (!saved.personalSaved) return NextResponse.json({ error: "Save personal information first" }, { status: 400 });
      if (step === "2") {
        // Previously saved identity can be reused without retaining the full Aadhaar number in the browser.
        const reuse = saved.identitySaved && values.panNumber === saved.values.panNumber && !values.aadhaarNumber && ![form.get("panDocument"), form.get("aadhaarDocument")].some(file => file instanceof File && file.size > 0);
        if (!reuse) {
          const input = identitySchema.parse(values);
          const pan = form.get("panDocument"), aadhaar = form.get("aadhaarDocument");
          if (!validFile(pan) || !validFile(aadhaar)) return NextResponse.json({ error: "Upload PAN and Aadhaar documents as PDF, JPG or PNG under 5 MB each" }, { status: 400 });
          const bucket = "kyc-documents";
          const { data: buckets, error: bucketError } = await db.storage.listBuckets();
          if (bucketError) throw bucketError;
          if (!buckets?.some(item => item.name === bucket)) {
            const { error } = await db.storage.createBucket(bucket, { public: false, fileSizeLimit: 5242880, allowedMimeTypes: [...fileTypes] });
            if (error) throw error;
          }
          const uploads = [{ type: "pan", file: pan }, { type: "aadhaar", file: aadhaar }].map(upload => ({ ...upload, path: `${agent.id}/${upload.type}-${crypto.randomUUID()}.${upload.file.type === "application/pdf" ? "pdf" : upload.file.type === "image/png" ? "png" : "jpg"}` }));
          for (const upload of uploads) {
            const { error } = await db.storage.from(bucket).upload(upload.path, Buffer.from(await upload.file.arrayBuffer()), { contentType: upload.file.type });
            if (error) throw error;
          }
          const { error: personalError } = await db.from("partner_personal_details").update({ pan_number: input.panNumber, aadhaar_last4: input.aadhaarNumber.slice(-4), updated_at: now }).eq("agent_id", agent.id);
          if (personalError) throw personalError;
          const { error: deleteError } = await db.from("agent_documents").delete().eq("agent_id", agent.id).in("doc_type", ["pan", "aadhaar"]);
          if (deleteError) throw deleteError;
          const { error: documentError } = await db.from("agent_documents").insert(uploads.map(upload => ({ agent_id: agent.id, doc_type: upload.type, file_url: upload.path, status: "submitted", created_at: now })));
          if (documentError) throw documentError;
        }
      } else {
        if (!saved.identitySaved) return NextResponse.json({ error: "Save identity information first" }, { status: 400 });
        const input = bankSchema.parse(values);
        const row = Object.fromEntries(Object.entries(bankColumns).map(([field, column]) => [column, input[field as keyof typeof input]]));
        const { error: bankError } = await db.from("agent_bank_details").upsert({ ...row, agent_id: agent.id, verification_status: "pending" }, { onConflict: "agent_id" });
        if (bankError) throw bankError;
        const { error: userError } = await db.from("users").update({ status: "pending_approval", updated_at: now }).eq("id", decoded.uid);
        if (userError) throw userError;
        const { error: agentError } = await db.from("agents").update({ status: "under_review", kyc_status: "submitted", updated_at: now }).eq("id", agent.id);
        if (agentError) throw agentError;
        await db.from("audit_logs").insert({ entity_type: "agent", entity_id: agent.id, action: "profile_submitted", actor_id: decoded.uid, after_state: { status: "under_review", kyc_status: "submitted" } });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Unable to save profile. Please try again." }, { status: 400 });
  }
}
