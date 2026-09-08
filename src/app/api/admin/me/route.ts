import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth-server";
import { userHasPermission } from "@/lib/rbac";
export async function GET(request: NextRequest) {
  const user = await verifyRequestToken(request.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!await userHasPermission(user.uid, "system", "manage_roles")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ data: { id: user.uid, email: user.email } });
}
