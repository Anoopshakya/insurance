import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

function validFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= maxSize && allowedTypes.has(value.type);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const whatsappNumber = String(form.get("whatsappNumber") || "").trim();
    const claimAmount = Number(form.get("claimAmount"));
    const reason = String(form.get("reason") || "").trim();
    const location = String(form.get("location") || "").trim();
    const website = String(form.get("website") || "");
    const policyDocument = form.get("policyDocument");
    const failureDocument = form.get("failureDocument");

    if (website) return NextResponse.json({ ok: true }, { status: 201 });
    if (name.length < 2 || name.length > 100)
      return NextResponse.json({ error: "Enter your full name" }, { status: 400 });
    if (!/^\d{10}$/.test(whatsappNumber))
      return NextResponse.json({ error: "Enter a valid 10-digit WhatsApp number" }, { status: 400 });
    if (!Number.isFinite(claimAmount) || claimAmount <= 0)
      return NextResponse.json({ error: "Enter a valid claim amount" }, { status: 400 });
    if (reason.length < 10 || reason.length > 1000)
      return NextResponse.json({ error: "Explain why the claim failed" }, { status: 400 });
    if (location.length < 2 || location.length > 150)
      return NextResponse.json({ error: "Enter your location" }, { status: 400 });
    if (!validFile(policyDocument) || !validFile(failureDocument))
      return NextResponse.json({ error: "Attach both documents as PDF, JPG, PNG or WEBP under 5 MB" }, { status: 400 });

    const db = supabaseServer();
    const requestId = crypto.randomUUID();
    const extension = (file: File) => file.name.split(".").pop()?.toLowerCase() || "bin";
    const policyPath = `${requestId}/policy.${extension(policyDocument)}`;
    const failurePath = `${requestId}/failure.${extension(failureDocument)}`;
    const bucket = db.storage.from("claim-help-documents");
    const [policyUpload, failureUpload] = await Promise.all([
      bucket.upload(policyPath, Buffer.from(await policyDocument.arrayBuffer()), { contentType: policyDocument.type }),
      bucket.upload(failurePath, Buffer.from(await failureDocument.arrayBuffer()), { contentType: failureDocument.type }),
    ]);
    if (policyUpload.error || failureUpload.error) {
      await bucket.remove([policyPath, failurePath]);
      throw policyUpload.error || failureUpload.error;
    }
    const { data, error } = await db.from("claim_help_requests").insert({
      id: requestId,
      name,
      whatsapp_number: whatsappNumber,
      claim_amount: claimAmount,
      claim_failure_reason: reason,
      location,
      policy_document_path: policyPath,
      failure_document_path: failurePath,
    }).select("id").single();
    if (error) {
      await bucket.remove([policyPath, failurePath]);
      throw error;
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Claim help request failed", error);
    return NextResponse.json({ error: "Unable to submit your request. Please try again." }, { status: 500 });
  }
}
