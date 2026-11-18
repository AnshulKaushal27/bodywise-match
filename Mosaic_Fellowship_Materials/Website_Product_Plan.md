# Be Bodywise Website Plan: Bodywise Match

**Working name:** Bodywise Match (check name/domain availability before public launch)  
**One-line promise:** Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.  
**Build target:** Mobile-first web app / PWA for the Mosaic Fellowship Builder Challenge.  
**Primary product decision:** Build an AI-assisted concern-to-product recommendation experience. The user gets value in one session; progress updates and reviews are optional follow-ups, never the entry requirement.

## 1. The product

Bodywise Match is a customer decision and trust layer that connects product discovery to the experience after purchase. It helps a customer:

1. The user describes their concern in everyday language, chooses a concern category, or optionally uploads a photo.
2. The app asks a few concise follow-up questions to understand their goal, preferences, current routine, sensitivities, and constraints.
3. AI converts the answers into structured requirements. A deterministic matching layer compares those requirements with a curated, maintained product catalogue.
4. The app explains each match, what it is intended for, trade-offs, price/format where verified, what it cannot promise, and why another product may not fit.
5. The user can optionally say whether they tried the recommendation and later share a review. Feedback can improve the next recommendation, but the app never requires a diary or claims that one person's feedback proves efficacy.
6. If the user reports an order, freshness, packaging, or support problem, the app gives a guided issue checklist and a clear route to official support. This is a reporting/assistance layer; it does not claim access to courier systems, inventory, or ticket status unless a real integration exists.

### Validated problem statement is still pending

The supplied materials contain public review signals about confusion choosing products and understanding outcomes, including a request for product-level reviews. They also show other candidate problems such as delivery and support. The five-customer interview roster is a template with example data and placeholders, not completed research. Interview at least five real Be Bodywise customers with consent before claiming this is their verified core problem. If the interviews identify a different repeated problem, adjust the product focus before submission.

**Problem hypothesis to test:** Customers struggle to make a confident Be Bodywise product choice from their concern and preferences, and after ordering can lack clear, useful information about what other users experienced or how to handle common order/product issues.

**Root-cause hypothesis:** The customer journey is fragmented. Before purchase, customers have to translate a personal concern into a product choice and search for independent product-level experiences. After purchase, delivery delays, unclear support, product freshness/packaging concerns, and mixed product outcomes can leave them unsure what to do. Existing review signals suggest these are separate moments in one broader trust problem, but their prevalence and importance still need validation through interviews.

**Solution hypothesis:** A guided intake, transparent catalogue-grounded matching, structured product experiences, and an honest post-purchase issue guide can make the journey easier to navigate. The app can improve clarity and route customers to the right next step; it cannot itself guarantee product results, delivery, authenticity, or support resolution.

## 2. Product principles

- **Immediate value first:** The user sees a useful answer before being asked to create an account or track anything.
- **AI interprets; rules decide:** AI extracts intent and asks clarifying questions. A deterministic matcher applies explicit product-fit rules. The language model cannot invent a product, ingredient, claim, price, or contraindication.
- **Explain every recommendation:** Show the inputs that led to the match, the relevant product facts, and any limitation or uncertainty.
- **User choice:** Present a shortlist, not a single authoritative answer. Let users correct the parsed concern and edit their preferences.
- **No medical diagnosis:** Do not diagnose from text or images, score disease severity, promise results, or say a product treats a medical condition.
- **Photo is optional and bounded:** Photo input is not required. For the first version, support only broad, non-diagnostic visual context with clear consent; text-only works fully.
- **Feedback is voluntary:** Ask for outcome feedback only after the recommendation, and make skip easy. No streaks, nagging, or required progress journal.
- **Trust over conversion:** Do not rank by affiliate payment, margin, or sponsorship. If inventory/price data cannot be verified, omit it or label its source/date.

## 3. Audience and positioning

