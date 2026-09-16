import {seoMetadata} from "@/lib/seo";
export const metadata=seoMetadata("/");
import { HomeReference } from "@/components/website/home-reference";

export default function HomePage() {
  return <HomeReference />;
}
