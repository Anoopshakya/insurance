import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/renew");
import { InformationPage } from "@/components/website/information-page";
import { findInformationPage } from "@/components/website/static-pages";
const page = findInformationPage("renew")!;
export default function Page() { return <InformationPage page={page} />; }
