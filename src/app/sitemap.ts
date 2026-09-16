import {seoSitemap,siteSeo} from "@/lib/seo";
import {supabaseServer} from "@/lib/supabase-server";
export const dynamic='force-dynamic';
export default async function sitemap(){const {data,error}=await supabaseServer().from('products').select('slug,updated_at').eq('publication_status','published');if(error)throw Error('Unable to load published product sitemap');return [...seoSitemap(),...(data||[]).map(p=>({url:siteSeo.url+'/insurance/'+p.slug,lastModified:p.updated_at}))];}
