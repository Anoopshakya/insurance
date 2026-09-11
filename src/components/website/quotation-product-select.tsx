"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { products } from "./website-products";
import { productIcon } from "./product-icons";
export function QuotationProductSelect({id,value,onChange,disabled}:{id:string;value:string;onChange:(value:string)=>void;disabled:boolean}) {
 const [open,setOpen]=useState(false);const [active,setActive]=useState(0);
 const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
 const selected=products.find(product=>product.type===value);const Icon=productIcon(value);
 function show(){setActive(Math.max(0,products.findIndex(product=>product.type===value)));setOpen(true);}
 function choose(index:number){onChange(products[index].type);setOpen(false);trigger.current?.focus();}
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 useEffect(()=>{if(open)document.getElementById(id+'-option-'+active)?.scrollIntoView({block:'nearest'});},[open,active,id]);
 return <div ref={root} className="quotation-product-select" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}>
 <span id={id+'-label'} className="quotation-product-label">Product</span>
 <button ref={trigger} id={id} type="button" role="combobox" data-value={value} aria-label="Select product" aria-haspopup="listbox" aria-expanded={open} aria-controls={id+'-options'} aria-activedescendant={open?id+'-option-'+active:undefined} disabled={disabled} onClick={()=>open?setOpen(false):show()} onKeyDown={event=>{
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(!open){show();return;}setActive(index=>event.key==='Home'?0:event.key==='End'?products.length-1:(index+(event.key==='ArrowDown'?1:-1)+products.length)%products.length);}
  else if((event.key==='Enter'||event.key===' ')&&open){event.preventDefault();choose(active);}
  else if(event.key.length===1&&event.key!==' '){const match=products.findIndex(p=>p.name.toLowerCase().startsWith(event.key.toLowerCase()));if(match>=0){setActive(match);setOpen(true);}}
 }}><Icon size={22} aria-hidden="true" data-product-icon={value}/><span>{selected?.name || 'Choose an insurance product'}</span><ChevronDown size={17} aria-hidden="true" /></button>
 <input type="hidden" name="productType" value={value}/>
 {open&&<ul id={id+'-options'} role="listbox" aria-labelledby={id+'-label'}>{products.map((product,index)=>{const OptionIcon=productIcon(product.type);return <li key={product.type} id={id+'-option-'+index} role="option" data-value={product.type} aria-selected={value===product.type} className={active===index?'is-active':''} onPointerMove={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(index)}><OptionIcon size={21} aria-hidden="true" data-product-icon={product.type}/><span>{product.name}</span>{value===product.type&&<Check size={17} aria-hidden="true"/>}</li>;})}</ul>}
 </div>;
}
