"use client";
import { usePathname } from "next/navigation";
import { hasQuotationForm } from "./website-products";
import QuotationForm from "./quotation-form-content";
export { default as QuotationForm } from "./quotation-form-content";

export function WebsiteQuotation() {
  const pathname = usePathname();
  if (!hasQuotationForm(pathname)) return null;
  return <QuotationForm key={pathname} pathname={pathname} />;
}
