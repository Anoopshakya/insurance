import {plainProductText} from "@/lib/product-html";
import {cache} from "react";
import {notFound} from "next/navigation";
import {supabaseServer} from "@/lib/supabase-server";
import {siteSeo} from "@/lib/seo";
import {ProductView} from "@/components/catalog/product-view";
import {ProductEnquiry,ProductDocumentLink} from "@/components/catalog/product-enquiry";
import "@/app/catalog.css";
export const dynamic='force-dynamic';
const product=cache(async(slug:string)=>{const {data,error}=await supabaseServer().from('products').select('*,plans(*),insurer:insurers!insurer_id(name),category:categories!category_id(name),product_documents(id,name)').eq('slug',slug).eq('publication_status','published').maybeSingle();if(error)throw Error('Unable to load product');return data;});
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const p=await product((await params).slug);if(!p)return {robots:{index:false}};const title=(p.content.seoTitle||p.name)+' | '+siteSeo.name,description=p.content.seoDescription||plainProductText(p.content.pageHtml??p.content.overview??'').slice(0,160),url=siteSeo.url+'/insurance/'+p.slug;return {title:{absolute:title},description,keywords:p.content.keywords?.split(','),alternates:{canonical:url},openGraph:{title,description,url,siteName:siteSeo.name,images:[siteSeo.image]},twitter:{card:'summary' as const,title,description,images:[siteSeo.image]}};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const p=await product((await params).slug);if(!p)notFound();return <main className="catalog-public"><ProductView product={p}/><section><h2>Product documents</h2>{p.product_documents.map((d:any)=><ProductDocumentLink key={d.id} id={d.id} name={d.name||'Product document'}/>)}</section><aside><ProductEnquiry product={p}/></aside></main>}
