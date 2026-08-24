import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { verifyRequestToken } from "@/lib/firebase-admin";
import { userHasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestToken(req.headers.get("authorization"));
  if (!decoded) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!(await userHasPermission(decoded.uid, "agents", "create"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("Partners");
  sheet.columns = [{ header: "Name", key: "name", width: 28 }, { header: "Mobile", key: "mobile", width: 18 }, { header: "Email", key: "email", width: 30 }, { header: "Region", key: "region", width: 20 }, { header: "Partner Type", key: "partnerType", width: 18 }, { header: "Sponsor Code", key: "sponsorCode", width: 18 }];
  sheet.addRow({ name: "Aarav Sharma", mobile: "9876543210", email: "", region: "Mumbai", partnerType: "standard", sponsorCode: "" });
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } }; sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": "attachment; filename=magikpolicy-partners-template.xlsx" } });
}