**Primary user:** A Be Bodywise customer or prospective customer unsure which product in the range fits their concern, needs, preferences, or routine.

**Secondary user:** A returning user who tried a recommendation and wants a better next option based on what they noticed.

**Positioning:** “A clearer way to find a Be Bodywise product that fits what you’re looking for.” The app is a product discovery guide, not a clinician, diagnostic tool, or guarantee of results.

**Voice:** Warm, direct, calm, and plain-language. Avoid shame, alarm, certainty beyond evidence, or claims such as “this will fix your hair fall.” Prefer “may be relevant to your stated goal” and “here is why this appears in your shortlist.”

## 4. MVP scope

### Include

- Landing page with one clear CTA: **Find my match**.
- Concern intake supporting free text, selectable concern chips, and optional image upload.
- AI extraction into a visible editable summary: concern, goal, product category, preferences, constraints, confidence, and unanswered questions.
- Follow-up questions, one at a time, only when needed to distinguish among catalog products.
- Small curated Be Bodywise product catalogue with verified facts and source/date metadata.
- Transparent deterministic ranking and 2–3 recommendation cards, including “why this fits,” “why it might not,” use context, and source-linked facts.
- Product-level experience summaries when real, consented, moderated experience data exists. Show sample size and dates; separate positive, neutral, and negative reports; never treat sparse reports as proof.
- A structured “what people reported” section on product pages: perceived outcome, duration of use, usage consistency, comfort/reaction, and common uncertainty. Mark each item as self-reported.
- A **Need help with an order or product?** route with issue choices for delayed delivery, failed delivery attempt, damaged/leaking package, near-expiry concern, payment uncertainty, and unresolved support request.
- An issue checklist that helps the customer gather useful details and directs them to current official Be Bodywise support channels. Do not collect or transmit those details in the challenge MVP.
- Clear caveats where information is unavailable: “We can’t verify your order or batch here.” No false real-time tracking, batch authentication, or ticket status.
- Option to compare recommendations side by side.
- “Not quite right?” controls to correct goal/preferences and regenerate the shortlist.
- Optional account-free feedback: “Did you try this?” and later “How did it go?” with skip, not now, and change recommendation options.
- If user returns with feedback, use it as one preference signal for their own next shortlist and aggregate only with consent and privacy controls.
- Clear explanation that recommendations are informational and not medical advice.
- Mobile responsive design, accessible forms, loading and error states, privacy and safety pages.
- Demo mode with invented examples clearly marked as demo content.

### Exclude from first version

- Diagnosis, disease detection, skin/hair condition severity scores, or treatment plans.
- Image-based “skin analysis” claims, before/after scoring, or conclusions about product efficacy.
- Broad web search, crowdsourced product facts, or unverified ingredient/price/availability claims.
- Mandatory signup, repeated diary logging, streaks, or push reminders.
- Checkout, payments, subscriptions, order tracking, barcode scanning, or brand CRM integration.
- Actual courier status/ETA, batch authenticity lookup, expiry database, or support ticket integration without an official data connection.
- Scraping or publishing third-party reviews without permission.
- Public user reviews until consent, moderation, privacy, and moderation tooling are in place. For the challenge demo, use labelled sample experience cards only.
- AI-generated product pack shots, fake testimonials, or AI-generated before/after imagery.

## 5. User journey and screens

### 1. Landing page

Hero: **“Not sure which product fits your concern?”**  
Supporting line: “Tell us what you’re looking for. We’ll ask a few quick questions and explain which Be Bodywise options may fit.”  
Primary button: **Find my match**. Secondary: **Browse products**.  
Trust note directly below: “No diagnosis. No guaranteed results. Your photo is optional.”

Below fold: three-step explanation; example recommendation card; privacy/photo explanation; FAQ; footer with About, Privacy, Safety, Contact.

### 2. Concern input

Prompt: **“What would you like help choosing for?”**

