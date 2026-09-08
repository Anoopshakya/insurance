import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InformationPage } from "@/components/website/information-page";
import { articles } from "@/components/website/website-articles";
export const dynamicParams = false;
export function generateStaticParams() { return articles.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const article = articles.find(item => item.slug === slug); return article ? { title: article.title, description: article.intro } : {}; }
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const article = articles.find(item => item.slug === slug); if (!article) notFound(); return <InformationPage page={article} article />; }
