-- =======================================================================
-- Bodywise Match: Supabase Seed Data
-- =======================================================================

-- 1. SEED DEMO PRODUCTS
-- TODO: Replace with verified Be Bodywise product facts from official sources before launch.
-- All items are flagged is_demo: true. Zero invented facts.

INSERT INTO products (
    id, slug, official_name, brand_line, category, supported_goals, format, size,
    official_description, label_directions, ingredients, cautions, fragrance_free,
    suitable_for, price_inr, price_source, price_checked_at, image_url, image_source,
    image_license, source_url, last_verified_at, catalog_version, is_demo
) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'demo-body-wash-a',
    'Demo Body Wash A',
    'Be Bodywise',
    'body_wash',
    ARRAY['body_bumps_look', 'gentle_daily_cleansing'],
    'Liquid Body Cleanser',
    '200ml',
    'Placeholder body wash formulated for daily gentle skin cleansing and texture exploration.',
    'Dispense onto wet palms or loofah, massage gently over wet body, and rinse thoroughly.',
    NULL,
    ARRAY['For external use only.', 'Avoid contact with eyes; rinse immediately if contact occurs.', 'Discontinue if redness or discomfort develops.'],
    NULL,
    ARRAY['all_skin_types'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000002',
    'demo-exfoliating-wash-b',
    'Demo Exfoliating Wash B',
    'Be Bodywise',
    'body_wash',
    ARRAY['rough_texture_smoothing', 'body_bumps_look'],
    'Active Cleansing Gel',
    '250ml',
    'Placeholder exfoliating body wash targeting areas with coarse feel or uneven surface texture.',
    'Apply onto problem areas, massage gently for 60 seconds, and rinse with lukewarm water.',
    NULL,
    ARRAY['Not recommended on broken skin or immediately after body shaving.', 'Follow with a moisturiser if dryness occurs.'],
    NULL,
    ARRAY['normal_to_oily_body_skin'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000003',
    'demo-hair-serum-c',
    'Demo Hair Serum C',
    'Be Bodywise',
    'serum',
    ARRAY['hair_density_appearance', 'hair_fall_appearance'],
    'Roll-On Scalp Serum',
    '50ml',
    'Placeholder targeted scalp rollerball serum designed for direct application along visible partings.',
    'Roll directly onto clean, dry scalp sections daily at night. Massage gently for one minute.',
    NULL,
    ARRAY['Do not apply to open cuts, abrasions, or sunburned scalp.', 'Early transient shedding in initial weeks may occur as hair cycle resets.'],
    NULL,
    ARRAY['thinning_hair_partings', 'scalp_focus'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000004',
    'demo-scalp-oil-d',
    'Demo Scalp Oil D',
    'Be Bodywise',
    'hair_oil',
    ARRAY['scalp_comfort', 'hair_fall_appearance'],
    'Lightweight Scalp Oil',
    '100ml',
    'Placeholder nourishing oil blend for pre-shampoo scalp massage and comfort.',
    'Section dry hair and apply several drops onto the scalp. Massage and leave on for at least 30 minutes before washing.',
    NULL,
    ARRAY['For topical scalp application only.', 'Patch test on forearm before full scalp use.'],
    NULL,
    ARRAY['dry_scalp', 'pre_wash_routine'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000005',
    'demo-underarm-roll-on-e',
    'Demo Underarm Roll-On E',
    'Be Bodywise',
    'serum',
    ARRAY['underarm_odor_freshness', 'underarm_texture_smoothing'],
    'Deodorant Serum Roll-On',
    '50ml',
    'Placeholder daily underarm roll-on combining daily odor freshness with mild topical exfoliating support.',
    'Glide roll-on once or twice over clean, dry underarms. Allow to air-dry for 30 seconds before dressing.',
    NULL,
    ARRAY['Do not apply on freshly waxed or irritated underarms.', 'Wait at least 24 hours after razor shaving before applying.'],
    NULL,
    ARRAY['daily_underarm_care'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000006',
    'demo-face-wash-f',
    'Demo Face Wash F',
    'Be Bodywise',
    'face_wash',
    ARRAY['oil_control', 'gentle_daily_cleansing'],
    'Balancing Gel Cleanser',
    '100ml',
    'Placeholder facial cleanser supporting daytime sebum balance without tight feeling.',
    'Pump a small amount into damp hands, massage onto face in gentle circular motions, and rinse thoroughly.',
    NULL,
    ARRAY['Avoid direct eye area.', 'In case of persistent dryness, reduce usage to once daily.'],
    NULL,
    ARRAY['combination_and_oily_skin'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000007',
    'demo-sunscreen-g',
    'Demo Sunscreen G',
    'Be Bodywise',
    'sunscreen',
    ARRAY['sun_protection', 'hydration_barrier'],
    'Broad Spectrum Fluid Cream',
    '50g',
    'Placeholder everyday broad-spectrum sunscreen protecting against UV exposure without heavy residue.',
    'Apply generously across face and exposed neck 15 minutes prior to sun exposure. Reapply every 2 hours outdoors.',
    NULL,
    ARRAY['Reapply after excessive sweating or towel drying.', 'Do not stay too long in the sun even while using sunscreen.'],
    NULL,
    ARRAY['daily_outdoor_protection'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000008',
    'demo-clarifying-shampoo-h',
    'Demo Clarifying Shampoo H',
    'Be Bodywise',
    'shampoo',
    ARRAY['scalp_clarifying', 'scalp_comfort'],
    'Clarifying Hair Cleanser',
    '200ml',
    'Placeholder hair shampoo removing product residue and environmental oil accumulation.',
    'Apply to wet hair and scalp, massage into a rich lather, leave for 1 minute, and rinse thoroughly.',
    NULL,
    ARRAY['For scalp and hair wash use only.', 'Avoid eye contact.'],
    NULL,
    ARRAY['oily_scalp', 'product_buildup'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
),
(
    'a1000000-0000-0000-0000-000000000009',
    'demo-hair-gummies-i',
    'Demo Hair Gummies I',
    'Be Bodywise',
    'supplement',
    ARRAY['hair_fall_appearance'],
    'Chewable Nutritional Gummies',
    '60 gummies',
    'Placeholder nutritional dietary supplement gummies with vitamins and minerals.',
    'Chew one gummy daily after any main meal. Do not exceed the stated recommended daily dose.',
    NULL,
    ARRAY['Dietary supplements must not be used as a substitute for a varied and balanced diet.', 'Consult a healthcare professional if pregnant or taking medication.'],
    NULL,
    ARRAY['adults_seeking_dietary_hair_support'],
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    '0.1.0-draft',
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED DEFAULT ISSUE GUIDES
INSERT INTO issue_guides (
    id, issue_type, title, severity, actionable_steps, official_contact_route, disclaimer
) VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'delivery_delay',
    'Order Delivery Delay or Shifting ETA',
    'routine',
    ARRAY[
        'Check your courier tracking URL sent via SMS/WhatsApp for the latest courier scan.',
        'If an order was falsely marked "Customer Unavailable", note the timestamp and do not accept any unauthorized cancellation fees.',
        'Reach out to verified customer care on WhatsApp (+91 86557 58196) with your Order ID.'
    ],
    'WhatsApp: +91 86557 58196 / Email: support@bebodywise.com',
    'Bodywise Match provides independent resolution guidance and does not represent live courier tracking.'
),
(
    'b1000000-0000-0000-0000-000000000002',
    'skin_reaction',
    'Unexpected Stinging, Burning, or Redness',
    'urgent',
    ARRAY[
        'Rinse the affected skin area immediately with cool running water for 2-3 minutes.',
        'Discontinue using the product and any other active chemical exfoliants or retinoids.',
        'Apply a basic bland barrier cream or aloe vera gel.',
        'If swelling, hives, or intense pain persists, consult a registered dermatologist promptly.'
    ],
    'Brand Support: support@bebodywise.com | Seek medical attention for severe reactions.',
    'This guide does not constitute medical diagnosis or clinical treatment.'
),
(
    'b1000000-0000-0000-0000-000000000003',
    'wrong_or_damaged_item',
    'Damaged, Leaking, or Incorrect Product Received',
    'routine',
    ARRAY[
        'Take clear photos of the outer shipping box, the shipping label, and the leaking/damaged item.',
        'Ensure the batch number printed near the crimp/base is visible in at least one photo.',
        'Contact WhatsApp support (+91 86557 58196) within 48 hours of delivery to initiate a replacement request.'
    ],
    'Official WhatsApp Replacement Desk: +91 86557 58196',
    'Replacements are subject to brand verification of parcel condition.'
),
(
    'b1000000-0000-0000-0000-000000000004',
    'near_expiry_batch',
    'Product Received Near Expiry Date',
    'advisory',
    ARRAY[
        'Check the Manufacturing Date (MFD) and Expiry Date (EXP) printed on the bottle label.',
        'If the product was delivered with less than 6 months of remaining shelf life, photograph the batch stamp.',
        'Request an exchange for a fresh batch via support@bebodywise.com quoting your delivery date.'
    ],
    'Customer Care Email: support@bebodywise.com',
    'Standard brand policy recommends requesting fresh batch replacements within 7 days of delivery.'
)
ON CONFLICT (issue_type) DO NOTHING;
