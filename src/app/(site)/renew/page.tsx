import { InformationPage } from "@/components/website/information-page";
import { findInformationPage } from "@/components/website/static-pages";
const page = findInformationPage("renew")!;
export const metadata = { title: page.title, description: page.intro };
export default function Page() { return <InformationPage page={page} />; }
