"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";

type Item = { id: string; name: string; icon?: string | null; logo_url?: string | null; category_id?: string };
type Tier = "high" | "average" | "low";
const tierInfo = {
  high: ["High Commission", "Companies offering us high commission or better margins.", "↗"],
  average: ["Avg. Commission", "Companies with average commission or standard margins.", "▥"],
  low: ["Low Commission", "Companies with lower commission or reduced margins.", "↘"],
} as const;

async function api(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
}

export function CommissionCategoryEditorV2({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sectors, setSectors] = useState<Item[]>([]);
  const [types, setTypes] = useState<Item[]>([]);
  const [companies, setCompanies] = useState<Item[]>([]);
  const [sector, setSector] = useState("");
  const [type, setType] = useState("");
  const [mapping, setMapping] = useState<Record<Tier, string[]>>({ high: [], average: [], low: [] });
  const [picker, setPicker] = useState<Tier | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    api(`/api/admin/commissions/categories/mapping${categoryId ? `?id=${categoryId}` : ""}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) return setError(body.error);
      setSectors(body.sectors || []);
      setTypes(body.types || []);
      setCompanies(body.companies || []);
      if (categoryId && !body.record) return setError("Commission category not found");
      if (body.record) {
        setName(body.record.name || "");
        setSector(body.record.category_id);
        setType(body.record.product_type_id);
        const forTier = (tier: Tier) => body.mappings.filter((item: { commission_tier: string }) => item.commission_tier === tier).map((item: { insurer_id: string }) => item.insurer_id);
        setMapping({ high: forTier("high"), average: forTier("average"), low: forTier("low") });
      }
    });
  }, [categoryId]);

  const availableTypes = useMemo(() => types.filter((item) => item.category_id === sector), [types, sector]);
  const assigned = new Set([...mapping.high, ...mapping.average, ...mapping.low]);

  async function save() {
    if (!name.trim()) return setError("Enter a commission category name");
    if (!sector || !type) return setError("Select a sector and product type");
    if (!assigned.size) return setError("Add at least one company");
    setSaving(true);
    const response = await api("/api/admin/commissions/categories/mapping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, categoryId: sector, productTypeId: type, ...mapping }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setError(body.error);
    router.push("/admin/commissions/categories");
    router.refresh();
  }

  return <div className="commission-editor">
    <header><div><h1>Company Commission Category</h1><p>Define commission category (High, Average, Low) for companies based on the commission<br />we receive from them for a specific sector and type.</p></div><button className="secondary-button" onClick={() => setHelp(!help)}>ⓘ How it works?</button></header>
    {help && <div className="commission-help">Give the category a recognisable name, select its sector and type, assign every provider to one tier, then save.</div>}
    {error && <p className="form-error">{error}</p>}
    <section className="commission-selector named">
      <label>Category Name *<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Motor Private Car Standard" /></label>
      <label>Select Sector *<select value={sector} onChange={(event) => { setSector(event.target.value); setType(""); }}><option value="">Select sector</option>{sectors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Select Type *<select value={type} disabled={!sector} onChange={(event) => setType(event.target.value)}><option value="">Select type</option>{availableTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="secondary-button" onClick={() => { setName(""); setSector(""); setType(""); setMapping({ high: [], average: [], low: [] }); }}>↻ Reset</button>
    </section>
    <section className="commission-tier-grid">{(Object.keys(tierInfo) as Tier[]).map((tier) => {
      const items = mapping[tier].map((id) => companies.find((company) => company.id === id)).filter(Boolean) as Item[];
      return <article className={`commission-tier ${tier}`} key={tier}><header><b>{tierInfo[tier][2]}</b><div><h2>{tierInfo[tier][0]}</h2><span>{items.length} Companies</span></div></header><p>{tierInfo[tier][1]}</p><div className="tier-company-list">{items.map((item, index) => <div key={item.id}><i>{index + 1}.</i>{item.logo_url ? <img src={item.logo_url} alt="" /> : <b>{item.name.slice(0, 2)}</b>}<strong>{item.name}</strong><button onClick={() => setMapping((current) => ({ ...current, [tier]: current[tier].filter((id) => id !== item.id) }))}>×</button></div>)}{!items.length && <small>No companies added yet.</small>}</div><button className="tier-add" disabled={!type} onClick={() => setPicker(tier)}>＋ Add Company</button></article>;
    })}</section>
    <div className="commission-info">ⓘ These categories will be selectable while creating dedicated partner commission slabs.</div>
    <footer><Link className="secondary-button" href="/admin/commissions/categories">Back to List</Link><button className="primary-button" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Category Mapping"}</button></footer>
    {picker && <div className="company-picker" onMouseDown={() => setPicker(null)}><section onMouseDown={(event) => event.stopPropagation()}><header><h2>Add Company to {tierInfo[picker][0]}</h2><button onClick={() => setPicker(null)}>×</button></header><div>{companies.filter((company) => !assigned.has(company.id)).map((company) => <button key={company.id} onClick={() => { setMapping((current) => ({ ...current, [picker]: [...current[picker], company.id] })); setPicker(null); }}>{company.logo_url ? <img src={company.logo_url} alt="" /> : <b>{company.name.slice(0, 2)}</b>}<span>{company.name}</span><em>＋</em></button>)}</div></section></div>}
  </div>;
}
