import { z } from "zod";

export function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return value;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export const partnerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100).regex(/^[\p{L} .'-]+$/u, "Name can contain letters only"),
  mobile: z.string().transform((value) => value ? normalizeMobile(value) : "").refine((value) => !value || /^\+91\d{10}$/.test(value), "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().transform(normalizeDate).optional().or(z.literal("")),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  panNumber: z.string().trim().toUpperCase().optional().or(z.literal("")),
  aadhaarNumber: z.string().transform((value) => value.replace(/\D/g, "")).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(250).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  agencyName: z.string().trim().max(120).optional().or(z.literal("")),
  designation: z.string().trim().max(60).optional().or(z.literal("")),
  joiningDate: z.string().trim().optional().or(z.literal("")),
  partnerType: z.string().trim().max(50).optional().or(z.literal("")),
  sponsorCode: z.string().trim().max(40).optional().or(z.literal("")),
  accountHolder: z.string().trim().max(120).optional().or(z.literal("")),
  bankName: z.string().trim().max(120).optional().or(z.literal("")),
  branchName: z.string().trim().max(120).optional().or(z.literal("")),
  accountType: z.enum(["savings", "current"]).optional().or(z.literal("")),
  accountNumber: z.string().transform((value) => value.replace(/\D/g, "")).optional().or(z.literal("")),
  confirmAccountNumber: z.string().transform((value) => value.replace(/\D/g, "")).optional().or(z.literal("")),
  ifsc: z.string().trim().toUpperCase().optional().or(z.literal("")),
  sendEmail: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  sendSms: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
}).superRefine((value, context) => {
  if (!value.mobile && !value.email) context.addIssue({ code: "custom", message: "Enter an email address or mobile number", path: ["mobile"] });
  if (value.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.panNumber)) context.addIssue({ code: "custom", message: "Enter a valid PAN number", path: ["panNumber"] });
  if (value.aadhaarNumber && !/^\d{12}$/.test(value.aadhaarNumber)) context.addIssue({ code: "custom", message: "Enter a valid 12-digit Aadhaar number", path: ["aadhaarNumber"] });
  if (value.dateOfBirth) {
    const birthDate = new Date(`${value.dateOfBirth}T00:00:00Z`);
    const today = new Date();
    const latestAllowed = new Date(Date.UTC(today.getUTCFullYear() - 16, today.getUTCMonth(), today.getUTCDate()));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.dateOfBirth) || Number.isNaN(birthDate.getTime())) context.addIssue({ code: "custom", message: "Enter date of birth as DD/MM/YYYY", path: ["dateOfBirth"] });
    else if (birthDate > latestAllowed) context.addIssue({ code: "custom", message: "Partner must be at least 16 years old", path: ["dateOfBirth"] });
  }
  if (value.postalCode && !/^[1-9]\d{5}$/.test(value.postalCode)) context.addIssue({ code: "custom", message: "Enter a valid PIN code", path: ["postalCode"] });
  const hasBankDetails = Boolean(value.accountHolder || value.bankName || value.branchName || value.accountType || value.accountNumber || value.confirmAccountNumber || value.ifsc);
  if (hasBankDetails) {
    if (!value.accountHolder) context.addIssue({ code: "custom", message: "Account holder name is required", path: ["accountHolder"] });
    if (!value.bankName) context.addIssue({ code: "custom", message: "Bank name is required", path: ["bankName"] });
    if (!value.accountType) context.addIssue({ code: "custom", message: "Account type is required", path: ["accountType"] });
    if (!value.accountNumber || !/^\d{6,20}$/.test(value.accountNumber)) context.addIssue({ code: "custom", message: "Enter a valid 6 to 20 digit account number", path: ["accountNumber"] });
    if (value.accountNumber !== value.confirmAccountNumber) context.addIssue({ code: "custom", message: "Account numbers do not match", path: ["confirmAccountNumber"] });
    if (!value.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.ifsc)) context.addIssue({ code: "custom", message: "Enter a valid IFSC code", path: ["ifsc"] });
  }
  if ((value.sendEmail === true || value.sendEmail === "true") && !value.email) context.addIssue({ code: "custom", message: "Email is required for email delivery", path: ["email"] });
  if ((value.sendSms === true || value.sendSms === "true") && !value.mobile) context.addIssue({ code: "custom", message: "Mobile is required for SMS delivery", path: ["mobile"] });
  const deliveryWasSelected = value.sendEmail !== undefined || value.sendSms !== undefined;
  if (deliveryWasSelected && value.sendEmail !== true && value.sendEmail !== "true" && value.sendSms !== true && value.sendSms !== "true") context.addIssue({ code: "custom", message: "Select SMS or email invitation delivery", path: ["sendSms"] });
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

export function partnerLoginEmail(mobile: string) {
  return `${mobile.replace(/\D/g, "")}@partners.magikpolicy.com`;
}
