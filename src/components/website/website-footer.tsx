import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { footerColumns, legalLinks } from "./footer-navigation";

export function WebsiteFooter() {
  return (
    <>
      <a
        className="whatsapp-float"
        href="https://wa.me/918920028861?text=Hello%20MagikPolicy%2C%20I%20would%20like%20help%20with%20insurance."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MagikPolicy on WhatsApp"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.04 3A12.93 12.93 0 0 0 5.1 22.82L3 29l6.38-2.04A12.98 12.98 0 1 0 16.04 3Zm0 23.6a10.64 10.64 0 0 1-5.43-1.48l-.39-.23-3.79 1.21 1.24-3.69-.25-.4a10.65 10.65 0 1 1 8.62 4.59Zm5.84-7.97c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1.01 1.27-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.6 9.6 0 0 1-1.78-2.22c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.9-.77 2.17-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z"
          />
        </svg>
      </a>
      <footer className="mp-footer">
        <div className="mp-footer-main">
          <div className="mp-footer-brand">
            <Image src="/brand/magikpolicy-logo.png" alt="MagikPolicy" width={420} height={140} />
            <p>MagikPolicy is India&apos;s trusted platform for insurance buying, claim assistance and partner growth. Compare, buy, save and earn more with complete transparency and expert support.</p>
            {/* <ul>
              <li><span><Search /></span>Compare multiple insurers</li>
              <li><span><Tag /></span>Best prices, great savings</li>
              <li><span><ShieldCheck /></span>Quick claim support</li>
              <li><span><Network /></span>Earn more with MagikPolicy</li>
            </ul> */}
             <address className="mp-footer-contact" aria-label="Contact MagikPolicy">
              <a href="mailto:hello@magikpolicy.com"><Mail size={18} aria-hidden="true" /><span>hello@magikpolicy.com</span></a>
              <a href="tel:+918920028861"><Phone size={18} aria-hidden="true" /><span>+91 8920028861</span></a>
            </address>
            <h3>Follow us on</h3>
          <div className="mp-socials">
            <a href="https://www.facebook.com/magikpolicy" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="YouTube">▶</a>
            <a href="#" aria-label="LinkedIn">in</a>
            {/* <a href="#" aria-label="X">𝕏</a> */}
          </div>
          </div>
         
          {footerColumns.map(column => <nav key={column.title} aria-label={column.title}><h3>{column.title}</h3>{column.links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</nav>)}
          {/* <div className="mp-footer-updates"><h3>Stay Updated</h3><p>Subscribe to get tips, offers and insurance insights.</p><form><input aria-label="Email address" type="email" placeholder="Enter your email" /><button aria-label="Subscribe" type="button"><Send /></button></form></div> */}
        </div>
        <div className="mp-footer-bottom"><small>© 2026 MagikPolicy.</small>
          <nav aria-label="Legal">{legalLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        </div>
      </footer>

    </>
  );
}
