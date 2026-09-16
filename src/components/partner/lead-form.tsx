"use client";
import {useEffect,useState,type FormEvent} from "react";
import {accessToken} from "@/lib/supabase-client";
import "@/app/partner/partner-leads.css";
export function LeadForm({lead,customer,close,saved}:{lead?:any;customer?:any;close:()=>void;saved:()=>void}){
const [sectors,setSectors]=useState<any[]>([]),[productTypes,setProductTypes]=useState<any[]>([]),[selectedSector,setSelectedSector]=useState(lead?.product_sector_id||""),[saving,setSaving]=useState(false),[error,setError]=useState("");
useEffect(()=>{(async()=>{const r=await fetch("/api/partner/leads",{headers:{Authorization:`Bearer ${await accessToken()}`}});const b=await r.json();if(!r.ok)throw Error(b.error);setSectors(b.sectors||[]);setProductTypes(b.productTypes||[])})().catch(e=>setError(e.message))},[]);
async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError("");const values=Object.fromEntries(new FormData(e.currentTarget));try{const r=await fetch("/api/partner/leads",{method:lead?"PUT":"POST",headers:{Authorization:`Bearer ${await accessToken()}`,"Content-Type":"application/json"},body:JSON.stringify({...values,id:lead?.id,customerId:customer?.id||lead?.customer_id})});const b=await r.json();if(!r.ok)throw Error(b.error);saved()}catch(e){setError(e instanceof Error?e.message:"Unable to save lead")}finally{setSaving(false)}}
return <div role="dialog" aria-modal="true" aria-label={lead?"Edit Lead":"Add Lead"}>      {true && (
        <div className="pl-modal" onMouseDown={() => {if(!saving)close()}}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button className="pl-modal-close" disabled={saving} onClick={() => close()}>
              ×
            </button>
            <h2>{lead ? "Edit Lead" : "Add Lead"}</h2>
            <p>Add a customer enquiry to your pipeline.</p>
            {error&&<p role="alert">{error}</p>}<form onSubmit={create}>
              <label className="mp-label">
                Customer name
                <input className="mp-control" name="name" defaultValue={lead?.name||customer?.name||""} minLength={2} required />
              </label>
              <label className="mp-label">
                Mobile number
                <span className="mp-input-group mp-phone-group"><span className="mp-country" aria-hidden="true">+91</span><input className="mp-control" name="contact" defaultValue={lead?.contact||customer?.contact||""} inputMode="numeric" required  maxLength={10} minLength={10} pattern="[0-9]{10}" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} /></span>
              </label>
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
              <div>
                <button type="button" disabled={saving} onClick={() => close()}>
                  Cancel
                </button>
                <button disabled={saving}>
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
</div>;
}
