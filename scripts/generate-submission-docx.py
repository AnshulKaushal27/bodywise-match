import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()
    
    # Page setup - 0.75 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)

    COLOR_PRIMARY = RGBColor(26, 56, 43)     # #1A382B
    COLOR_MUTED = RGBColor(74, 107, 93)       # #4A6B5D
    COLOR_DARK = RGBColor(28, 36, 33)         # #1C2421
    
    # Pre-title
    p_pre = doc.add_paragraph()
    r_pre = p_pre.add_run("MOSAIC WELLNESS FELLOWSHIP BUILDER CHALLENGE 2027")
    r_pre.font.size = Pt(9)
    r_pre.font.bold = True
    r_pre.font.color.rgb = COLOR_MUTED
    p_pre.paragraph_format.space_after = Pt(2)

    # Main Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Be Bodywise — Customer Research & Problem Statement")
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_PRIMARY
    p_title.paragraph_format.space_after = Pt(6)

    # Subtitle / Metadata Card
    tbl_meta = doc.add_table(rows=1, cols=1)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_meta = tbl_meta.rows[0].cells[0]
    set_cell_background(c_meta, "F4F7F5")
    set_cell_margins(c_meta, top=120, bottom=120, left=160, right=160)
    
    p_meta = c_meta.paragraphs[0]
    p_meta.paragraph_format.space_after = Pt(0)
    
    runs_meta = [
        ("Applicant: ", True), ("Anshul Kaushal • Thapar Institute of Engineering & Technology (TIET) • Batch of 2027\n", False),
        ("Chosen Brand: ", True), ("Be Bodywise (Mosaic Wellness Pvt. Ltd.)  |  ", False),
        ("Date: ", True), ("18 November 2026\n", False),
        ("Connected Solution (Part 2): ", True), ("Bodywise Match (Live: https://bodywise-match-x5hd.vercel.app | GitHub: https://github.com/AnshulKaushal27/bodywise-match)", False)
    ]
    for text, bold in runs_meta:
        r = p_meta.add_run(text)
        r.font.size = Pt(9)
        r.font.bold = bold
        r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_h1(text):
        p = doc.add_paragraph()
        r = p.add_run(text)
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        return p

    # 1. Chosen Brand
    add_h1("1. Chosen Mosaic Brand")
    p_b = doc.add_paragraph()
    p_b.add_run(
        "Brand: Be Bodywise (Mosaic Wellness Pvt. Ltd.)\nCategory: Digital-first women's wellness, active dermatological skincare, and hair health.\n\n"
        "Why Be Bodywise? Be Bodywise formulates with clinical-grade active ingredients (Redensyl, 2% BHA, 10% Urea, 1% Salicylic Acid, 4% AHA-BHA, Biotin). "
        "Active personal care fundamentally depends on accurate concern-to-product matching and disciplined multi-month adherence. When customers select the wrong active, use it at an incorrect frequency, or abandon it prematurely due to milestone blindness, "
        "brand trust and customer lifetime value (LTV) collapse. Building an intelligent, honest decision and expectation layer through technology is the single highest-leverage retention driver for the brand."
    )
    p_b.paragraph_format.space_after = Pt(6)

    # 2. Primary Customer Conversations
    add_h1("2. Customer Conversations & Key Insights (Primary Research)")
    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "We conducted primary customer research via direct interviews and Google Form surveys across active users of Mosaic brands. Each customer explicitly agreed to share their name, contact phone number, and feedback with Mosaic Wellness for this Fellowship application."
    )
    p_intro.paragraph_format.space_after = Pt(6)

    # Master Table of Primary Customers
    tbl_cust = doc.add_table(rows=7, cols=6)
    tbl_cust.alignment = WD_TABLE_ALIGNMENT.CENTER
    cust_headers = ["Customer & Contact", "Product & Duration", "Why Chosen", "What Worked (Likes)", "What Struggled (Dislikes)", "Customer Wishlist / Needed Solution"]
    
    for c_idx, h_text in enumerate(cust_headers):
        cell = tbl_cust.rows[0].cells[c_idx]
        cell.text = h_text
        set_cell_background(cell, "1A382B")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    cust_data = [
        ("Sonika\n+91 9463747241\n(Consent: Yes)", "Be Bodywise Hair Care Product\n(~5 Months)", "Instagram ad + positive reviews + friend recommendation.", "Ordering was very smooth, easy, and convenient.", "Guidance vacuum post-checkout; didn't know correct frequency or whether using right; unhelpful support.", "\"It would be nice to have an AI assistant which can guide customers after purchase, answer product-related questions and track their progress.\""),
        ("Nikhil\n+91 9549197684\n(Consent: Yes)", "Be Bodywise Hair Growth Gummies\n(2–3 Months)", "Persistent hair fall; gummies felt easier than pills.", "Great taste; enjoyable gummy format makes daily intake effortless.", "Zero visible hairfall difference after 60–90 days; occasionally forgets dose; milestone ambiguity; feels expensive.", "\"Agar koi feature hota jahan hum apna daily consumption aur hair growth track kar sakein toh better hota. At least pata toh chale ki product actually work kar raha hai ya nahi.\""),
        ("Karamjit\n+91 9041061840\n(Consent: Yes)", "Be Bodywise 2% BHA Acne Spray\n(1 Month)", "Promotional ads and introductory discounts.", "360° spray nozzle clears back acne easily without assistance.", "Leaves a tacky/sticky skin residue after application; triggered relentless automated WhatsApp/SMS promotional spam.", "Texture refinement to eliminate tackiness; immediate opt-out option for promotional marketing spam."),
        ("Renu Rishi\n+91 9465073899\n(Consent: Yes)", "Be Bodywise 10% Urea Body Lotion\n(2 Months)", "Recommended on Reddit r/IndianSkincareAddicts as elegant pharmacy urea alternative.", "Noticeable, visible smoothing of rough arm skin texture and bumpiness within two weeks of daily use.", "None on efficacy; requested bundled routine offerings with body washes.", "Clear routine pairing guides demonstrating how 10% Urea complements daily cleansing body washes."),
        ("Sudarshan\n+91 9464728747\n(Consent: Yes)", "Little Joys Product (Mosaic Portfolio)\n(~2 Months)", "Seeking healthy, child-friendly nutritional supplements.", "Child consumed without resistance; pleasant taste.", "Price feels somewhat high for ongoing daily consumption.", "Better subscription pricing tiers and recurring loyalty discounts for multi-month adherence."),
        ("(Anonymous Survey Respondent)", "Be Bodywise Body Lotion\n(3–4 Months)", "Skincare community recommendations.", "Good skin moisturisation and barrier feel.", "Little expensive compared to mass brands; pump packaging can be improved.", "Continued educational advocacy and value packs.")
    ]

    for r_idx, row_data in enumerate(cust_data, 1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_cust.rows[r_idx].cells[c_idx]
            cell.text = val
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            if r_idx % 2 == 1:
                set_cell_background(cell, "FAFBF9")
            p = cell.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(7.5)
                r.font.color.rgb = COLOR_DARK
                if c_idx == 0:
                    r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Secondary Research Base
    add_h1("3. Secondary Research Base (Online Community Triangulation)")
    p_sec = doc.add_paragraph()
    p_sec.add_run(
        "To ensure our primary interviews reflected broader customer behavior, we triangulated our findings against publicly documented customer discussions across Reddit (r/IndianSkincareAddicts, r/IndianBeautyTalks), Apple App Store, and Google Play Store:\n\n"
        "• u/st4rbaby999 (Reddit): Used Hair Growth Roll-On Serum for 2 months (finished 2 bottles). Saw zero visible results, felt spend was wasted, and resolved not to repurchase.\n"
        "• u/VacationHead2226 (Reddit): Used Rosemary + Redensyl serum for >1 month. Noticed baby hair at hairline, but felt middle parting looked wider. Panicked over transient shedding and questioned whether to quit.\n"
        "• u/ITS-NEVER-2-LATE (Reddit): Used 4% AHA-BHA Underarm Roll-On. Odor control lasted only 2–3 hours; zero pigmentation lightening after 2–3 months of daily use.\n"
        "• Durva Khandeparkar (Google Play): Praised app UI, but explicitly pleaded for an in-app product review section so buyers can read honest product reviews before purchasing.\n"
        "• neha khatoon & Anjalika Patnaik (App Store): Orders delayed multiple days; couriers gave 1-second missed calls and falsely marked customers unreachable.\n\n"
        "Triangulation Insight: Sonika's direct plea for an AI routine assistant matches Durva's review asking for transparent in-app guidance; Nikhil's milestone uncertainty mirrors u/st4rbaby999 quitting at month two; Karamjit's tacky residue report mirrors u/ITS-NEVER-2-LATE's roll-on experience."
    )
    p_sec.paragraph_format.space_after = Pt(6)

    # 4. Patterns Noticed
    add_h1("4. Patterns Noticed Across Conversations")
    p_pat = doc.add_paragraph()
    p_pat.add_run(
        "1. Post-Purchase Guidance Vacuum: Sonika explicitly stated she didn't know how frequently to use the product or whether she was using it correctly, requesting an AI assistant. Once checkout finishes, customers feel abandoned.\n"
        "2. The 60-Day \"Efficacy Blindspot\": Both Nikhil (Gummies) and u/st4rbaby999 (Serum) reached month two without knowing whether follicle nutrition was working. Biological renewal takes 90–120 days; silence from the brand during this window leads to premature routine abandonment.\n"
        "3. Format Innovation vs. Sensory Trade-offs: Karamjit praised the 360° spray for reaching back acne but struggled with tacky residue; Nikhil loved gummies but feared recurring cost. Innovative formats drive acquisition, but sensory expectations must be framed accurately.\n"
        "4. Active Specificity vs. Routine Pairing: Renu Rishi achieved rapid bump reduction in 2 weeks with 10% Urea because the active matched her exact condition; when actives are misaligned or used without routine context, dissatisfaction is guaranteed."
    )
    p_pat.paragraph_format.space_after = Pt(6)

    # 5. Root Cause Analysis
    add_h1("5. What is Driving the Problem (Root Cause & Broader CX)")
    p_rc = doc.add_paragraph()
    p_rc.add_run(
        "• Biological Realities vs. Marketing Timelines: Clinical actives operate on cellular schedules (follicle cycles take 90–120 days; epidermal renewal takes 28–45 days). Digital marketing emphasizes rapid gratification. When the brand provides no milestone roadmap, the customer assumes failure at Day 45.\n"
        "• Catalog Navigational Complexity: Be Bodywise has expanded to 100+ active SKUs across hair, face, body, and underarms. A consumer cannot easily discern whether rough skin requires 1% Salicylic Acid, 10% Urea, 10% AHA scrub, or 2% BHA spray.\n"
        "• Disconnected Post-Purchase Experience: Once payment clears, touchpoints collapse into automated shipping SMS and promotional WhatsApp marketing (which Karamjit noted causes annoyance). There is no guided routine assistant."
    )
    p_rc.paragraph_format.space_after = Pt(6)

    # 6. Candidate Problems Considered
    add_h1("6. Candidate Problems Considered & Evaluation")
    tbl_eval = doc.add_table(rows=6, cols=4)
    tbl_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Problem Domain", "Observed Friction", "Tech Feasibility", "Strategic Verdict"]
    
    for c_idx, h_text in enumerate(headers):
        cell = tbl_eval.rows[0].cells[c_idx]
        cell.text = h_text
        set_cell_background(cell, "1A382B")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    eval_data = [
        ("1. Last-Mile 3PL Delivery Failures", "Delayed shipments, false missed calls, cancelled orders.", "Low (Physical 3PL operations)", "REJECTED: Courier operations issue, not an AI software builder challenge."),
        ("2. Customer Support Ticket SLAs", "Closed tickets without answer, agent CSAT pressuring.", "Low (Human CS operations)", "REJECTED: Requires internal staffing/CRM restructuring, not customer software."),
        ("3. Marketplace Authenticity & QC", "Near-expiry batches on Fruugo/Amazon, packaging desync.", "Medium (QR lookup / batch DB)", "REJECTED: Solves an edge case for 3rd party resellers, not core direct journey."),
        ("4. Marketing Communication Fatigue", "Relentless WhatsApp/SMS marketing spam (Karamjit feedback).", "Medium (SMS opt-out dashboard)", "PARTIALLY MERGED: Addressed in app design via transparent privacy and zero spam."),
        ("5. PRE-PURCHASE INTENT-TO-PRODUCT FIT & POST-PURCHASE GUIDANCE VACUUM", "Misaligned product selection, 60-day milestone blindness, guidance vacuum (Sonika, Nikhil).", "VERY HIGH (AI Intent Parsing + Deterministic Rules)", "SELECTED: Directly requested by customers; solves root cause of wrong product selection and routine abandonment.")
    ]

    for r_idx, row_data in enumerate(eval_data, 1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_eval.rows[r_idx].cells[c_idx]
            cell.text = val
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            if r_idx == 5:
                set_cell_background(cell, "EAF2EC")
            p = cell.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(7.5)
                r.font.color.rgb = COLOR_PRIMARY if r_idx == 5 else COLOR_DARK
                if r_idx == 5 or c_idx == 3:
                    r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 7. The One Problem Chosen
    add_h1("7. The One Problem Chosen to Solve")
    tbl_ps = doc.add_table(rows=1, cols=1)
    tbl_ps.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_ps = tbl_ps.rows[0].cells[0]
    set_cell_background(cell_ps, "1A382B")
    set_cell_margins(cell_ps, top=140, bottom=140, left=180, right=180)
    p_ps = cell_ps.paragraphs[0]
    r_ps_lbl = p_ps.add_run("DEFINITIVE PROBLEM STATEMENT:\n")
    r_ps_lbl.font.size = Pt(9.5)
    r_ps_lbl.font.bold = True
    r_ps_lbl.font.color.rgb = RGBColor(212, 231, 158)
    
    r_ps_txt = p_ps.add_run(
        "\"Be Bodywise customers struggle to select the right clinical active for their specific concern from a crowded 100+ product catalogue, "
        "and after purchasing face a complete guidance vacuum, unassisted adherence fatigue, and 60-day milestone blindness—leading to premature routine abandonment before biological results can take effect.\""
    )
    r_ps_txt.font.size = Pt(10.5)
    r_ps_txt.font.bold = True
    r_ps_txt.font.color.rgb = RGBColor(255, 255, 255)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 8. Why This Problem Over Others
    add_h1("8. Why We Chose This Problem Over Others")
    p_why = doc.add_paragraph()
    p_why.add_run(
        "1. Direct Customer Mandate: This problem was directly articulated by our primary respondents. Sonika requested an AI assistant to guide post-purchase usage and track progress; Nikhil requested consumption tracking and milestone roadmaps.\n"
        "2. Direct Lever on Customer Lifetime Value (LTV): In personal care, business sustainability depends on month-3 and month-6 retention. Acquiring customers who quit at Day 45 destroys marketing efficiency. Solving expectation alignment unlocks repeat purchase habits.\n"
        "3. Zero Medical Hallucination Safeguard: Medical diagnosis is irresponsible and unsafe for consumer software. However, honest, deterministic goal-to-catalogue matching (grounded strictly in published clinical labels and verified facts) bridges the knowledge gap safely without overpromising medical cures.\n"
        "4. High Technology & AI Leverage: Large Language Models excel at interpreting unstructured, emotional human intent (e.g. \"my hair is falling and arms have bumps\"), while pure TypeScript deterministic rules engines excel at matching those requirements against verified catalog facts with zero hallucinations."
    )
    p_why.paragraph_format.space_after = Pt(6)

    # 9. Connection to Part 2 Solution
    add_h1("9. Connecting Part 1 Research to Part 2 Solution: \"Bodywise Match\"")
    p_sol = doc.add_paragraph()
    p_sol.add_run(
        "To address this validated problem statement, we designed, engineered, and deployed Bodywise Match:\n\n"
        "• One-Line Promise: \"Find a product that fits your goal, understand what other customers report, and know what to do if the experience goes wrong.\"\n"
        "• Live Production URL: https://bodywise-match-x5hd.vercel.app\n"
        "• Open-Source GitHub Repository: https://github.com/AnshulKaushal27/bodywise-match\n\n"
        "Key Capabilities Built to Solve the Customer Pains:\n"
        "1. AI Interprets, Rules Decide: Directly fulfills Sonika's request for an AI guide. LLM or keyword parsing extracts structured needs into strict Zod schemas; product ranking and exclusions are pure deterministic TypeScript.\n"
        "2. Expectation & Milestone Transparency: Fulfills Nikhil's demand for milestone timelines. Match cards explain biological timelines (e.g. 90–120 days for hair renewal) and format trade-offs before purchase.\n"
        "3. Fact Integrity & Provenance: Every single product fact across the catalogue includes provenance (source URL and last_verified_at timestamp). Unverified fields remain null (\"Not verified yet\").\n"
        "4. Order & Product Issue Helper: Guided checklists and direct routes to official support channels for delivery, packaging, or communication issues.\n"
        "5. Privacy First & Zero Spam: Zero mandatory signup, zero spam, fastify logger body redaction, and strict WCAG AA contrast compliance."
    )
    p_sol.paragraph_format.space_after = Pt(6)

    # 10. Conclusion
    add_h1("10. Conclusion")
    p_c = doc.add_paragraph()
    p_c.add_run(
        "Our customer research demonstrates that the most urgent unlock for Be Bodywise is not top-of-funnel customer acquisition, but protecting customer trust between Day 0 and Day 90. "
        "By introducing an intelligent decision and expectation layer like Bodywise Match, Mosaic Wellness can eliminate premature churn, lower refund friction, and establish Be Bodywise as India's most trusted digital wellness brand.\n\n"
        "Submitted with respect by Anshul Kaushal for the Mosaic Wellness Fellowship Builder Challenge (2027 Batch)."
    )

    output_path = "Mosaic_Fellowship_Materials/Mosaic_Fellowship_Part1_Submission.docx"
    doc.save(output_path)
    print(f"Successfully created: {output_path}")

if __name__ == "__main__":
    create_document()