- Free text box with examples such as “I want help choosing a body wash for back bumps” (examples must not imply treatment claims).
- Tap-to-select common catalogue-supported goals, loaded from the product catalogue rather than hard-coded unsupported claims.
- Photo button: **Add a photo (optional)**, with a short explanation of what is and is not analyzed before opening the file picker.
- Consent checkbox/toggle before any photo is sent to an external model; default off.
- CTA: **Continue**.

### 3. Clarify and confirm

Show the parsed summary in editable chips, e.g. “Goal: reduce the look of body bumps,” “Format: wash,” “Preference: fragrance-free,” “Sensitivity: unsure.” Ask only decision-relevant follow-ups: current routine, preference/avoidance, skin/hair type only where the product catalogue supports it, budget/format, and whether the user wants to avoid certain ingredients. Avoid requesting age, diagnosis, medical history, or unrelated sensitive details.

When confidence is low, state what is unclear and ask one focused question instead of guessing. Provide a “Skip; show broad options” path.

### 4. Recommendation results

Header: **“Options that match what you told us”**. Show 2–3 products, not a false-precision percentage score. Each card includes:

- product name and authorized product image or neutral placeholder;
- “Why it’s here” grounded in the user's stated goal and catalogue facts;
- “Consider this if…” and “May not be the best fit if…”;
- relevant verified product facts, with source and last-checked date;
- a match label such as “Strong fit for your stated format preference,” never “92% effective”;
- actions: **Compare**, **View product details**, **This doesn’t fit**.

Explain ranking in a visible “How we matched” panel: hard exclusions first, then goal/category fit, preferences, routine compatibility, and tie-breaks. If none fit, say so and offer broad catalogue browsing rather than force a recommendation.

Below the shortlist, connect recommendations to review evidence without turning it into a generic star score. Show real counts only when the dataset supports them (for example, “Among 8 consented reports, experiences varied”). If there is no reliable data, say “No verified community data yet” and label any illustrative prototype cards as fictional.

### 5. Optional feedback

After results: “Was this shortlist useful?” Yes / Somewhat / No, with optional reason. This is immediate UX feedback, not efficacy feedback.

On product detail: **“Trying one of these?”** Save it on this device (optional). After a user-selected interval or next visit, ask once whether they want to share an experience. Provide **Skip**, **Not yet**, and **I didn’t try it**. Keep public review consent separate from storing private preferences.

If a user says it did not work or caused discomfort, ask what they want to do next and show neutral safety guidance for concerning reactions. Do not automatically recommend a stronger active or make medical claims.

### 6. Product detail / compare

Product detail should present intended use as described by verified official product information, ingredients only if accurately sourced, format/size, usage instructions only from official label directions, and clear “why it matched”/“why it may not” sections. Compare page aligns facts in rows and does not hide missing data.

Add a **Customer experiences** panel for consented, moderated product feedback, with use duration and consistency context. Add a **Need help after ordering?** panel that links to official help and lets the user choose an issue category. For a prototype, issue help is explanatory and route-based, not a promise to resolve the problem.

### 7. Post-purchase trust and issue helper

This feature responds to review signals about shifting ETAs, alleged failed delivery attempts, support tickets closed without explanation, damaged/leaking parcels, near-expiry products, and payment-state confusion. Keep it useful without pretending to connect to systems this app cannot access:

- **Delivery delayed / marked unavailable:** Show a checklist of timestamps, delivery status wording, contact attempts, and rescheduling questions; offer the current official support channel and a short user-editable message template.
- **Damaged, leaking, or freshness concern:** Help the customer gather order and package details and link to the official replacement/refund policy. Do not label a batch fake or expired based on an image.
- **Payment unclear:** Explain how to distinguish a wallet credit, discount, amount charged, and order confirmation only using user-entered values; do not claim transaction reconciliation.
- **Support issue unresolved:** Help prepare a concise escalation note with prior contact dates and issue summary. Link to the official grievance route only if verified at build time.
- **Concern about product outcome or tolerability:** Show relevant self-reported experience context, neutral label guidance, and professional-care direction for significant reactions. Do not diagnose or tell the user to buy a stronger product.

