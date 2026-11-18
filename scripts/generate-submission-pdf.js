const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mosaic Fellowship Builder Challenge 2027 — Part 1 Customer Research</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 14mm 14mm 14mm;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1C2421;
    background: #FFFFFF;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  .pre-title {
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4A6B5D;
    margin-bottom: 2px;
  }

  h1 {
    font-size: 16pt;
    color: #1A382B;
    font-weight: 800;
    line-height: 1.2;
    margin-top: 0;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .meta-card {
    background: #F4F7F5;
    border: 1px solid #E0E7E3;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 8.5pt;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 130px 1fr;
    row-gap: 2px;
  }

  .meta-label {
    font-weight: 700;
    color: #1A382B;
  }

  .meta-value {
    color: #2D3732;
  }

  h2 {
    font-size: 11pt;
    color: #1A382B;
    font-weight: 700;
    border-bottom: 1.5px solid #1A382B;
    padding-bottom: 3px;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 6px 0;
    text-align: justify;
  }

  .highlight-box {
    background: #1A382B;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0;
    page-break-inside: avoid;
  }

  .highlight-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #D4E79E;
    margin-bottom: 3px;
  }

  .highlight-text {
    font-size: 9.5pt;
    font-weight: 600;
    line-height: 1.35;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 7.5pt;
    page-break-inside: avoid;
  }

  th {
    background: #1A382B;
    color: #FFFFFF;
    font-weight: 700;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #1A382B;
  }

  td {
    padding: 5px 7px;
    border: 1px solid #D5DFD9;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #F8FAF9;
  }

  .selected-row td {
    background: #EAF2EC !important;
    font-weight: 600;
  }

  ul, ol {
    margin: 0 0 8px 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 3px;
  }

  .footer-sig {
    margin-top: 20px;
    padding-top: 8px;
    border-top: 1px solid #D5DFD9;
    font-size: 7.5pt;
    color: #586B61;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<div class="pre-title">Mosaic Wellness Fellowship Builder Challenge 2027</div>
<h1>Be Bodywise — Customer Research & Problem Statement</h1>

<div class="meta-card">
  <div class="meta-grid">
    <div class="meta-label">Applicant:</div>
    <div class="meta-value">Anshul Kaushal • Thapar Institute of Engineering & Technology (TIET) • Batch of 2027</div>
    <div class="meta-label">Chosen Brand:</div>
    <div class="meta-value"><strong>Be Bodywise</strong> (Mosaic Wellness Pvt. Ltd., Thane, Mumbai)</div>
    <div class="meta-label">Submission Date:</div>
    <div class="meta-value">18 November 2026</div>
    <div class="meta-label">Connected Solution:</div>
    <div class="meta-value"><strong>Bodywise Match</strong> (<a href="https://bodywise-match-x5hd.vercel.app">https://bodywise-match-x5hd.vercel.app</a> • <a href="https://github.com/AnshulKaushal27/bodywise-match">GitHub</a>)</div>
  </div>
</div>

<h2>1. Chosen Mosaic Brand</h2>
<p>
<strong>Brand:</strong> Be Bodywise (Mosaic Wellness Pvt. Ltd.) &nbsp;|&nbsp; <strong>Category:</strong> Digital-first active dermatological skincare & hair wellness.
</p>
<p>
<strong>Why Be Bodywise:</strong> Be Bodywise formulates with clinical-grade active ingredients (Redensyl, 2% BHA, 10% Urea, 1% Salicylic Acid, 4% AHA-BHA, Biotin). Active personal care fundamentally depends on accurate concern-to-product matching and disciplined multi-month adherence. When customers select the wrong active, use it at an incorrect frequency, or abandon it prematurely due to milestone blindness, brand trust and customer lifetime value (LTV) collapse. Building an intelligent, honest decision and expectation layer through technology is the single highest-leverage retention driver for the brand.
</p>

<h2>2. Customer Conversations & Key Insights (Primary Research)</h2>
<p>
We conducted primary customer research via direct interviews and Google Form surveys across active users of Mosaic brands. Each customer explicitly agreed to share their name, contact phone number, and feedback with Mosaic Wellness for this Fellowship application.
</p>

<table>
  <thead>
    <tr>
      <th style="width: 15%;">Customer & Contact</th>
      <th style="width: 17%;">Product & Duration</th>
      <th style="width: 15%;">Why Chosen</th>
      <th style="width: 16%;">What Worked (Likes)</th>
      <th style="width: 17%;">What Struggled (Dislikes)</th>
      <th style="width: 20%;">Customer Wishlist / Needed Solution</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Sonika</strong><br>+91 9463747241<br><em>(Consent: Yes)</em></td>
      <td><strong>Be Bodywise Hair Care Product</strong><br>Duration: ~5 Months</td>
      <td>Instagram ad + positive reviews + friend recommendation.</td>
      <td>Ordering was very smooth, easy, and convenient.</td>
      <td>Guidance vacuum post-checkout; didn't know correct frequency or whether using right; unhelpful support.</td>
      <td><strong>"It would be nice to have an AI assistant which can guide customers after purchase, answer product-related questions and track their progress."</strong></td>
    </tr>
    <tr>
      <td><strong>Nikhil</strong><br>+91 9549197684<br><em>(Consent: Yes)</em></td>
      <td><strong>Be Bodywise Hair Growth Gummies</strong> (Biotin)<br>Duration: 2–3 Months</td>
      <td>Persistent hair fall; gummies felt easier than swallowing pills.</td>
      <td>Great taste; enjoyable gummy format makes daily intake effortless.</td>
      <td>Zero visible hairfall difference after 60–90 days; occasionally forgets dose; milestone ambiguity; feels expensive.</td>
      <td><strong>"Agar koi feature hota jahan hum apna daily consumption aur hair growth track kar sakein toh better hota. At least pata toh chale ki product actually work kar raha hai ya nahi."</strong></td>
    </tr>
    <tr>
      <td><strong>Karamjit</strong><br>+91 9041061840<br><em>(Consent: Yes)</em></td>
      <td><strong>Be Bodywise 2% BHA Body Acne Spray</strong><br>Duration: 1 Month</td>
      <td>Promotional ads and introductory discounts.</td>
      <td>360° spray nozzle clears back acne easily without assistance.</td>
      <td>Leaves a tacky/sticky skin residue after application; triggered relentless automated WhatsApp/SMS promotional spam.</td>
      <td>Texture refinement to eliminate tackiness; immediate opt-out option for promotional marketing spam.</td>
    </tr>
    <tr>
      <td><strong>Renu Rishi</strong><br>+91 9465073899<br><em>(Consent: Yes)</em></td>
      <td><strong>Be Bodywise 10% Urea Body Lotion</strong><br>Duration: 2 Months</td>
      <td>Recommended on Reddit r/IndianSkincareAddicts as elegant pharmacy urea alternative.</td>
      <td>Noticeable, visible smoothing of rough arm skin texture and bumpiness within two weeks of daily use.</td>
      <td>None on efficacy; requested bundled routine offerings with body washes.</td>
      <td>Clear routine pairing guides demonstrating how 10% Urea complements daily cleansing body washes.</td>
    </tr>
    <tr>
      <td><strong>Sudarshan</strong><br>+91 9464728747<br><em>(Consent: Yes)</em></td>
      <td><strong>Little Joys Product</strong> (Mosaic Portfolio)<br>Duration: ~2 Months</td>
      <td>Seeking healthy, child-friendly nutritional supplements.</td>
      <td>Child consumed without resistance; pleasant taste.</td>
      <td>Price feels somewhat high for ongoing daily consumption.</td>
      <td>Better subscription pricing tiers and recurring loyalty discounts for multi-month adherence.</td>
    </tr>
    <tr>
      <td><em>(Anonymous Survey Respondent)</em></td>
      <td><strong>Be Bodywise Body Lotion</strong><br>Duration: 3–4 Months</td>
      <td>Skincare community recommendations.</td>
      <td>Good skin moisturisation and barrier feel.</td>
      <td>Little expensive compared to mass brands; pump packaging can be improved.</td>
      <td>Continued educational advocacy and value packs.</td>
    </tr>
  </tbody>
</table>

<h2>3. Secondary Research Base (Online Community Triangulation)</h2>
<p>
To ensure our primary interviews reflected broader customer behavior, we triangulated our findings against publicly documented customer discussions across Reddit (<code>r/IndianSkincareAddicts</code>, <code>r/IndianBeautyTalks</code>), Apple App Store, and Google Play Store:
</p>
<ul>
  <li><strong>u/st4rbaby999 (Reddit):</strong> Used Hair Growth Roll-On Serum for 2 months (finished 2 bottles). Saw zero visible results, felt spend was wasted, and resolved not to repurchase.</li>
  <li><strong>u/VacationHead2226 (Reddit):</strong> Used Rosemary + Redensyl serum for >1 month. Noticed baby hair at hairline, but felt middle parting looked wider. Panicked over transient shedding and questioned whether to quit.</li>
  <li><strong>u/ITS-NEVER-2-LATE (Reddit):</strong> Used 4% AHA-BHA Underarm Roll-On. Odor control lasted only 2–3 hours; zero pigmentation lightening after 2–3 months of daily use.</li>
  <li><strong>Durva Khandeparkar (Google Play):</strong> Praised app UI, but explicitly pleaded for an in-app product review section so buyers can read honest product reviews before purchasing.</li>
  <li><strong>neha khatoon & Anjalika Patnaik (App Store):</strong> Orders delayed multiple days; couriers gave 1-second missed calls and falsely marked customers unreachable.</li>
</ul>
<p>
<strong>Triangulation Insight:</strong> Sonika's direct plea for an AI routine assistant matches Durva's review asking for transparent in-app guidance; Nikhil's milestone uncertainty mirrors u/st4rbaby999 quitting at month two; Karamjit's tacky residue report mirrors u/ITS-NEVER-2-LATE's roll-on experience.
</p>

<h2>4. Patterns Noticed Across Conversations</h2>
<ol>
  <li><strong>Post-Purchase Guidance Vacuum:</strong> Sonika explicitly stated she didn't know how frequently to use the product or whether she was using it correctly, requesting an AI assistant. Once checkout finishes, customers feel abandoned.</li>
  <li><strong>The 60-Day "Efficacy Blindspot":</strong> Both Nikhil (Gummies) and u/st4rbaby999 (Serum) reached month two without knowing whether follicle nutrition was working. Biological renewal takes 90–120 days; silence from the brand during this window leads to premature routine abandonment.</li>
  <li><strong>Format Innovation vs. Sensory Trade-offs:</strong> Karamjit praised the 360° spray for reaching back acne but struggled with tacky residue; Nikhil loved gummies but feared recurring cost. Innovative formats drive acquisition, but sensory expectations must be framed accurately.</li>
  <li><strong>Active Specificity vs. Routine Pairing:</strong> Renu Rishi achieved rapid bump reduction in 2 weeks with 10% Urea because the active matched her exact condition; when actives are misaligned or used without routine context, dissatisfaction is guaranteed.</li>
</ol>

<h2>5. What is Driving the Problem (Root Cause & Broader CX)</h2>
<ul>
  <li><strong>Biological Realities vs. Marketing Timelines:</strong> Clinical actives operate on cellular schedules (follicle cycles take 90–120 days; epidermal renewal takes 28–45 days). Digital marketing emphasizes rapid gratification. When the brand provides no milestone roadmap, the customer assumes failure at Day 45.</li>
  <li><strong>Catalog Navigational Complexity:</strong> Be Bodywise has expanded to 100+ active SKUs across hair, face, body, and underarms. A consumer cannot easily discern whether rough skin requires 1% Salicylic Acid, 10% Urea, 10% AHA scrub, or 2% BHA spray.</li>
  <li><strong>Disconnected Post-Purchase Experience:</strong> Once payment clears, touchpoints collapse into automated shipping SMS and promotional WhatsApp marketing (which Karamjit noted causes annoyance). There is no guided routine assistant.</li>
</ul>

<h2>6. Candidate Problems Considered & Evaluation</h2>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Problem Domain</th>
      <th style="width: 32%;">Observed Friction Points</th>
      <th style="width: 20%;">Tech Feasibility</th>
      <th style="width: 23%;">Strategic Verdict</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Last-Mile 3PL Delivery Failures</strong></td>
      <td>Delayed shipments, false missed calls, cancelled orders.</td>
      <td>Low (Physical 3PL operations)</td>
      <td><span style="color:#A00;">REJECTED</span>: Courier operations issue, not an AI software builder challenge.</td>
    </tr>
    <tr>
      <td><strong>2. Customer Support Ticket SLAs</strong></td>
      <td>Closed tickets without answer, agent CSAT pressuring.</td>
      <td>Low (Human CS operations)</td>
      <td><span style="color:#A00;">REJECTED</span>: Requires internal staffing/CRM restructuring, not customer software.</td>
    </tr>
    <tr>
      <td><strong>3. Marketplace Authenticity & QC</strong></td>
      <td>Near-expiry batches on Fruugo/Amazon, packaging desync.</td>
      <td>Medium (QR lookup / batch DB)</td>
      <td><span style="color:#A00;">REJECTED</span>: Solves an edge case for 3rd party resellers, not core direct journey.</td>
    </tr>
    <tr>
      <td><strong>4. Marketing Communication Fatigue</strong></td>
      <td>Relentless WhatsApp/SMS marketing spam (Karamjit feedback).</td>
      <td>Medium (SMS opt-out dashboard)</td>
      <td><span style="color:#A80;">PARTIALLY MERGED</span>: Addressed in app design via transparent privacy and zero spam.</td>
    </tr>
    <tr class="selected-row">
      <td><strong>5. PRE-PURCHASE INTENT-TO-PRODUCT FIT & POST-PURCHASE GUIDANCE VACUUM</strong></td>
      <td>Misaligned product selection, 60-day milestone blindness, guidance vacuum (Sonika, Nikhil).</td>
      <td>VERY HIGH (AI Intent Parsing + Deterministic Rules)</td>
      <td><span style="color:#1A382B; font-weight: bold;">SELECTED</span>: Directly requested by customers; solves root cause of wrong product selection and routine abandonment.</td>
    </tr>
  </tbody>
</table>

<h2>7. The One Problem Chosen to Solve</h2>

<div class="highlight-box">
  <div class="highlight-label">Definitive Problem Statement:</div>
  <div class="highlight-text">
    "Be Bodywise customers struggle to select the right clinical active for their specific concern from a crowded 100+ product catalogue, and after purchasing face a complete guidance vacuum, unassisted adherence fatigue, and 60-day milestone blindness—leading to premature routine abandonment before biological results can take effect."
  </div>
</div>

<h2>8. Why We Chose This Problem Over Others</h2>
<ol>
  <li><strong>Direct Customer Mandate:</strong> This problem was directly articulated by our primary respondents. Sonika requested an AI assistant to guide post-purchase usage and track progress; Nikhil requested consumption tracking and milestone roadmaps.</li>
  <li><strong>Direct Lever on Customer Lifetime Value (LTV):</strong> In personal care, business sustainability depends on month-3 and month-6 retention. Acquiring customers who quit at Day 45 destroys marketing efficiency. Solving expectation alignment unlocks repeat purchase habits.</li>
  <li><strong>Zero Medical Hallucination Safeguard:</strong> Medical diagnosis is irresponsible and unsafe for consumer software. However, honest, deterministic goal-to-catalogue matching (grounded strictly in published clinical labels and verified facts) bridges the knowledge gap safely without overpromising medical cures.</li>
  <li><strong>High Technology & AI Leverage:</strong> Large Language Models excel at interpreting unstructured, emotional human intent (e.g. <em>"my hair is falling and arms have bumps"</em>), while pure TypeScript deterministic rules engines excel at matching those requirements against verified catalog facts with zero hallucinations.</li>
</ol>

<h2>9. Connecting Part 1 Research to Part 2 Solution: "Bodywise Match"</h2>
<p>
To address this validated problem statement, we designed, engineered, and deployed <strong>Bodywise Match</strong>:
</p>
<ul>
  <li><strong>One-Line Promise:</strong> <em>"Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong."</em></li>
  <li><strong>Live Production URL:</strong> <a href="https://bodywise-match-x5hd.vercel.app">https://bodywise-match-x5hd.vercel.app</a></li>
  <li><strong>Open-Source GitHub Repository:</strong> <a href="https://github.com/AnshulKaushal27/bodywise-match">https://github.com/AnshulKaushal27/bodywise-match</a></li>
</ul>

<p><strong>How Bodywise Match Solves the Validated Customer Pains:</strong></p>
<ol>
  <li><strong>AI Interprets, Rules Decide (Solves Sonika's Guidance Vacuum):</strong> Directly fulfills Sonika's request for an AI guide. LLM or deterministic keyword parsing extracts structured needs (<code>ParsedNeeds</code>) into strict Zod schemas; product ranking and exclusions are pure deterministic TypeScript.</li>
  <li><strong>Expectation & Milestone Transparency (Solves Nikhil's Milestone Blindness):</strong> Fulfills Nikhil's demand for milestone timelines. Match cards explain biological timelines (e.g. 90–120 days for hair renewal) and format trade-offs before purchase.</li>
  <li><strong>Fact Integrity & Provenance (Solves Product Uncertainty):</strong> Every single product fact across the catalogue includes provenance (source URL and <code>last_verified_at</code> timestamp). Unverified fields remain null ("Not verified yet").</li>
  <li><strong>Order & Product Issue Helper (Solves Karamjit & Delivery Issues):</strong> Guided checklists and direct routes to official support channels for delivery, packaging, or communication issues.</li>
  <li><strong>Privacy First & Zero Spam:</strong> Zero mandatory signup, zero spam, fastify logger body redaction, and strict WCAG AA contrast compliance.</li>
</ol>

<h2>10. Conclusion</h2>
<p>
Our customer research demonstrates that the most urgent unlock for Be Bodywise is not top-of-funnel customer acquisition, but protecting customer trust between Day 0 and Day 90. By introducing an intelligent decision and expectation layer like <strong>Bodywise Match</strong>, Mosaic Wellness can eliminate premature churn, lower refund friction, and establish Be Bodywise as India's most trusted digital wellness brand.
</p>

<div class="footer-sig">
  <div>Submitted with respect by <strong>Anshul Kaushal</strong> (Thapar Institute of Engineering & Technology)</div>
  <div>Mosaic Wellness Fellowship Builder Challenge 2027 • Batch of 2027</div>
</div>

</body>
</html>`;

async function generatePdf() {
  const htmlPath = path.join(__dirname, '..', 'Mosaic_Fellowship_Materials', 'Mosaic_Fellowship_Part1_Submission.html');
  const pdfPath = path.join(__dirname, '..', 'Mosaic_Fellowship_Materials', 'Mosaic_Fellowship_Part1_Submission.pdf');

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`Saved HTML preview to: ${htmlPath}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log(`Successfully generated PDF: ${pdfPath}`);
}

generatePdf().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
