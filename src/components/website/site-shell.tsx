import type { ReactNode } from "react";
export { products } from "./website-products";
export function PublicPage({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <div className="public-site">
      <main className="public-inner">
        <section className="public-page-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{copy}</p>
        </section>
        {children}
      </main>
    </div>
  );
}
