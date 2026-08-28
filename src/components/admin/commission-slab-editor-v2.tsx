"use client";

import Link from "next/link";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";

type Sector = { id: string; name: string };
type CommissionCategory = { id: string; name: string; category_id: string; sector: Sector; type: Sector };
type SlabRange = { max: number | null; high: number; average: number; low: number };
type BusinessType = "fresh" | "port" | "renew";

const defaults: SlabRange[] = [
  { max: 200000, high: 25, average: 20, low: 15 },
  { max: 500000, high: 30, average: 25, low: 20 },
  { max: 1000000, high: 40, average: 30, low: 25 },
];

async function api(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
}

const money = (value: number | null) => (value || 0).toLocaleString("en-IN");

export function CommissionSlabEditorV2({ slabId }: { slabId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState<BusinessType>("fresh");
  const [sector, setSector] = useState("");
  const [commissionCategory, setCommissionCategory] = useState("");
  const [commissionCategories, setCommissionCategories] = useState<CommissionCategory[]>([]);
  const [ranges, setRanges] = useState<SlabRange[]>(defaults);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBusiness, setDraftBusiness] = useState<BusinessType>("fresh");
  const [draftSector, setDraftSector] = useState("");
  const [draftCommissionCategory, setDraftCommissionCategory] = useState("");
  const [draftRanges, setDraftRanges] = useState<SlabRange[]>(defaults);

  useEffect(() => {
    api(`/api/admin/commissions/slabs/configure${slabId ? `?id=${slabId}` : ""}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) return setError(body.error);
      setCommissionCategories(body.commissionCategories || []);
      if (body.record) {
        setName(body.record.name);
        setBusiness(body.record.business_type);
        setSector(body.record.category_id);
        setCommissionCategory(body.record.commission_category_id || "");
        setRanges(body.record.slab_ranges);
      }
    });
  }, [slabId]);

  function changeRange(setter: Dispatch<SetStateAction<SlabRange[]>>, index: number, key: keyof SlabRange, value: number | null) {
    setter((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function showModal() {
    setDraftName(name);
    setDraftBusiness(business);
    setDraftSector(sector);
    setDraftCommissionCategory(commissionCategory);
    setDraftRanges(ranges.map((range) => ({ ...range })));
    setError("");
    setModalOpen(true);
  }

  async function save(values = { name, business, sector, commissionCategory, ranges }) {
    if (!values.name.trim() || !values.commissionCategory) return setError("Slab name and commission category are required");
    setSaving(true);
    const response = await api("/api/admin/commissions/slabs/configure", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: slabId, name: values.name, businessType: values.business, commissionCategoryId: values.commissionCategory, ranges: values.ranges, active: true }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setError(body.error);
    setModalOpen(false);
    router.push("/admin/commissions/slabs");
    router.refresh();
  }

  return <div className="slab-editor">
    <header><div><h1>{slabId ? "Modify Commission Slab" : "Commission Slab"}</h1><p>Define partner commission slabs based on company commission category and monthly business.</p></div><Link className="secondary-button" href="/admin/commissions/slabs">← Back to Slab List</Link></header>
    {error && !modalOpen && <p className="form-error">{error}</p>}
    <section className="slab-basics">
      <label>Slab Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Fresh Motor Slab" /></label>
      <label>Business Type<select value={business} onChange={(event) => setBusiness(event.target.value as BusinessType)}><option value="fresh">Fresh</option><option value="port">Port</option><option value="renew">Renew</option></select><small>Define commission slabs for {business} business.</small></label>
      <label>Commission Category *<select value={commissionCategory} onChange={(event) => { const id = event.target.value; setCommissionCategory(id); setSector(commissionCategories.find((item) => item.id === id)?.category_id || ""); }}><option value="">Select commission category</option>{commissionCategories.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.sector.name} / {item.type.name}</option>)}</select></label>
    </section>
    <section className="slab-matrix">
      <header><strong>Commission Categories</strong>{ranges.map((range, index) => <div key={index}><span>{index === 0 ? `Up to ₹${money(range.max)}` : `₹${money((ranges[index - 1].max || 0) + 1)} - ₹${money(range.max)}`}</span></div>)}<button type="button" className="secondary-button" onClick={showModal}>＋ Add Slab</button></header>
      {([['high', 'High Commission', '↗'], ['average', 'Avg. Commission', '▥'], ['low', 'Low Commission', '↘']] as const).map(([key, label, icon]) => <div className={`slab-matrix-row ${key}`} key={key}><div><b>{icon}</b><strong>{label}</strong></div>{ranges.map((range, index) => <label key={index}><input type="number" min="0" max="100" value={range[key]} onChange={(event) => changeRange(setRanges, index, key, Number(event.target.value))} /><span>%</span></label>)}</div>)}
    </section>
    <div className="slab-note"><strong>ⓘ Note</strong><span>• Percentage values should be between 0 and 100.<br />• Slabs apply to the partner&apos;s monthly business after GST deduction.<br />• Company categories come from Company Commission Categories.</span></div>
    <footer><Link className="secondary-button" href="/admin/commissions/slabs">Cancel</Link><button className="primary-button" disabled={saving} onClick={() => save()}>{saving ? "Saving…" : "▣ Save Slab"}</button></footer>

    {modalOpen && <div className="slab-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
      <section className="slab-modal" role="dialog" aria-modal="true" aria-labelledby="slab-modal-title">
        <header><div><h2 id="slab-modal-title">{slabId ? "Update Commission Slab" : "Add New Commission Slab"}</h2><p>Define partner commission slab based on business type, sector and monthly business ranges.</p></div><button type="button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></header>
        <h3>1. Slab Details</h3>
        <div className="slab-modal-details">
          <label>Business Type *<select value={draftBusiness} onChange={(event) => setDraftBusiness(event.target.value as BusinessType)}><option value="fresh">Fresh</option><option value="port">Port</option><option value="renew">Renew</option></select></label>
          <label>Commission Category *<select value={draftCommissionCategory} onChange={(event) => { const id = event.target.value; setDraftCommissionCategory(id); setDraftSector(commissionCategories.find((item) => item.id === id)?.category_id || ""); }}><option value="">Select commission category</option>{commissionCategories.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.sector.name} / {item.type.name}</option>)}</select></label>
          <label>Slab Name *<input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Fresh Motor Slab" /></label>
        </div>
        <div className="slab-modal-section-title"><h3>2. Monthly Business Slabs</h3><p>Define monthly business ranges and commission % for each company commission category.</p></div>
        <div className="slab-range-table">
          <div className="slab-range-head"><span>#</span><span>Business Range (Monthly)</span><span>High Commission (%)</span><span>Avg. Commission (%)</span><span>Low Commission (%)</span><span>Action</span></div>
          {draftRanges.map((range, index) => <div className="slab-range-row" key={index}>
            <strong>{index + 1}</strong>
            <div className="range-pair"><span>From</span><input value={index === 0 ? 0 : (draftRanges[index - 1].max || 0) + 1} readOnly /><span>To</span><input type="number" min="1" value={range.max ?? ""} onChange={(event) => changeRange(setDraftRanges, index, "max", event.target.value ? Number(event.target.value) : null)} /></div>
            {(['high', 'average', 'low'] as const).map((key) => <label className="percent-input" key={key}><input type="number" min="0" max="100" value={range[key]} onChange={(event) => changeRange(setDraftRanges, index, key, Number(event.target.value))} /><span>%</span></label>)}
            <button type="button" className="range-delete" aria-label={`Delete range ${index + 1}`} disabled={draftRanges.length === 1} onClick={() => setDraftRanges((items) => items.filter((_, itemIndex) => itemIndex !== index))}>⌫</button>
          </div>)}
        </div>
        <button type="button" className="secondary-button slab-add-range" onClick={() => setDraftRanges((items) => [...items, { max: (items.at(-1)?.max || 0) + 500000, high: 0, average: 0, low: 0 }])}>＋ Add Range</button>
        <div className="slab-guidelines"><strong>ⓘ &nbsp; Guidelines</strong><span>• Percentage values should be between 0 and 100.<br />• Ranges should be continuous and non-overlapping.<br />• Commission will be calculated on partner&apos;s monthly business (after GST deduction).</span></div>
        {error && <p className="form-error">{error}</p>}
        <footer><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="button" className="primary-button" disabled={saving} onClick={() => save({ name: draftName, business: draftBusiness, sector: draftSector, commissionCategory: draftCommissionCategory, ranges: draftRanges })}>{saving ? "Saving…" : "▣ Save/Update"}</button></footer>
      </section>
    </div>}
  </div>;
}
