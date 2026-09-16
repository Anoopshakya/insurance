import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/about");
import { InformationPage } from "@/components/website/information-page";
import { findInformationPage } from "@/components/website/static-pages";
const page = findInformationPage("about")!;
export default function Page() { return <InformationPage page={page} />; }
