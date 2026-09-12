# Light/dark and mobile appearance audit

Shared dark palette lives in src/app/appearance.css. Component color values use CSS variable fallbacks to preserve light mode. The saved assure-theme preference remains authoritative; invalid stored values fall back to system preference on page load.

Fixed mixed light surfaces/dark controls, translucent contact and health cards, public Tailwind surfaces, auth tabs, native dropdown and autofill colors, mobile control text size and target sizing, quote modal scrolling, and partner dashboard intrinsic-width overflow.

Validation:
- Production build and TypeScript passed before final grid adjustment; final production build rerun after adjustment.
- 12 Playwright tests: ten public/auth routes at 360, 390 and 1440px in both themes; saved preference; mobile product dropdown and quote modal submission; header layout and sticky behavior.
- 20 isolated partner layout checks using rendered components and fixture profile: dashboard, leads, customers, policies, earnings at 390/1440px in both themes. No horizontal page overflow after grid fix.
- Visual review of dark mobile contact, health, homepage, partner login and fixture dashboard.

Limits: fixture checks do not exercise live authenticated data or all protected admin forms. Chromium checks do not replace a physical iPhone/Safari keyboard and autofill check. No deployment performed.
