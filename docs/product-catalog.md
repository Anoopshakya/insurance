# Product catalog

Apply `supabase/migrations/202609160002_product_catalog.sql` after the existing catalog and partner lead/policy migrations, before deploying this change. It extends existing products, plans and product_documents; it does not replace them. Existing products retain their IDs and policy availability. Unambiguous insurer/type links are backfilled. Other legacy records require admin review.

## Admin workflow

1. Open Admin ? Products ? Add Product / Import PDF.
2. Select an existing category, product type and insurer. Choose the Health or Motor detail template, name and URL slug. Save a draft.
3. Enter category details and optional variants. Removed variants are deactivated, retaining IDs used by historical policies.
4. Upload brochures, policy wording or supporting PDFs (10 MB, maximum 100 pages each). Import retains the original file and page-by-page text. Recognized headings populate empty fields as unverified draft suggestions with source page references. Review all text, especially tables, monetary limits and exclusions. Import does not perform OCR or infer missing information; scanned or encrypted PDFs require a readable/OCR copy or manual entry.
5. Add SEO text, preview, save, confirm source review and publish. Saving later edits returns the product to draft. Published products appear at `/insurance/<slug>` and in the sitemap. Archive removes them from public listing and new policy selections.

New published products and active variants appear in the existing policy forms, constrained by category, type and insurer. No fixed premium is inferred; the public page collects quotation enquiries into the existing admin leads workflow.

Documents are stored privately. Admins with catalog permissions can read draft documents; published product documents can be downloaded through short-lived signed links. PDF imports use local parsing, not an external AI service. Automatic suggestions do not guarantee complete or correctly structured policy data and must be checked against the original documents.

No product PDFs were supplied during implementation. Validate the extraction against the actual Health and Motor brochures before publishing products.

## Whole-page visual and HTML editor

Page content uses one SunEditor React WYSIWYG editor. Format headings, fonts, colours, alignment, lists, links, image URLs and tables. Use HTML source to paste or edit page markup, and Page preview to inspect the sanitized result. Existing section-based content is combined into the editor, preserving headings; saving stores one pageHtml document in the existing content JSON. No migration is needed.

Website import previews extracted content and appends it to this editor by default. Check Replace existing page content to replace the page instead. PDF text can also be appended. Source information is retained. Imports never publish automatically; save, review and publish normally. JavaScript-only or blocked pages may require a PDF or manual entry.

Scripts, forms, embeds, unsafe URLs and unsafe CSS are removed. HTML formatting and safe inline styles are retained; external stylesheets and arbitrary application code are not supported. Images use HTTP/HTTPS URLs, not base64 uploads. The page document limit is 200,000 characters.

## Product routes

The product list is at /admin/products. Add Product opens /admin/products/new, and Edit / Review opens /admin/products/[id]/edit. The first successful save moves a new product to its edit URL. The editor retains the existing content, documents, SEO and publication workflow.

