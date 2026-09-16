import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/claims");
import { InformationPage } from "@/components/website/information-page";
import { findInformationPage } from "@/components/website/static-pages";
const page = findInformationPage("claims")!;
export default function Page() { return <InformationPage page={page} />; }
