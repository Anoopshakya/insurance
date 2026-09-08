"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { accessToken } from "@/lib/supabase-client";
import { Icon } from "./icons";

type Master = { id: string; name: string; icon?: string | null; category_id?: string };
type Row = {
  id: string;
  name: string | null;
  category_id: string;
  product_type_id: string;
  high_commission_companies: number;
  average_commission_companies: number;
  low_commission_companies: number;
  active: boolean;
  updated_at: string;
  sector: Master;
  type: Master;
};

async function request(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  return fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
}

export function CommissionCategoriesPageV2() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sectors, setSectors] = useState<Master[]>([]);
  const [types, setTypes] = useState<Master[]>([]);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await request("/api/admin/commissions/categories");
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    setRows(body.data || []);
    setSectors(body.sectors || []);
    setTypes(body.types || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableTypes = useMemo(() => types.filter((item) => !sector || item.category_id === sector), [types, sector]);
  const visible = useMemo(() => rows.filter((row) => {
    const searchable = `${row.name || ""} ${row.sector.name} ${row.type.name}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (!sector || row.category_id === sector)
      && (!type || row.product_type_id === type)
      && (!status || String(row.active) === status);
  }), [rows, query, sector, type, status]);

  async function toggle(row: Row) {
    const response = await request(`/api/admin/commissions/categories/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (!response.ok) return setError((await response.json()).error);
    await load();
  }

  return <div className="commission-category-page">
    <header><div><h1>Company Commission Categories</h1><p>Manage company commission categories for different sectors and types.</p></div><Link className="primary-button" href="/admin/commissions/categories/new">＋ Add New Company Commission Category</Link></header>
    {error && <p className="form-error">{error}</p>}
    <section className="commission-filter-card">
      <label className="commission-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by category name, sector or type…" /></label>
      <label><span>Select Sector</span><select value={sector} onChange={(event) => { setSector(event.target.value); setType(""); }}><option value="">All Sectors</option>{sectors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label><span>Select Type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="">All Types</option>{availableTypes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option><option value="true">Active</option><option value="false">Inactive</option></select></label>
      <button className="secondary-button" onClick={() => { setQuery(""); setSector(""); setType(""); setStatus(""); }}>▽ Reset</button>
    </section>
    <section className="commission-table-card"><div className="commission-table-wrap"><table>
      <thead><tr><th>#</th><th>Category Name</th><th>Sector</th><th>Type</th><th>High Commission<br />(Companies)</th><th>Avg. Commission<br />(Companies)</th><th>Low Commission<br />(Companies)</th><th>Last Updated</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{visible.length ? visible.map((row, index) => <tr key={row.id}>
        <td>{index + 1}</td>
        <td><strong>{row.name || `${row.sector.name} - ${row.type.name}`}</strong></td>
        <td><strong>{row.sector.name}</strong></td>
        <td>{row.type.name}</td>
        <td>{row.high_commission_companies}</td><td>{row.average_commission_companies}</td><td>{row.low_commission_companies}</td>
        <td><strong>{new Date(row.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong><small>{new Date(row.updated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></td>
        <td><button className={`commission-status ${row.active ? "active" : "inactive"}`} onClick={() => toggle(row)}>{row.active ? "Active" : "Inactive"}</button></td>
        <td><Link className="commission-edit" aria-label={`Edit ${row.name || "category"}`} href={`/admin/commissions/categories/${row.id}/edit`}>✎</Link></td>
      </tr>) : <tr><td colSpan={10} className="commission-empty">No company commission categories found.</td></tr>}</tbody>
    </table></div><footer>Showing {visible.length ? 1 : 0} to {visible.length} of {visible.length} entries</footer></section>
  </div>;
}