The MVP can demonstrate this as a branching help center with editable templates. Real ticket submission, courier integration, payment reconciliation, or batch lookup must wait for official APIs/partnerships and permission.

## 6. Recommendation and AI architecture

### Safe, explainable flow

1. **Input moderation/minimization:** Remove obvious personal identifiers from free text where feasible; do not ask for them.
2. **Intent extraction:** AI returns schema-constrained JSON: `goal`, `category`, `format_preferences`, `avoidances`, `routine_context`, `uncertainties`, `follow_up_question`, `confidence`. Every field includes evidence text or is marked unknown.
3. **User confirmation:** Show parsed summary and let user edit it.
4. **Clarification:** Ask the single highest-value missing question from predefined options. Never ask the model to invent medical triage.
5. **Deterministic matching:** Apply hard safety/avoidance exclusions, category/goal fit, format/preference fit, and routine context against a versioned, curated catalog. Keep scoring weights in code/config and provide reason codes.
6. **Explanation generation:** AI may rewrite approved reason codes into plain language, but only from retrieved product facts and matched fields. Validate output against allowed product IDs and claims. Better MVP: render explanations from templates to avoid hallucinations.
7. **Feedback:** Store voluntary preference corrections and outcome reports distinctly. User-specific corrections can change their next recommendation; aggregate trends only after explicit consent and enough reports to prevent re-identification.

### Image input boundary

Image upload is an optional enhancement and should ship only if the chosen model/API terms allow the use, images are not retained beyond the request or the retention is disclosed, server-side secrets are secured, and deletion/consent is implemented. The app may use a photo only as visual context to ask a clarifying question or identify broad visible attributes supported by the model; it must not infer a condition, severity, cause, or treatment. Do not transmit face-identifying or intimate images. Reject images that appear to contain faces or sensitive body areas if the API cannot safely handle them. Provide text-only fallback at every point.

For MVP prioritization, complete text-based recommendations first. Add image upload only after a real catalogue and explicit safety design exist; a photo-capable demo with vague or misleading analysis is worse than an honest text flow.

### Catalog data quality

Each product record must carry: official product name, supported goals/categories, format, official description, label directions, ingredient list (if published), exclusions/cautions (only if supported by official label or qualified review), price/source/date (optional), image/source/license, and `last_verified_at`. Missing facts stay missing. Have product content reviewed before showing it as factual.

## 7. Visual direction

### “Warm editorial product finder”

Use a calm, premium wellness feel that echoes the supplied challenge screenshots' evergreen and pale-lime accent, while avoiding a copy of the challenge page or Be Bodywise trade dress. Main canvas is warm off-white; evergreen is for headings and primary controls; pale sage for support surfaces; lime is a restrained accent. Avoid a clinical dashboard, diagnostic scan aesthetic, or e-commerce overload.

**Palette:** deep green `#17352E`; evergreen `#245345`; soft sage `#DCE8D7`; lime `#D9EE9B`; warm paper `#F7F7F1`; white `#FFFFFF`; charcoal `#26332E`; muted `#66756D`; border `#D8E1DA`; pale peach for cautious safety notes. Maintain WCAG AA contrast; do not use lime for small text.

**Type/layout:** DM Sans display and Inter body (or system fallbacks); max width 1120 px, reading column 680 px; 8 px spacing scale; 18 px cards; 12 px inputs/buttons; mobile gutters 20 px; touch targets at least 44×44 px. Use focus rings and reduced-motion support.

**Imagery:** Use the user's image-generation API to make an original abstract still life or botanical/product-adjacent hero background. No counterfeit branded packaging, fabricated testimonials, transformation images, or synthetic “results.” Use genuine product pack shots only if supplied or authorized. Keep decorative imagery static and compressed; the recommendation cards themselves should use authentic product assets or neutral placeholders.

