"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import QuotationForm from "./quotation-form-content";
export function QuotationModal({productType,close}:{productType:string;close:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const pathname=usePathname();
 useEffect(()=>{
  const element=dialog.current!;
  const trigger=document.activeElement as HTMLElement | null;
  const overflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  element.showModal();
  return ()=>{element.close();document.body.style.overflow=overflow;trigger?.focus();};
 },[]);
 return createPortal(<dialog ref={dialog} className="quotation-modal" aria-label="Request an insurance quotation" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}}}>
  <button className="quotation-modal-close" type="button" aria-label="Close quotation form" onClick={close}><X size={22} aria-hidden="true" /></button>
  <div className="product-quotation-sidebar"><QuotationForm key={productType} pathname={pathname} initialProduct={productType} sectionId="modal-quotation" /></div>
 </dialog>,document.body);
}
