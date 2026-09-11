import { z } from "zod";
import { normalizeQuotePhone } from "./quote-request";
export const contactStates = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
export const contactRequestSchema = z.object({
 name: z.string().trim().min(2, "Please enter your full name.").max(100),
 mobile: z.string().transform(normalizeQuotePhone).refine(value => /^[6-9]\d{9}$/.test(value), "Please enter a valid 10-digit mobile number."),
 email: z.string().trim().email("Please enter a valid email address.").max(254),
 state: z.string().refine(value => !value || contactStates.includes(value), "Please select a valid state."),
 message: z.string().trim().min(10, "Please enter a message of at least 10 characters.").max(4000),
 consent: z.literal(true, { errorMap: () => ({ message: "Please agree to be contacted for your query." }) }),
 website: z.string().max(0).optional(),
});
