import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/resources");
import { InformationPage } from "@/components/website/information-page";
import { findInformationPage } from "@/components/website/static-pages";
const page = findInformationPage("resources")!;
export default function Page() { return <InformationPage page={page} />; }
