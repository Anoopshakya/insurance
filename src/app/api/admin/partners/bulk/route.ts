import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { verifyRequestToken } from "@/lib/auth-server";
import { ensureAdminPermission } from "@/lib/rbac";
import { createPartner } from "@/lib/partners/service";

const headerMap: Record<string, string> = { name: "fullName", "full name": "fullName", fullname: "fullName", mobile: "mobile", phone: "mobile", "mobile number": "mobile", email: "email", region: "region", "partner type": "partnerType", partnertype: "partnerType", "sponsor code": "sponsorCode", sponsorcode: "sponsorCode" };

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await ensureAdminPermission(decoded.uid, decoded.email, "agents", "create"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select an Excel file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Excel file must be smaller than 5 MB" }, { status: 400 });
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) return NextResponse.json({ error: "Upload an .xlsx or .xlsm file" }, { status: 400 });

  try {
    const workbook = new ExcelJS.Workbook();
    // ExcelJS ships its own legacy Buffer shape; the runtime accepts ArrayBuffer-backed Buffers.
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) throw new Error("The workbook has no partner rows");
    if (sheet.rowCount > 501) throw new Error("A maximum of 500 partners can be imported at once");
    const headers: Record<number, string> = {};
    sheet.getRow(1).eachCell((cell, column) => { const key = String(cell.text).trim().toLowerCase(); if (headerMap[key]) headers[column] = headerMap[key]; });
    if (!Object.values(headers).includes("fullName") || !Object.values(headers).includes("mobile")) throw new Error("Excel must include Name and Mobile columns");

    const results: Array<{ row: number; name: string; mobile: string; status: "created" | "failed"; agentCode?: string; error?: string }> = [];
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber); const input: Record<string, string> = {};
      Object.entries(headers).forEach(([column, field]) => { input[field] = row.getCell(Number(column)).text.trim(); });
      if (!input.fullName && !input.mobile) continue;
      try { const partner = await createPartner(input as never, decoded.uid); results.push({ row: rowNumber, name: input.fullName, mobile: input.mobile, status: "created", agentCode: partner.agent_code }); }
      catch (error) { results.push({ row: rowNumber, name: input.fullName, mobile: input.mobile, status: "failed", error: error instanceof Error ? error.message : "Creation failed" }); }
    }
    return NextResponse.json({ data: { total: results.length, created: results.filter((r) => r.status === "created").length, failed: results.filter((r) => r.status === "failed").length, rows: results } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read Excel file" }, { status: 400 }); }
}
