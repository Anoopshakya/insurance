import { z } from "zod";

export function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (value.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return value;
}

export const partnerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100),
  mobile: z.string().transform((value) => value ? normalizeMobile(value) : "").refine((value) => !value || /^\+[1-9]\d{9,14}$/.test(value), "Enter a valid mobile number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  panNumber: z.string().trim().toUpperCase().optional().or(z.literal("")),
  aadhaarNumber: z.string().transform((value) => value.replace(/\D/g, "")).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  agencyName: z.string().trim().max(120).optional().or(z.literal("")),
  designation: z.string().trim().max(60).optional().or(z.literal("")),
  joiningDate: z.string().trim().optional().or(z.literal("")),
  partnerType: z.string().trim().max(50).optional().or(z.literal("")),
  sponsorCode: z.string().trim().max(40).optional().or(z.literal("")),
  sendEmail: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  sendSms: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
}).superRefine((value, context) => {
  if (!value.mobile && !value.email) context.addIssue({ code: "custom", message: "Enter an email address or mobile number", path: ["mobile"] });
  if (value.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.panNumber)) context.addIssue({ code: "custom", message: "Enter a valid PAN number", path: ["panNumber"] });
  if (value.aadhaarNumber && !/^\d{12}$/.test(value.aadhaarNumber)) context.addIssue({ code: "custom", message: "Enter a valid 12-digit Aadhaar number", path: ["aadhaarNumber"] });
  if (value.postalCode && !/^[1-9]\d{5}$/.test(value.postalCode)) context.addIssue({ code: "custom", message: "Enter a valid PIN code", path: ["postalCode"] });
  if ((value.sendEmail === true || value.sendEmail === "true") && !value.email) context.addIssue({ code: "custom", message: "Email is required for email delivery", path: ["email"] });
  if ((value.sendSms === true || value.sendSms === "true") && !value.mobile) context.addIssue({ code: "custom", message: "Mobile is required for SMS delivery", path: ["mobile"] });
  const deliveryWasSelected = value.sendEmail !== undefined || value.sendSms !== undefined;
  if (deliveryWasSelected && value.sendEmail !== true && value.sendEmail !== "true" && value.sendSms !== true && value.sendSms !== "true") context.addIssue({ code: "custom", message: "Select SMS or email invitation delivery", path: ["sendSms"] });
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

export function partnerLoginEmail(mobile: string) {
  return `${mobile.replace(/\D/g, "")}@partners.magikpolicy.com`;
}