## 8. Technology stack and free deployment

### Front end: Vercel

- Next.js App Router + TypeScript.
- Tailwind CSS for responsive styling and design tokens; selectively use shadcn/ui primitives.
- React Hook Form + Zod for typed client/server form validation.
- Lucide icons; native SVG for small diagrams/charts.
- Server-side route handlers for AI requests and API proxying; no model key in browser code.

### API: Render

- Node.js + Fastify + TypeScript, JSON REST API under `/v1`.
- Zod schemas, request IDs, rate limits, redacted logs, CORS allowlist.
- Endpoints: `GET /health`, `GET /products`, `GET /products/:slug`, `POST /match/parse`, `POST /match/recommend`, `POST /feedback`, `POST /experiences` (later moderation-gated).
- Render Free Web Service for challenge prototype only. It sleeps after inactivity and has ephemeral local storage; show a clear waking/retry state and never persist user data to local disk.

### Data: PostgreSQL

Preferred: Supabase Free Postgres if current plan and limits suit the prototype; use Supabase Auth only if account sync is needed. Alternative: Render Postgres if appropriate for a short-lived demo and its current retention/availability limits are acceptable. Pick one database. The API remains the only path for recommendation writes; apply ownership/security rules on all user data.

### AI/model API

Use the user's provided image-generation model API only for decorative assets initially. For text parsing/recommendation, use an available text-capable model endpoint if the API supports it, behind a server route. Do not assume an image-generation endpoint also performs reliable text extraction or vision. Store key only as server environment secret, impose input size/time limits, strip unnecessary identifiers, and handle provider failure by falling back to a deterministic questionnaire. If no text model API is available, use structured rules and still ship a complete product.

### Storage/auth

Challenge MVP: anonymous browsing and demo results, no real photo upload, no phone collection, and no account required. If saving a real user profile is added, use authenticated account ownership, private storage, delete/export, and consent. User photos should remain disabled until private buckets, signed URLs, explicit retention/deletion, and model-provider handling are implemented.

### Deployment overview

```text
Mobile/desktop browser
  ├─ Next.js UI on Vercel Hobby
  ├─ Fastify API on Render Free
  ├─ PostgreSQL (Supabase Free preferred; Render Postgres fallback)
  └─ Generated decorative art as static optimized assets
```

