import { z } from "zod";

export function normalizeCustomerMobile(value: string) {
  const digits = value.replace(/[\s()+-]/g, "");
  return digits.length === 10 ? `+91${digits}` : value.trim();
}

export const customerSyncSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100).optional(),
  mobile: z.string().trim().transform(normalizeCustomerMobile).refine(value => !value || /^\+91\d{10}$/.test(value), "Enter a valid 10-digit mobile number").optional(),
  allowCreate: z.boolean().default(false),
});
