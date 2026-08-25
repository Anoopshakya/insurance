import { PartnerForm } from "@/components/admin/partner-form";
export default async function EditPartnerPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <PartnerForm partnerId={id}/>}
