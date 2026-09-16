import {seoMetadata} from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InformationPage } from "@/components/website/information-page";
import { existingInformationPaths, findInformationPage, informationPages } from "@/components/website/static-pages";
export const dynamicParams = false;
export function generateStaticParams() { return informationPages.filter(page => !existingInformationPaths.includes(page.slug)).map(page => ({ page: page.slug })); }
export async function generateMetadata({params}:{params:Promise<{page:string}>}):Promise<Metadata>{return seoMetadata("/"+(await params).page);}
export default async function Page({ params }: { params: Promise<{ page: string }> }) { const page = findInformationPage((await params).page); if (!page) notFound(); return <InformationPage page={page} />; }
