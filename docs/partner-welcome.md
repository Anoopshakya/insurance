# Partner welcome screen

Shown inside /partner after a successful dashboard response reports hasActivity=false. Activity means at least one assigned lead, customer, quote, policy (including drafts/cancellations), or earning-ledger record (including zero-net entries). Registration alone is not activity. Existing profile setup and approval checks remain enforced.

The primary CTA links to /partner/leads?create=1. The leads page opens its existing creation form and consumes the query parameter. Reports replace the welcome screen on the next successful refresh after activity exists. Errors never imply an empty account.

Illustration: public/brand/partner-welcome.png. Generated with the built-in image_gen tool, copied from its generated_images output into the project.

Final image prompt:
Use case: illustration-story. Create a polished welcoming flat editorial illustration for MagikPolicy insurance partner onboarding, matching the supplied UI reference concept: a cheerful young adult Indian male insurance adviser with neat navy hair, navy blazer and white shirt, seated behind a light silver laptop, one hand raised in a small optimistic fist. A small green plant to the left and two orange/navy books to the right on a thin desktop line. Soft pale lavender abstract blob behind the figure. Clean vector-like raster illustration, subtle gradients, friendly professional expression, crisp edges, medium-wide 3:2 composition, transparent outer background, ample breathing room. Navy, violet, mint and warm orange accents. Illustration only: no text, no lettering, no logo, no UI, no buttons. This will sit centered above a welcome heading on both light and dark dashboard pages.
