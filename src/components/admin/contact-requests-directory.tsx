"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { accessToken } from "@/lib/supabase-client";
import "./contact-requests.css";

type ContactRequest = { id: string; name: string; mobile: string; email: string; state: string; message: string; consent: boolean; status: string; created_at: string };
const submitted = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function ContactDetails({ row, close }: { row: ContactRequest; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="contact-admin-dialog" aria-labelledby="contact-request-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header><div><p className="admin-eyebrow">Contact request</p><h2 id="contact-request-title">{row.name}</h2></div><button className="secondary-button" onClick={close} aria-label="Close contact request">×</button></header>
    <dl><div><dt>Mobile</dt><dd><a href={`tel:${row.mobile}`}>{row.mobile}</a></dd></div><div><dt>Email</dt><dd><a href={`mailto:${row.email}`}>{row.email}</a></dd></div><div><dt>State</dt><dd>{row.state || "Not provided"}</dd></div><div><dt>Submitted (IST)</dt><dd>{submitted(row.created_at)}</dd></div><div><dt>Status</dt><dd>{row.status}</dd></div><div><dt>Consent to contact</dt><dd>{row.consent ? "Yes" : "No"}</dd></div></dl>
    <h3>Message</h3><p className="contact-admin-message">{row.message}</p>
  </dialog>;
}
export function ContactRequestsDirectory() {
  const [rows, setRows] = useState<ContactRequest[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0), [active, setActive] = useState<ContactRequest | null>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    (async () => {
      const response = await fetch("/api/admin/contact-requests", { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: "no-store", signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Unable to load contact requests.");
      if (!controller.signal.aborted) setRows(body.data);
    })().catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load contact requests."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const filtered = useMemo(() => rows.filter(row => (status === "all" || row.status === status) && [row.name, row.mobile, row.email, row.state, row.message].join(" ").toLowerCase().includes(search.trim().toLowerCase())), [rows, search, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20)), currentPage = Math.min(page, pages), visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  return <div className="partner-directory contact-admin"><header className="directory-heading"><div><h1>Contact Requests</h1><p>Messages submitted through the website Contact Us form.</p></div><button className="secondary-button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></header>
    {error ? <section className="directory-card" role="alert"><p className="form-error">{error}</p><button className="secondary-button" onClick={() => setRefresh(value => value + 1)}>Try again</button></section> : <section className="directory-card">
      <div className="directory-toolbar"><strong>{loading ? "Loading requests…" : `${filtered.length} requests`}</strong><div className="contact-admin-filters"><label className="mp-label">Search<input className="mp-control" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Name, mobile, email or message" /></label><label className="mp-label">Status<select className="mp-control" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option>{[...new Set(rows.map(row => row.status))].sort().map(value => <option key={value} value={value}>{value}</option>)}</select></label></div></div>
      <div className="directory-table-wrap"><table className="directory-table"><thead><tr><th>Name</th><th>Contact</th><th>State</th><th>Message</th><th>Submitted (IST)</th><th>Status</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} role="status">Loading contact requests…</td></tr> : !visible.length ? <tr><td colSpan={7}>{rows.length ? "No contact requests match your filters." : "No contact requests have been submitted yet."}</td></tr> : visible.map(row => <tr key={row.id}><td><strong>{row.name}</strong></td><td><a href={`tel:${row.mobile}`}>{row.mobile}</a><a className="contact-admin-email" href={`mailto:${row.email}`}>{row.email}</a></td><td>{row.state || "Not provided"}</td><td><p className="contact-admin-preview">{row.message}</p></td><td>{submitted(row.created_at)}</td><td><span className="status-pill">{row.status}</span></td><td><button className="secondary-button" aria-label={`View message from ${row.name}`} onClick={() => setActive(row)}>View message</button></td></tr>)}</tbody></table></div>
      {!loading && <footer className="contact-admin-pagination"><span>Showing {filtered.length ? (currentPage - 1) * 20 + 1 : 0}–{Math.min(currentPage * 20, filtered.length)} of {filtered.length} requests</span><div><button className="secondary-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button className="secondary-button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></footer>}
    </section>}{active && <ContactDetails row={active} close={() => setActive(null)} />}
  </div>;
}
