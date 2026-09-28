"use client";
import {createPortal} from "react-dom";
import {LeadCustomerFields} from "@/components/lead-customer-fields";
import {useEffect,useState,useRef,type FormEvent} from "react";
import {accessToken} from "@/lib/supabase-client";
import "@/app/partner/partner-leads.css";
export function LeadForm({lead,customer,close,saved}:{lead?:any;customer?:any;close:()=>void;saved:()=>void}){
const dialog=useRef<HTMLDialogElement>(null);
useEffect(()=>{const element=dialog.current;element?.showModal();const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{element?.close();document.body.style.overflow=previous}},[]);
const feedback=useRef<HTMLParagraphElement>(null);
const [sectors,setSectors]=useState<any[]>([]),[productTypes,setProductTypes]=useState<any[]>([]),[selectedSector,setSelectedSector]=useState(lead?.product_sector_id||""),[saving,setSaving]=useState(false),[error,setError]=useState("");
useEffect(()=>{if(error){feedback.current?.focus();feedback.current?.scrollIntoView({block:"nearest"})}},[error]);
useEffect(()=>{(async()=>{const r=await fetch("/api/partner/leads",{headers:{Authorization:`Bearer ${await accessToken()}`}});const b=await r.json();if(!r.ok)throw Error(b.error);setSectors(b.sectors||[]);setProductTypes(b.productTypes||[])})().catch(e=>setError(e.message))},[]);
async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();if(saving)return;setError("");const values=Object.fromEntries(new FormData(e.currentTarget));
const problems:string[]=[];
if(String(values.name||'').trim().length<2)problems.push('Enter a customer name with at least 2 characters.');
if(!/^[0-9]{10}$/.test(String(values.contact||'')))problems.push('Enter a 10-digit mobile number.');
if(!values.productSectorId)problems.push('Select a product sector.');
if(!values.productTypeId)problems.push('Select a product type.');
if(!values.purchaseTimeline)problems.push('Select when the customer is planning to buy.');
if(problems.length){setError(problems.join(' '));return;}
setSaving(true);try{const r=await fetch("/api/partner/leads",{method:lead?"PUT":"POST",headers:{Authorization:`Bearer ${await accessToken()}`,"Content-Type":"application/json"},body:JSON.stringify({...values,id:lead?.id,customerId:values.customerId||undefined})});const b=await r.json().catch(()=>null);if(!r.ok)throw Error(b?.error||(r.status===401||r.status===403?'Your session or partner access does not allow saving. Sign in again or contact support.':'Unable to save lead. Please try again.'));if(!b?.data?.id)throw Error('The server did not confirm the saved lead. Please refresh your leads before retrying.');saved()}catch(e){setError(e instanceof Error?e.message:"Unable to save lead")}finally{setSaving(false)}}
return createPortal(<dialog ref={dialog} className="pl-modal pl-lead-dialog" aria-label={lead?"Edit Lead":"Add Lead"} onCancel={e=>{e.preventDefault();if(!saving)close()}}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Close lead form" className="pl-modal-close" disabled={saving} onClick={() => close()}>
              ×
            </button>
            <h2>{lead ? "Edit Lead" : "Add Lead"}</h2>
            <p>Add a customer enquiry to your pipeline.</p>
            <form onSubmit={create} noValidate>
              <LeadCustomerFields scope="partner" initial={{id:customer?.id||lead?.customer_id,name:lead?.name||customer?.name,contact:lead?.contact||customer?.contact}} locked={!!customer}/>
              <label className="mp-label">
                Priority
                <select className="mp-control" name="priority" defaultValue={lead?.priority||"medium"}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="mp-label">
                Product sector
                <select className="mp-control"
                  name="productSectorId"
                  value={selectedSector}
                  onChange={(event) => setSelectedSector(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select product sector
                  </option>
                  {sectors.map((sector) => (
                    <option value={sector.id} key={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mp-label">
                Product type
                <select className="mp-control"
                  name="productTypeId"
                  key={selectedSector}
                  defaultValue={lead?.product_type_id||""}
                  required
                  disabled={!selectedSector}
                >
                  <option value="" disabled>
                    Select product type
                  </option>
                  {productTypes
                    .filter((type) => type.category_id === selectedSector)
                    .map((type) => (
                      <option value={type.id} key={type.id}>
                        {type.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="mp-label">
                When are they planning to buy?
                <select className="mp-control" name="purchaseTimeline" defaultValue={lead?.purchase_timeline||""} required>
                  <option value="" disabled>
                    Select purchase timeline
                  </option>
                  <option value="immediately">Immediately</option>
                  <option value="within_7_days">Within 7 days</option>
                  <option value="within_30_days">Within 30 days</option>
                  <option value="within_3_months">Within 3 months</option>
                  <option value="researching">Just researching</option>
                </select>
              </label>
              {error&&<p ref={feedback} role="alert" tabIndex={-1} className="mp-form-error">{error}</p>}
              <div className="pl-lead-actions">
                <button type="button" disabled={saving} onClick={() => close()}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </section>
</dialog>,document.body);
}
