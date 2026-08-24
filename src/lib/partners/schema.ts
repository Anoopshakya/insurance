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
  region: z.string().trim().max(80).optional().or(z.literal("")),
  partnerType: z.string().trim().max(50).optional().or(z.literal("")),
  sponsorCode: z.string().trim().max(40).optional().or(z.literal("")),
}).refine((value) => Boolean(value.mobile || value.email), { message: "Enter an email address or mobile number", path: ["mobile"] });

export type PartnerInput = z.infer<typeof partnerInputSchema>;

export function partnerLoginEmail(mobile: string) {
  return `${mobile.replace(/\D/g, "")}@partners.magikpolicy.com`;
}
