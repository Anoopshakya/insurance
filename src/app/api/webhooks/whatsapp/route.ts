import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Meta calls this public endpoint when the callback URL is verified.
export async function GET(request: NextRequest) {
  const configuredToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
  const headers = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };
  if (!configuredToken) return new NextResponse("Webhook verification is not configured", { status: 503, headers });

  const params = request.nextUrl.searchParams;
  const token = params.get("hub.verify_token") || "";
  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(token);
  if (params.get("hub.mode") !== "subscribe" || expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return new NextResponse("Verification failed", { status: 403, headers });
  }
  const challenge = params.get("hub.challenge");
  if (!challenge) return new NextResponse("Missing challenge", { status: 400, headers });
  return new NextResponse(challenge, { status: 200, headers });
}
