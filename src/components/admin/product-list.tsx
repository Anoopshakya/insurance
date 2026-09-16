"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {accessToken} from "@/lib/supabase-client";
import "@/app/catalog.css";
export function ProductList(){
 const [data,setData]=useState<any>({data:[],sectors:[]}),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{const response=await fetch('/api/admin/products',{headers:{Authorization:`Bearer ${await accessToken()}`},cache:'no-store'});const body=await response.json();if(!response.ok)throw Error(body.error||'Unable to load products');if(active)setData(body);}catch(e){if(active)setError(e instanceof Error?e.message:'Unable to load products')}finally{if(active)setLoading(false)}})();return()=>{active=false}},[]);
 const products=data.data.filter((p:any)=>p.name.toLowerCase().includes(query.toLowerCase()));
 return <div className="catalog-admin"><header className="directory-heading"><div><h1>Products</h1><p>Manage all products</p></div><Link className="primary-button" href="/admin/products/new">Add Product</Link></header><input className="mp-control" aria-label="Search products" placeholder="Search products" value={query} onChange={e=>setQuery(e.target.value)}/>{error?<p className="mp-form-error" role="alert">{error}</p>:loading?<p role="status">Loading products...</p>:products.length?<div className="catalog-list">{products.map((p:any)=><article key={p.id}><h2>{p.name}</h2><p>{data.sectors.find((s:any)=>s.id===p.category_id)?.name} ? {p.publication_status||'draft'}</p><Link className="secondary-button" href={'/admin/products/'+p.id+'/edit'}>Edit / Review</Link>{p.publication_status==='published'&&<a href={'/insurance/'+p.slug} target="_blank" rel="noreferrer">View page</a>}</article>)}</div>:<p>{query?'No products match your search.':'No products yet. Add your first product to get started.'}</p>}</div>;
}
