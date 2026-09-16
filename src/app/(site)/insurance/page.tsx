import {plainProductText} from "@/lib/product-html";
import Link from "next/link";
import {supabaseServer} from "@/lib/supabase-server";
import {seoMetadata} from "@/lib/seo";
import "@/app/catalog.css";
export const dynamic='force-dynamic';
export const metadata=seoMetadata('/insurance');
export default async function Page(){const {data,error}=await supabaseServer().from('products').select('id,name,slug,content,insurer:insurers!insurer_id(name)').eq('publication_status','published').order('name');if(error)throw Error('Unable to load insurance products');return <main className="catalog-public"><h1>Insurance products from our providers</h1><div className="catalog-list">{data.map((p:any)=><article key={p.id}><h2>{p.name}</h2><p>{p.insurer?.name}</p><p>{plainProductText(p.content.pageHtml??p.content.overview??'').slice(0,200)}</p><Link href={'/insurance/'+p.slug}>View benefits and request a quote</Link></article>)}</div>{!data.length&&<p>Product information is being prepared. <Link href="/products">Explore our insurance guides</Link> or <Link href="/contact">request assistance</Link>.</p>}</main>}
