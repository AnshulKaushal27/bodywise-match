-- =======================================================================
-- Bodywise Match: Initial Database Schema (Supabase & PostgreSQL)
-- Monorepo Migration: 20261118000001_initial_catalogue_schema.sql
-- =======================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    official_name TEXT NOT NULL,
    brand_line TEXT NOT NULL DEFAULT 'Be Bodywise',
    category TEXT NOT NULL CHECK (
        category IN ('body_wash', 'face_wash', 'serum', 'shampoo', 'conditioner', 'hair_oil', 'supplement', 'sunscreen', 'other')
    ),
    supported_goals TEXT[] NOT NULL DEFAULT '{}',
    format TEXT NOT NULL,
    size TEXT NOT NULL,
    official_description TEXT NOT NULL,
    label_directions TEXT NOT NULL,
    ingredients TEXT[] DEFAULT NULL,
    cautions TEXT[] DEFAULT NULL,
    fragrance_free BOOLEAN DEFAULT NULL,
    suitable_for TEXT[] DEFAULT NULL,
    price_inr NUMERIC(10, 2) DEFAULT NULL,
    price_source TEXT DEFAULT NULL,
    price_checked_at TIMESTAMPTZ DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    image_source TEXT DEFAULT NULL,
    image_license TEXT DEFAULT NULL,
    source_url TEXT DEFAULT NULL,
    last_verified_at DATE DEFAULT NULL,
    catalog_version TEXT NOT NULL DEFAULT '0.1.0-draft',
    is_demo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Fact integrity constraint (Rule 3)
    CONSTRAINT check_verified_provenance CHECK (
        is_demo = true OR (source_url IS NOT NULL AND last_verified_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_supported_goals ON products USING GIN(supported_goals);

-- -----------------------------------------------------------------------
-- 2. MATCH_SESSIONS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    primary_goal TEXT,
    identified_category TEXT,
    status TEXT NOT NULL DEFAULT 'started' CHECK (
        status IN ('started', 'parsed', 'clarifying', 'shortlisted', 'completed', 'abandoned')
    ),
    client_ip_hash TEXT,
    user_agent_category TEXT
);

CREATE INDEX IF NOT EXISTS idx_match_sessions_status ON match_sessions(status);
CREATE INDEX IF NOT EXISTS idx_match_sessions_created_at ON match_sessions(created_at);

-- -----------------------------------------------------------------------
-- 3. MATCH_ANSWERS TABLE (One clarifying question at a time)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    question_text TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_answers_session_id ON match_answers(session_id);

-- -----------------------------------------------------------------------
-- 4. RECOMMENDATIONS TABLE (2-3 explained product matches)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    rank SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 3),
    relevance_explanation TEXT NOT NULL,
    reason_codes TEXT[] NOT NULL DEFAULT '{}',
    safety_caveats TEXT[] DEFAULT '{}',
    caution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_session_id ON recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_product_id ON recommendations(product_id);

-- -----------------------------------------------------------------------
-- 5. PREFERENCE_FEEDBACK TABLE (Optional customer feedback)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preference_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    rating_clarity SMALLINT CHECK (rating_clarity BETWEEN 1 AND 5),
    chosen_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    feedback_category TEXT NOT NULL CHECK (
        feedback_category IN ('match_relevance', 'clarity', 'missing_product', 'safety_concern', 'other')
    ),
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preference_feedback_session ON preference_feedback(session_id);

-- -----------------------------------------------------------------------
-- 6. ISSUE_GUIDES TABLE ("Know what to do if experience goes wrong")
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issue_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type TEXT NOT NULL UNIQUE CHECK (
        issue_type IN ('delivery_delay', 'skin_reaction', 'wrong_or_damaged_item', 'near_expiry_batch', 'authenticity_concern', 'billing_confusion')
    ),
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('routine', 'advisory', 'urgent')),
    actionable_steps TEXT[] NOT NULL DEFAULT '{}',
    official_contact_route TEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------
-- 7. CONSENTS TABLE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
    consent_type TEXT NOT NULL CHECK (
        consent_type IN ('terms_of_use', 'privacy_notice', 'research_participation', 'anonymous_metrics')
    ),
    consented BOOLEAN NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_hash TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_consents_session_id ON consents(session_id);

-- -----------------------------------------------------------------------
-- 8. EXPERIENCES TABLE
-- NOTE: Absolutely NO contact fields (no name, email, or phone)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    duration_used TEXT NOT NULL,
    observed_outcome TEXT NOT NULL,
    texture_feedback TEXT,
    skin_or_hair_profile TEXT,
    publication_consent BOOLEAN NOT NULL DEFAULT false,
    moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        moderation_status IN ('pending', 'approved', 'rejected')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_product ON experiences(product_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(moderation_status) WHERE publication_consent = true;

-- -----------------------------------------------------------------------
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preference_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read
CREATE POLICY "Public products read access"
    ON products FOR SELECT
    USING (true);

-- Issue Guides: Everyone can read
CREATE POLICY "Public issue guides read access"
    ON issue_guides FOR SELECT
    USING (true);

-- Experiences: Only approved and consented experiences are publicly readable
CREATE POLICY "Public approved experiences read access"
    ON experiences FOR SELECT
    USING (publication_consent = true AND moderation_status = 'approved');

-- Experiences: Anyone can submit an experience
CREATE POLICY "Public experience submission"
    ON experiences FOR INSERT
    WITH CHECK (true);

-- Match Sessions & Answers: Insert allowed for anonymous users
CREATE POLICY "Anonymous match session creation"
    ON match_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anonymous match answer creation"
    ON match_answers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anonymous recommendation creation"
    ON recommendations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anonymous feedback submission"
    ON preference_feedback FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anonymous consent record creation"
    ON consents FOR INSERT
    WITH CHECK (true);
