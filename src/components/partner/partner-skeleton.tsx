export type PartnerSkeletonView = "dashboard" | "leads" | "customers" | "policies" | "earnings" | "form";
function Block({ className = "" }: { className?: string }) { return <div className={"partner-skeleton-block " + className} />; }
export function PartnerSkeleton({ view = "dashboard", fullPage = false }: { view?: PartnerSkeletonView; fullPage?: boolean }) {
  const form = view === "form";
  return <div className={"partner-skeleton " + (fullPage ? "partner-skeleton-full " : "") + (form ? "partner-skeleton-form" : "")} role="status" aria-label="Loading partner workspace" aria-busy="true">
    <span className="partner-skeleton-label">Loading partner workspace...</span>
    <div className="partner-skeleton-layout" aria-hidden="true">
      {fullPage && !form && <aside className="partner-skeleton-sidebar"><Block className="logo" />{Array.from({length:8},(_,i)=><Block key={i} className="nav" />)}</aside>}
      <div className="partner-skeleton-content">
        {fullPage && !form && <div className="partner-skeleton-top"><Block className="heading" /><Block className="avatar" /></div>}
        <Block className="heading" /><Block className="subtitle" />
        {form ? <div className="partner-skeleton-panel partner-skeleton-fields">{Array.from({length:6},(_,i)=><div key={i}><Block className="label" /><Block className="input" /></div>)}<Block className="input" /></div> : <>
          <div className="partner-skeleton-cards">{Array.from({length:view === "customers" ? 6 : 4},(_,i)=><div className="partner-skeleton-panel" key={i}><Block className="avatar" /><Block className="label" /><Block className="heading" /></div>)}</div>
          {(view === "dashboard" || view === "earnings") && <div className="partner-skeleton-charts"><div className="partner-skeleton-panel"><Block className="label" /><div className="partner-skeleton-bars">{[45,65,50,85,70,95].map((height,i)=><div key={i} className="partner-skeleton-block" style={{height:height+"%"}} />)}</div></div><div className="partner-skeleton-panel"><Block className="label" /><Block className="donut" /></div></div>}
          <div className="partner-skeleton-panel"><div className="partner-skeleton-toolbar"><Block className="input" /><Block className="input" /></div>{Array.from({length:5},(_,i)=><div key={i} className="partner-skeleton-row">{Array.from({length:5},(_,j)=><Block key={j} className="cell" />)}</div>)}</div>
        </>}
      </div>
    </div>
  </div>;
}
export function partnerSkeletonView(pathname: string): PartnerSkeletonView {
  if (/login|register|profile|change-password/.test(pathname)) return "form";
  for (const view of ["leads", "customers", "policies", "earnings"] as const) if (pathname.includes("/" + view)) return view;
  return "dashboard";
}
