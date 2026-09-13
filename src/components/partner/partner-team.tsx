"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Copy, Download, FileCheck2, Lightbulb, Link2, Mail, MessageCircle, MoreVertical, Phone, Plus, Search, Send, Share2, UserPlus, UserRound, Users, X } from "lucide-react";
import QRCode from "qrcode";
import { accessToken } from "@/lib/supabase-client";
import { PartnerSkeleton } from "./partner-skeleton";

type Member = { depth: number; business: number; commission: number; member: { id: string; agent_code: string; status: string; region: string | null; created_at: string; users: { full_name: string; phone?: string | null } } };
type Team = { code: string; canInvite: boolean; expiresAt: string | null; members: Member[]; total: number; counts: number[]; page: number; pageSize?: number };
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("");
function Dialog({ children, title, close, wide = false }: { children: ReactNode; title: string; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`pt-dialog ${wide ? "pt-dialog-wide" : ""}`} aria-label={title} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}>
    <button className="pt-close" type="button" onClick={close} aria-label="Close dialog"><X /></button>{children}
  </dialog>;
}
const benefits = ["Help more people get the right insurance", "Earn commissions on eligible business", "Grow your business together"];
function Steps() {
  return <ol className="pt-steps">{[{ Icon: Users, title: "Share Your Referral Link", text: "Invite via link or QR code" }, { Icon: FileCheck2, title: "They Register", text: "Complete simple registration" }, { Icon: UserPlus, title: "Grow Together", text: "Help more people get protected" }].map(({ Icon, title, text }) => <li key={title}><Icon /><strong>{title}</strong><p>{text}</p></li>)}</ol>;
}
export function PartnerTeam() {
  const [data, setData] = useState<Team | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [page, setPage] = useState(1), [level, setLevel] = useState("0"), [period, setPeriod] = useState("all"), [sort, setSort] = useState("newest"), [status, setStatus] = useState("all"), [search, setSearch] = useState(""), [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(0), [qr, setQr] = useState(""), [url, setUrl] = useState(""), [modal, setModal] = useState<"invite" | "guide" | null>(null), [tab, setTab] = useState("link"), [selected, setSelected] = useState<Member | null>(null), [exporting, setExporting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("Hi, I'm inviting you to join MagikPolicy as my partner. Let's grow together and help more people get the right insurance.");
  const [inviteCountry, setInviteCountry] = useState("91"), [viaWhatsApp, setViaWhatsApp] = useState(true);
  const [inviteName, setInviteName] = useState(""), [invitePhone, setInvitePhone] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setSearchTerm(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const query = useCallback(() => new URLSearchParams({ page: String(page), level, period, sort, status, search: searchTerm }), [page, level, period, sort, status, searchTerm]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    (async () => {
      const response = await fetch("/api/partner/team?" + query(), { headers: { Authorization: "Bearer " + await accessToken() }, cache: "no-store", signal: controller.signal });
      const body = await response.json(); if (!response.ok) throw Error(body.error);
      if (!controller.signal.aborted) { setData(body); setUrl(location.origin + "/invite/" + body.code); }
    })().catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load your team."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refresh]);
  useEffect(() => {
    let active = true; setQr("");
    if (url) QRCode.toDataURL(url, { width: 600, margin: 4, errorCorrectionLevel: "M" }).then(value => { if (active) setQr(value); }).catch(() => { if (active) setNotice("QR code could not be generated. You can still copy your link."); });
    return () => { active = false; };
  }, [url]);
  async function copy(value: string, label: string) { try { await navigator.clipboard.writeText(value); setNotice(label + " copied."); } catch { setNotice("Select the code or link and copy it manually."); } }
  function download() { const anchor = document.createElement("a"); anchor.href = qr; anchor.download = "magikpolicy-partner-invite.png"; anchor.click(); }
  async function shareQR() {
    try { const blob = await (await fetch(qr)).blob(); const file = new File([blob], "magikpolicy-partner-invite.png", { type: "image/png" }); if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Join my MagikPolicy team", text: url }); else { download(); setNotice("QR code downloaded. Attach it in your preferred app to share."); } }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setNotice("Sharing is unavailable. Please download the QR code."); }
  }
  async function exportTeam() {
    setExporting(true); setNotice("");
    try { const params = query(); params.set("export", "1"); const response = await fetch("/api/partner/team?" + params, { headers: { Authorization: "Bearer " + await accessToken() } }); if (!response.ok) throw Error("Export failed. Please try again."); const objectUrl = URL.createObjectURL(await response.blob()); const anchor = document.createElement("a"); anchor.href = objectUrl; anchor.download = "my-team.csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Export failed."); } finally { setExporting(false); }
  }
  function openInvite() { setNotice(""); setTab("link"); setModal("invite"); }
  function reset() { setSearch(""); setSearchTerm(""); setLevel("0"); setPeriod("all"); setStatus("all"); setSort("newest"); setPage(1); }
  const hasTeam = data?.counts.some(Boolean);
  const pageSize = data?.pageSize || 10, currentPage = data?.page || 1, pages = Math.ceil((data?.total || 0) / pageSize);
  if (loading && !data) return <PartnerSkeleton view="customers" />;
  return <div className="pt-page">
    <header className="pt-heading"><div><h1>My Team</h1><p>Build your network. Help more people find the protection they need.</p></div><div className="pt-actions"><button onClick={() => setModal("guide")}><BookOpen />View Guide</button><button className="pt-primary" onClick={openInvite} disabled={!data || !data.canInvite}><Plus />Invite Partner</button></div></header>
    {error ? <section role="alert" className="pt-card"><p>{error}</p><button onClick={() => setRefresh(value => value + 1)}>Try again</button></section> : data && <>
      {!data.canInvite && <p className="pt-notice" role="status">Invitations are unavailable for this account, or your team has reached the three-level limit. Contact support for help.</p>}
      <section className="pt-stats">{["Direct Partners", "Level 2 Partners", ...(data.counts[2] ? ["Level 3 Partners"] : [])].map((label, index) => <article className="pt-card" key={label}><span className={`pt-stat-icon pt-tone-${index}`}><Users /></span><strong>{data.counts[index] || 0}</strong><h2>{label}</h2><p>{index === 0 ? "People you directly invited" : index === 1 ? "Invited by your team" : "Your extended network"}</p></article>)}</section>
      {!hasTeam ? <section className="pt-empty-hero"><div className="pt-empty-art"><img src="/brand/partner-team-empty.png" width={800} height={800} alt="Partners building a growing professional network together" /></div><div className="pt-empty-copy"><span className="pt-icon"><Users /></span><h2>Your Team is Empty for Now</h2><p>Start building your network by inviting new partners. They will complete registration and the approval process to start their partner journey.</p><button className="pt-primary" onClick={openInvite} disabled={!data.canInvite}><UserPlus />Invite Your First Partner<ArrowRight /></button><Steps /></div></section> :
        <section className="pt-card pt-team-table" aria-busy={loading}>
          <div className="pt-heading"><div><h2>Your Downline Team</h2><p>View and manage your invited partners. Track their business and earnings.</p></div><button disabled={exporting || loading} onClick={() => void exportTeam()}><Download />{exporting ? "Exporting..." : "Export"}</button></div>
          <div className="pt-filters">
            <label>Date Range<select value={period} onChange={event => { setPeriod(event.target.value); setPage(1); }}><option value="all">All time</option><option value="month">Joined this month</option><option value="year">Joined this year</option></select></label>
            <label>Sort by<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="business">Higher Business</option><option value="commission">Higher Commission</option><option value="name">Name A–Z</option></select></label>
            <label>Status<select aria-label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">All</option>{["active", "approved", "draft", "submitted", "under_review", "suspended", "rejected", "deactivated"].map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
            <label>Team level<select value={level} onChange={event => { setLevel(event.target.value); setPage(1); }}><option value="0">All levels</option><option value="1">Direct partners</option><option value="2">Level 2</option><option value="3">Level 3</option></select></label>
            <label className="pt-search"><span className="pt-sr-only">Search by name, code or mobile</span><Search /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, code or mobile..." /></label><button onClick={reset}>Reset</button>
          </div>
          <p className="pt-table-note">Business is issued policy premium. Commission is net of adjustments and clawbacks. Both show all-time totals.</p>
          {loading && <p role="status">Updating team...</p>}
          <div className="pt-table-scroll"><table><thead><tr><th>#</th><th>Agent Name &amp; Code</th><th>Contact No.</th><th>Join Date</th><th>Business (₹)</th><th>Commission Earned (₹)</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.members.map((row, index) => <tr key={row.member.id}><td>{(currentPage - 1) * pageSize + index + 1}</td><td><div className="pt-member"><span className="pt-avatar">{initials(row.member.users?.full_name || "Partner")}</span><div><strong>{row.member.users?.full_name || "Partner"}</strong><small>{row.member.agent_code} · Level {row.depth}</small></div></div></td><td>{row.member.users?.phone || "Not provided"}</td><td>{date(row.member.created_at)}</td><td>{money(row.business)}</td><td>{money(row.commission)}</td><td><span className={`pt-status ${["active", "approved"].includes(row.member.status) ? "pt-status-active" : ["suspended", "rejected", "deactivated"].includes(row.member.status) ? "pt-status-inactive" : ""}`}>{row.member.status.replaceAll("_", " ")}</span></td><td><button className="pt-row-action" aria-label={`View ${row.member.users?.full_name || "partner"} details`} onClick={() => setSelected(row)}><MoreVertical /></button></td></tr>)}</tbody></table></div>
          {!data.members.length && <div className="pt-empty-results"><Users /><h3>No partners match these filters</h3><p>Try another team level, date range or search.</p><button onClick={reset}>Clear filters</button></div>}
          <footer className="pt-pagination"><span>Showing {data.total ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, data.total)} of {data.total} partners</span><nav aria-label="Team pagination"><button aria-label="Previous page" disabled={loading || currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></button>{Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(currentPage - 2, pages - 4)) + index).map(value => <button key={value} aria-current={value === currentPage ? "page" : undefined} disabled={loading} onClick={() => setPage(value)}>{value}</button>)}<button aria-label="Next page" disabled={loading || currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></button></nav></footer>
        </section>}
    </>}
    {!modal && <p role="status" className="pt-notice">{notice}</p>}
    {modal === "guide" && <Dialog title="Team guide" close={() => setModal(null)}><h2>Build your team, one invitation at a time</h2><p>Share your personal invite link or QR code. New partners who register through it join directly under you and complete their profile for approval.</p><Steps /><p>Direct partners are Level 1. Their invited partners are Level 2, followed by Level 3. Existing partners keep their current team; invitations cannot move them to another sponsor.</p><p>Commissions depend on eligible business and your configured commission plan. Track actual amounts in your Earnings page.</p><button className="pt-primary" disabled={!data?.canInvite} onClick={openInvite}><Plus />Invite Partner</button></Dialog>}
    {modal === "invite" && data && <Dialog title="Invite a Partner" wide close={() => setModal(null)}>
      <div className={`pt-invite-grid ${tab === "details" ? "pt-invite-details" : ""}`}><section className="pt-invite-main"><h2>Invite a Partner</h2><p className="pt-invite-intro">{tab === "details" ? "Add partner details and prepare an invitation to join your team." : "Share your invite link or QR code to onboard new partners under your team."}</p>
        <div className="pt-tabs" role="tablist" aria-label="Invitation method" onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault(); const next = event.key === "Home" ? "link" : event.key === "End" ? "details" : tab === "link" ? "details" : "link";
          setTab(next); document.getElementById(next === "link" ? "pt-link-tab" : "pt-details-tab")?.focus();
        }}><button role="tab" tabIndex={tab === "link" ? 0 : -1} id="pt-link-tab" aria-selected={tab === "link"} aria-controls="pt-invite-panel" onClick={() => setTab("link")}><Link2 />Invite Link &amp; QR</button><button role="tab" tabIndex={tab === "details" ? 0 : -1} id="pt-details-tab" aria-selected={tab === "details"} aria-controls="pt-invite-panel" onClick={() => setTab("details")}><UserPlus />Invite via Details</button></div>
        <div role="tabpanel" id="pt-invite-panel" aria-labelledby={tab === "link" ? "pt-link-tab" : "pt-details-tab"}>
          {tab === "link" ? <><label>Your Referral Code<div className="pt-copy-field"><input aria-label="Your Referral Code" readOnly value={data.code} onFocus={event => event.currentTarget.select()} /><button aria-label="Copy referral code" onClick={() => void copy(data.code, "Referral code")}><Copy />Copy</button></div></label><p className="pt-field-help">Share this code with new partners along with your invitation link.</p><label>Your Invitation Link<div className="pt-copy-field"><input aria-label="Your Invitation Link" readOnly value={url} onFocus={event => event.currentTarget.select()} /><button aria-label="Copy invitation link" onClick={() => void copy(url, "Invite link")}><Copy />Copy</button></div></label><p className="pt-field-help">Share this link via WhatsApp, email or any other channel.</p><h3>Quick Share</h3><div className="pt-quick-share"><a href={"https://wa.me/?text=" + encodeURIComponent("Join my MagikPolicy partner team: " + url)} target="_blank" rel="noopener noreferrer"><span className="pt-whatsapp"><MessageCircle /></span>Share on<br />WhatsApp</a><button onClick={() => void copy(url, "Invite link")}><span><Link2 /></span>Copy Link</button></div></> : <form className="pt-details-form" onSubmit={event => {
            event.preventDefault(); setNotice("");
            if (!viaWhatsApp) return;
            if (inviteName.trim().length < 2) { setNotice("Enter the partner's full name."); return; }
            const localPhone = invitePhone.replace(/[\s()-]/g, "");
            if (!/^\d+$/.test(localPhone) || (inviteCountry === "91" ? !/^[6-9]\d{9}$/.test(localPhone) : !/^\d{6,12}$/.test(localPhone)) || (inviteCountry + localPhone).length > 15) { setNotice("Enter a valid mobile number without the country code."); return; }
            const message = `Hi ${inviteName.trim()},\n\n${inviteMessage.trim() || "You're invited to join my MagikPolicy partner team."}\n\nRegister using my invitation link: ${url}`;
            window.open("https://wa.me/" + inviteCountry + localPhone + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
          }}>
            <h3>Partner Details</h3><p className="pt-details-description">Enter basic details to prepare an invitation with your referral link.</p>
            <div className="pt-details-fields">
              <label><span>Full Name <b className="pt-required">*</b></span><div className="pt-input-icon"><UserRound aria-hidden="true" /><input aria-label="Full Name" required minLength={2} value={inviteName} onChange={event => setInviteName(event.target.value)} maxLength={100} placeholder="Enter full name" autoComplete="name" /></div></label>
              <label><span>Mobile Number <b className="pt-required">*</b></span><div className="pt-phone-field"><select aria-label="Country calling code" value={inviteCountry} onChange={event => setInviteCountry(event.target.value)}><option value="91">+91</option><option value="1">+1</option><option value="44">+44</option><option value="61">+61</option><option value="971">+971</option><option value="65">+65</option></select><Phone aria-hidden="true" /><input aria-label="Mobile Number" required type="tel" inputMode="tel" value={invitePhone} onChange={event => setInvitePhone(event.target.value)} maxLength={18} placeholder="Enter mobile number" autoComplete="tel-national" /></div></label>
            </div>
            <label>Personal Message (Optional)<div className="pt-input-icon pt-message-field"><MessageCircle aria-hidden="true" /><textarea aria-label="Personal Message (Optional)" value={inviteMessage} onChange={event => setInviteMessage(event.target.value)} maxLength={1000} rows={4} /></div></label>
            <div className="pt-whatsapp-option"><button type="button" className="pt-toggle" role="switch" aria-checked={viaWhatsApp} aria-label="Send invitation via WhatsApp" onClick={() => setViaWhatsApp(value => !value)}><span /></button><MessageCircle aria-hidden="true" /><div><strong>Send invitation via WhatsApp</strong><p>Review and send the invitation from WhatsApp.</p></div></div>
            {!viaWhatsApp && <p className="pt-channel-hint">Enable WhatsApp to send, or use Invite Link &amp; QR to share another way.</p>}
            <div className="pt-details-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button className="pt-primary" type="submit" disabled={!viaWhatsApp || !data.canInvite}><Send aria-hidden="true" />Send Invitation</button></div>
          </form>}
        </div><p role="status" className="pt-notice">{notice}</p>{data.expiresAt && <p className="pt-field-help">Invitation valid until {date(data.expiresAt)}.</p>}
      </section>{tab === "details" ? <aside className="pt-next-card">
        <div className="pt-invite-art" aria-hidden="true"><span className="pt-art-cloud" /><span className="pt-art-card"><Users /></span><Mail className="pt-art-envelope" /><Send className="pt-art-plane" /><span className="pt-art-trail" /></div>
        <h3>What happens next?</h3><ol>{["Review and send your partner's invitation on WhatsApp.", "They'll complete a simple registration process using your referral link.", "They join your team and complete their profile for approval.", "You can track their activity in your My Team section."].map((text, index) => <li key={text}><span>{index + 1}</span><p>{text}</p></li>)}</ol>
        <div className="pt-invite-tip"><Lightbulb aria-hidden="true" /><div><strong>Tip</strong><p>Add a personal message to make your invitation more engaging.</p></div></div>
      </aside> : <aside className="pt-qr-card"><h3>Your Invite QR Code</h3><p>Let others scan this QR code to join your team.</p>{qr ? <img src={qr} width={260} height={260} alt="Scan to register as a partner in my team" /> : <p>Preparing QR code...</p>}<button className="pt-outline-purple" disabled={!qr} onClick={download}><Download />Download QR Code</button><button className="pt-share-qr" disabled={!qr} onClick={() => void shareQR()}><Share2 />Share QR</button><div className="pt-benefits"><h4>Why Invite Partners?</h4><ul>{benefits.map(text => <li key={text}><Check />{text}</li>)}</ul></div></aside>}</div>
    </Dialog>}
    {selected && <Dialog title="Partner details" close={() => setSelected(null)}><span className="pt-avatar">{initials(selected.member.users?.full_name || "Partner")}</span><h2>{selected.member.users?.full_name || "Partner"}</h2><p>{selected.member.agent_code} · Level {selected.depth}</p><dl className="pt-member-details">{[["Contact", selected.member.users?.phone || "Not provided"], ["Joined", date(selected.member.created_at)], ["Region", selected.member.region || "Not provided"], ["Status", selected.member.status.replaceAll("_", " ")], ["Business", money(selected.business)], ["Commission earned", money(selected.commission)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Dialog>}
  </div>;
}
