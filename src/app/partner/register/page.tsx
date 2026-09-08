import { PartnerAuthSupabase } from "@/components/website/partner-auth-supabase";
import { PartnerMarketing } from "@/components/website/partner-marketing";

export default async function PartnerRegisterPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  return params.account === "1" ? <PartnerAuthSupabase /> : <PartnerMarketing />;
}
