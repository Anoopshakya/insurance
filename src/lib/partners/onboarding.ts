import { z } from "zod";

const fields = z.object({
  addressLine1: z.string().trim().min(2).max(250),
  addressLine2: z.string().trim().max(250).optional(),
  dateOfBirth: z.string().date(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  fatherOrSpouseName: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(100),
  panNumber: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN"),
  aadhaarNumber: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => /^\d{12}$/.test(value), "Enter a valid 12-digit Aadhaar number"),
  city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid PIN code"),
  accountHolder: z.string().trim().min(2).max(100), bankName: z.string().trim().min(2).max(100),
  branchName: z.string().trim().min(2).max(100), accountType: z.enum(["savings", "current"]),
  accountNumber: z.string().trim().regex(/^\d{6,20}$/, "Enter a valid bank account number"),
  confirmAccountNumber: z.string().trim(), ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
});

export const personalSchema = fields.pick({ dateOfBirth: true, gender: true, fatherOrSpouseName: true, occupation: true, addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true }).refine(value => {
  const adultDate = new Date(); adultDate.setUTCFullYear(adultDate.getUTCFullYear() - 18);
  return new Date(`${value.dateOfBirth}T00:00:00Z`) <= adultDate;
}, { path: ["dateOfBirth"], message: "Partner must be at least 18 years old" });
export const identitySchema = fields.pick({ panNumber: true, aadhaarNumber: true });
export const bankSchema = fields.pick({ accountHolder: true, bankName: true, branchName: true, accountType: true, accountNumber: true, confirmAccountNumber: true, ifsc: true }).refine(value => value.accountNumber === value.confirmAccountNumber, { path: ["confirmAccountNumber"], message: "Account numbers do not match" });
export const personalColumns = { dateOfBirth: "date_of_birth", gender: "gender", fatherOrSpouseName: "father_or_spouse_name", occupation: "occupation", addressLine1: "address_line1", addressLine2: "address_line2", city: "city", state: "state", postalCode: "postal_code" } as const;
export const bankColumns = { accountHolder: "account_holder", bankName: "bank_name", branchName: "branch_name", accountType: "account_type", accountNumber: "account_number", ifsc: "ifsc" } as const;
export function formValues(row: Record<string, unknown> | null, columns: Record<string, string>) {
  return Object.fromEntries(Object.entries(columns).map(([field, column]) => [field, row?.[column] ?? ""]));
}