Use GitHub as source of truth. Vercel deploys the frontend on push; Render deploys the API from its configured service root. Set preview and production environment variables separately, configure exact allowed origins, health checks, safe model timeouts, and cold-start-friendly UI. Free tiers are suitable for a prototype, not production uptime or sensitive consumer records. Verify current provider quotas and plan terms before launch; pricing/limits can change. Render documents its free services and limitations at [Render free services](https://render.com/docs/free) and [Render pricing](https://render.com/pricing); Vercel describes Hobby at [Vercel pricing](https://vercel.com/pricing) and [Hobby plan](https://vercel.com/docs/plans/hobby); optional database pricing is at [Supabase pricing](https://supabase.com/pricing).

## 9. Data model

- `products`: official facts, source references, supported goals, formats, exclusions/cautions, image source, `last_verified_at`, catalog version.
- `match_sessions`: anonymous/session ID, created time, consent flags, catalog version, parsed needs, confidence/unknown fields, no raw photo.
- `match_answers`: session ID, question key, answer value, user correction flag.
- `recommendations`: session ID, product ID, reason codes, rank, rules version, explanation source facts.
- `preference_feedback`: session ID, useful rating, reason, preference correction, consent for aggregate use.
- `issue_guides`: versioned issue type, checklist steps, official support links, source/date reviewed. This is static guidance, not ticket data.
- `issue_drafts` (optional and local-only for MVP): issue type and user-edited draft text; avoid storing order IDs, phone numbers, or package photos server-side.
- `product_trials` (optional): user/session ID, product ID, started date, private note/feedback, retention setting.
- `experiences`: product ID, duration bucket, self-reported outcome, moderated text, publication consent and status; no contact details.
- `consents`: scope, wording version, timestamp, revoked timestamp.
- `users` (only if accounts ship): auth ID and minimal settings.

Separate temporary matching input from any published review. Do not store uploaded photos in the MVP. Keep personal notes private and out of logs. Use request validation, rate limits, data retention limits, and explicit account deletion if accounts are added.

## 10. Trust, privacy, and safeguards

- Explain before upload whether the photo is sent to an AI provider, what it will be used for, and how long it is retained. Require separate affirmative consent; default off.
- Do not use uploaded images to train a model unless the user gives specific separate consent and the provider contract permits it.
- Keep photo processing out of scope until privacy and deletion controls work end to end.
- Show the exact parsed concern before recommending; allow edits and “you misunderstood me.”
- Keep product facts grounded in official, dated sources. A model cannot make new claims.
- Display “why this fits” and “why it might not” with uncertainty; no unexplained scores.
- Public experience content must be explicitly consented and moderated. Do not imply verification without a real verification process.
- Never expose contact details or private concern text on public pages.
- Do not use AI to diagnose or advise treatment. For concerning reactions, use a neutral instruction to stop use and consult a qualified health professional, without claiming cause.
- No sponsored ranking; disclose any future commercial relationship prominently.

## 11. Build sequence

### Phase 0: Validate the real problem

1. Interview at least five actual Be Bodywise customers using neutral questions, not leading them toward this concept.
2. Ask what they were trying to solve, how they chose their last product, what alternatives they considered, what information was missing, how confident they felt, and what they wish the app did.
3. Ask for explicit consent separately before sharing name, phone number, products, and feedback with Mosaic. Do not use the directory's illustrative entries.
4. Identify patterns and contradictions; count interviewees honestly. Choose the strongest validated problem and align the app to it.

### Phase 1: Build a grounded catalog and text MVP

1. Create a small product catalog from official current sources and record source/date for each fact.
2. Build the responsive landing, concern intake, editable parsed summary, one-question clarification, transparent results, product detail, compare, privacy and safety pages.
3. Start with deterministic parsing/questionnaire. Add LLM parsing only if model access, server-side key management, schema constraints, and fallback are ready.
4. Seed the demo with fictitious sample answers clearly labelled as demo data, not interviews or customer reviews.

### Phase 2: Reviews and post-purchase help layer

1. Add structured product experiences from real, consented sources only; clearly distinguish customer interviews, public review signals, and app-submitted experiences.
2. Add optional “Was this shortlist useful?” and “Did you try this?” feedback with dismiss/skip controls.
3. Add the issue helper for delivery, damaged/freshness concerns, payment uncertainty, and unresolved support. Use verified support links and date-stamped policy references.
4. Make user corrections influence only their next shortlist unless separately consented to aggregated analysis.
5. Add community experiences only with consent, moderation, report, and deletion workflows. If no proper data exists, show an empty state rather than fabricate reviews.

### Phase 3: Optional image input

1. Review image API capabilities, retention terms, and safety constraints.
2. Add consent explanation, file validation, server-side processing, no storage by default, and text-only fallback.
3. Restrict outputs to non-diagnostic visual context; test against ambiguous/poor images and refuse to make unsupported inferences.
4. If safe scope cannot be clearly implemented, leave photo upload as a disabled “coming later” affordance or omit it; text flow remains the complete product.

### Phase 4: Deploy and present

1. Commit to GitHub; deploy Next.js to Vercel and API to Render.
2. Provision a single Postgres choice and configure production secrets/CORS.
3. Check logged-out mobile browser experience, API cold start, model timeout/fallback, and no-photo path.
4. Record a 60–90 second demo: state concern → confirm parsed needs → answer one clarifier → understand shortlist and trade-offs → correct a preference → optionally provide feedback.
5. Prepare app name, public URL, repository URL, and a description under the submission form's 500-character cap.
6. Upload actual customer research PDF/Word under the displayed 10 MB limit and CV under 5 MB; confirm all declaration boxes honestly.

## 12. MVP acceptance criteria

- A user can reach a useful shortlist without signup, photo upload, or repeated logging.
- Text-only recommendation is complete and accessible on mobile.
- User can edit the AI-parsed requirements before matching.
- Every result maps to real catalog product IDs and versioned product facts.
- A rules-based matcher, not the language model, determines products and ordering.
- Reasons and limitations are visible; no fake precision or unsupported claims.
- If no product fits, the system says so instead of inventing a match.
- Provider/API failure falls back to a clear questionnaire or retry, not a blank screen.
- A user can reach the issue guide for common review-reported order/product problems, but the UI never implies live order or batch verification.
- Product experience summaries show sample size, source, and self-reported status; absent/weak evidence is presented as unavailable rather than fabricated.
- Optional feedback can be skipped and is not misrepresented as clinical/product verification.
- Demo examples are labelled as fictional; no fake interview data or reviews.
- Photo upload remains off unless all explicit consent, processing, deletion, and privacy requirements are complete.
- App description fits 500 characters and the deployed link opens without account creation.

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Interviewees care more about delivery/support than product selection | Validate before locking; pivot if evidence points elsewhere. |
| AI invents ingredients or overstates fit | Versioned catalog, schema-bound extraction, deterministic ranker, template explanations, source/date per fact. |
| Photo output sounds diagnostic | Text-first MVP; clear consent; strict non-diagnostic scope; omit photo if controls are incomplete. |
| Recommendation is mistaken for medical advice | Plain boundary near intake/results; no diagnoses, severity scoring, or treatment plans. |
| Users do not return for feedback | Core value is delivered immediately; feedback optional and contextual, no diary requirement. |
| Free API sleeps | Show wake/retry state, provide demo and deterministic fallback. |
| Product facts become stale | Store sources and last-checked dates; reverify before final demo. |
| User concerns are sensitive | Minimize collection, do not log text, provide deletion, no public default, no phone field. |

## 14. Submission-ready copy

### App description (under 500 characters)

> Bodywise Match helps you find Be Bodywise products that may fit your personal-care goal, with a transparent shortlist and real-world experience context where available. If an order or product issue comes up, get a clear checklist and the right official support route. Recommendations do not diagnose or guarantee results.

### Optional notes

> Recommendations are based on user-stated preferences and a curated product catalogue. Community examples are demo content unless explicitly identified as consented, moderated user experiences. Photo input is optional and is not used for diagnosis.

Only state that the app is based on five customer conversations after those interviews and consent are complete. Do not put sample names or example phone numbers in the final research submission.

## 15. Final recommendation

Build Bodywise Match as an immediate-value product finder plus a lightweight trust layer across discovery and post-purchase. The coherent journey is: **understand my concern → show suitable options and relevant customer experiences → help me take the next step if something goes wrong → optionally learn from my feedback**. Review-reported issues around efficacy uncertainty and product-specific reviews fit into matching and product detail; delivery, damage/freshness, payment, and support issues fit into a practical issue guide. Do not promise fulfilment fixes without company integrations. Keep photo input optional, text-first, and non-diagnostic. Validate which parts matter most in the five real interviews, and keep the final app and research submission tied to that evidence.

## Materials reviewed

- Fellowship challenge brief: `Read_this_2.txt`.
- Be Bodywise customer problem directory: `Be_Bodywise_Customer_Problems_and_Contact_Directory.md`.
- Review research and contact routes: `Be_Bodywise_Customer_Review_Research_with_Contact_Routes.docx`.
- Eight startup directions: supplied pasted text attachment.
- Submission form screenshots in `Submission Form Image/`.
