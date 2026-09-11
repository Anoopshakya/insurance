import { z } from "zod";
export const quotationProductTypes = ["health", "motor", "term", "life", "travel", "investment", "car", "bike", "family", "personal-accident"] as const;
export function normalizeQuotePhone(value: string) {
  const digits = value.replace(/[\s()+-]/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
export const quoteRequestSchema = z.object({
  productType: z.enum(quotationProductTypes),
  customerName: z.string().trim().min(2, "Enter your full name").max(100),
  mobile: z.string().transform(normalizeQuotePhone).pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  selections: z.record(z.string().max(60), z.string().trim().min(1).max(100)).default({}),
  email: z.union([z.string().trim().email("Enter a valid email address").max(254), z.literal("")]).optional(),
  sourcePath: z.string().max(200).regex(/^\/(?:[a-zA-Z0-9/_-]*)$/, "Invalid page address").optional(),
  website: z.string().max(0).optional(),
});
