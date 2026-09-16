import {ProductManager} from "@/components/admin/product-manager";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProductManager key={id} productId={id}/>;}
