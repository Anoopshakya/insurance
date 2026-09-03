import Image from "next/image";
import Link from "next/link";
import { products } from "./website-products";

export function WebsiteFooter() {
  return (
    <>
      <a
        className="whatsapp-float"
        href="https://wa.me/919891824725?text=Hello%20MagikPolicy%2C%20I%20would%20like%20help%20with%20insurance."
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
      <footer className="site-footer">
        <div>
          <Image
            src="/brand/magikpolicy-logo-dark.png"
            alt="MagikPolicy"
            width={420}
            height={140}
          />
          <p>Making insurance simple, accessible and magical for everyone.</p>
        </div>
        <div>
          <h3>Products</h3>
          {products.map((p) => (
            <Link key={p.slug} href={`/products/${p.slug}`}>
              {p.name}
            </Link>
          ))}
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/about">About Us</Link>
          <Link href="/partner/register">Our Partners</Link>
          <Link href="/contact">Careers</Link>
          <Link href="/resources">Blog</Link>
        </div>
        <div>
          <h3>Resources</h3>
          <Link href="/resources">Help Center</Link>
          <Link href="/resources">FAQs</Link>
          <Link href="/claims">Claims</Link>
          <Link href="/renew">Renew Policy</Link>
        </div>
        <div>
          <h3>Contact Us</h3>
          <p>Mumbai, Maharashtra</p>
          <a href="tel:+919876543210">+91 98765 43210</a>
          <a href="mailto:support@magikpolicy.com">support@magikpolicy.com</a>
        </div>
        <small>© 2026 MagikPolicy. All rights reserved.</small>
      </footer>
    </>
  );
}
