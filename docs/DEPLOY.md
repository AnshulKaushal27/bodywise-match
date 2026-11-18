# Bodywise Match — Production Deployment Runbook

This runbook provides complete, step-by-step instructions for deploying the **Bodywise Match** monorepo to production across **Vercel** (`apps/web`), **Render** (`apps/api`), and **Supabase** (PostgreSQL).

---

## 1. System Architecture & Constraints

```
┌────────────────────────────────────────────────────────┐
│                   Vercel (apps/web)                    │
│   Next.js 14 App Router (Edge CDN, Static Generation)  │
│   Environment: NEXT_PUBLIC_API_URL                     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS REST calls
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Render (apps/api)                    │
│   Fastify 4 + Node.js (Docker/Native Container)        │
│   Ports: 10000 | Health: /health                       │
│   NOTE: Free tier sleeps after 15m idle (cold start).  │
│   Filesystem is EPHEMERAL: Never write files to disk.  │
└──────────────────────────┬─────────────────────────────┘
                           │ Pooled Connection (Port 6543)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database              │
│   PgBouncer / Supavisor Connection Pooler (Port 6543)  │
│   RLS policies active & request redaction enforced     │
└────────────────────────────────────────────────────────┘
```

### Critical Operational Constraints
1. **Render Free Tier Sleep & Cold Starts:** Free web services sleep after 15 minutes of inactivity. Cold start spin-up takes **30–60 seconds**. The frontend (`apps/web`) gracefully handles cold starts with an animated countdown retry state and autonomous client-side deterministic matching fallback.
2. **Ephemeral Disk (Rule 8 Privacy First):** Render container storage is non-persistent and wiped on restart. Fastify never writes user sessions, uploaded files, or logs to disk. The Fastify logger streams to `stdout` with user request bodies strictly redacted.
3. **Supabase Connection Pooling (Port 6543):** Web containers on Render and serverless instances on Vercel dynamically scale. Connecting directly via port `5432` quickly exhausts Postgres `max_connections`. You **must** configure the pooled connection string on port `6543` (`pooler.supabase.com` with `?pgbouncer=true`).
4. **Single-Session Value (Rule 1):** Zero user accounts or logins exist. All user sessions are anonymous and can be exported or purged instantly at `/privacy/data`.

---

## 2. Step-by-Step Deployment Guide

### Step 2.1: Supabase PostgreSQL Setup

1. **Create Supabase Project:**
   - Log in to [Supabase](https://supabase.com) and create a new project named `bodywise-match-prod`.
   - Select the AWS region closest to your Render API region (e.g., `us-west-1` Oregon).
   - Set a strong database password and store it securely.

2. **Retrieve the Pooled Connection String (Port 6543):**
   - Navigate to **Project Settings** &rarr; **Database** &rarr; **Connection String**.
   - Under the **Connection pooling** tab (Supavisor / PgBouncer), select **Node.js** or **URI**.
   - Ensure the port in the URI is **`6543`** (not `5432`):
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

3. **Execute Schema Migrations:**
   - **Option A (Automated CLI Script):**
     Set your `DATABASE_URL` in `.env` and execute:
     ```bash
     pnpm db:migrate
     ```
     The migration script connects via SSL, runs `supabase/migrations/20261118000001_initial_catalogue_schema.sql` inside a transaction, and verifies the 8 core tables (`products`, `match_sessions`, `match_answers`, `recommendations`, `preference_feedback`, `issue_guides`, `experiences`, `consents`).
   - **Option B (Supabase SQL Editor):**
     Open the Supabase dashboard SQL Editor, paste the contents of `supabase/migrations/20261118000001_initial_catalogue_schema.sql`, and click **Run**.

4. **Seed Catalogue & Experience Data:**
   - **Option A (Automated CLI Script):**
     ```bash
     pnpm db:seed
     ```
     Inserts 9 verified demo products and 16 customer experience records with `is_demo = true`.
   - **Option B (Supabase SQL Editor):**
     Paste `supabase/seed.sql` into the Supabase SQL Editor and click **Run**.

---

### Step 2.2: Render API Deployment (`apps/api`)

1. **Connect Repository to Render:**
   - Log in to [Render](https://render.com) and click **New +** &rarr; **Blueprint** (or **Web Service**).
   - Connect your GitHub repository `Mosaic`. Render will detect `render.yaml`.

2. **Verify Service Settings:**
   - **Name:** `bodywise-match-api`
   - **Environment:** `Node`
   - **Plan:** `Free`
   - **Region:** `Oregon`
   - **Build Command:**
     ```bash
     pnpm install && pnpm --filter @bodywise/shared build && pnpm --filter @bodywise/api build
     ```
   - **Start Command:**
     ```bash
     pnpm --filter @bodywise/api start
     ```
   - **Health Check Path:** `/health`

3. **Configure Environment Variables in Render Dashboard:**
   In your Web Service settings, add the following environment variables:

   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `10000` | Render standard port |
   | `HOST` | `0.0.0.0` | Binds to all interfaces |
   | `CORS_ORIGINS` | `https://bodywise-match.vercel.app,https://bodywise-match-preview.vercel.app` | Comma-separated allowed frontend origins |
   | `RATE_LIMIT` | `100` | Requests per minute per IP |
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | **Must use pooled port 6543** |
   | `GROQ_API_KEY` | *(Optional)* `gsk_...` | Groq API key for optional intent extraction. Never log or commit. |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model for intent extraction (or active equivalent) |
   | `GROQ_FAST_MODEL` | `llama-3.1-8b-instant` | Lightweight model for reason rewrites |
   | `LLM_ENABLED` | `true` | Set to `false` to disable LLM calls completely |
   | `LLM_TIMEOUT_MS` | `8000` | AbortController timeout (8s) |
   | `LLM_MAX_INPUT_CHARS` | `1500` | User input character cap before transmission |
   | `LLM_DAILY_CAP` | `500` | Global daily LLM request cap |

   > [!NOTE]
   > **Groq Rate Limits & Deterministic Rules Fallback:**
   > Groq free-tier rate limits apply (requests per minute and tokens per minute). When `GROQ_API_KEY` is unset, `LLM_ENABLED=false`, a 429 rate limit is encountered, or the daily request quota (`LLM_DAILY_CAP`) is reached, the system **silently and automatically falls back to the deterministic TypeScript rules parser**. The application never fails or displays an error screen to the user. On the confirm screen, the provenance tag transparently updates from `"Interpreted with AI, please check"` to `"Interpreted with rules"`.

4. **Verify Deployment Health:**
   Once Render builds and deploys, test the health check:
   ```bash
   curl -s https://bodywise-match-api.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "bodywise-match-api",
     "version": "0.1.0",
     "rules_version": "1.0.0",
     "catalogue_version": "0.1.0-draft",
     "database": "configured",
     "llm": "deterministic_only",
     "ephemeral_disk": true,
     "uptime": 45,
     "timestamp": "2026-11-18T12:00:00.000Z"
   }
   ```

---

### Step 2.3: Vercel Web Deployment (`apps/web`)

1. **Connect Repository to Vercel:**
   - Log in to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
   - Import your GitHub repository `Mosaic`.

2. **Configure Project Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `.` (or `apps/web` if deploying standalone)
   - **Build Command:**
     ```bash
     pnpm --filter @bodywise/shared build && pnpm --filter @bodywise/web build
     ```
   - **Output Directory:** `apps/web/.next`
   - **Install Command:** `pnpm install`

3. **Configure Environment Variables (Separate Preview vs Production):**
   In **Project Settings** &rarr; **Environment Variables**, configure distinct values:

   - **Production Environment (`Production`):**
     - `NEXT_PUBLIC_APP_ENV`: `production`
     - `NEXT_PUBLIC_API_URL`: `https://bodywise-match-api.onrender.com`

   - **Preview Environment (`Preview` & `Development`):**
     - `NEXT_PUBLIC_APP_ENV`: `preview`
     - `NEXT_PUBLIC_API_URL`: `https://bodywise-match-api-staging.onrender.com` (or production API with CORS enabled)

4. **Deploy:**
   - Click **Deploy**. Vercel will build the shared package, compile all 39 static Next.js routes, and deploy to edge regions.
   - Verify security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`) are served.

---

## 3. Pre-Launch Checklist (Mandatory Quality Gates)

Execute every item on this checklist prior to announcing launch or presenting the submission:

- [ ] **1. Catalogue Facts Provenance (Rule 3 & 4):**
  - Run `pnpm catalogue:validate` to ensure zero missing schemas.
  - Verify every product has `source_url` and `last_verified_at` or displays `"Not verified yet"`.
  - Confirm every sample item displays the lime `"Demo data"` badge.
- [ ] **2. Support Links Verification:**
  - Open `packages/shared/src/data/support-links.ts`.
  - Confirm all official contact routes (WhatsApp, Email, Escalation) have verified URLs and current `last_checked` dates.
- [ ] **3. Mobile Logged-Out Experience:**
  - Load the deployed Vercel URL on a mobile device or responsive viewport ($390 \times 844$).
  - Confirm zero signup prompts, zero cookies required, and complete value delivery in one session.
- [ ] **4. Cold Start & Offline Resiliency:**
  - Force-sleep or test the Render API during cold start.
  - Confirm the frontend displays the friendly 60-second "API waking up" retry countdown.
  - Confirm client-side deterministic fallback functions cleanly without freezing or blank screens.
- [ ] **5. Test with LLM Disabled:**
  - Ensure the API operates with `LLM_API_KEY` unset. Strategy A deterministic keyword/regex parser must handle 100% of product discovery requests.
- [ ] **6. Content & Medical Safety Linter:**
  - Run `pnpm safety:lint`.
  - Assert zero forbidden phrases (`cure`, `treats`, `diagnose`, `guaranteed`, `% effective`, `92% match`) exist across rendered views.
- [ ] **7. Full Test Suite & E2E Validation:**
  - Run `pnpm test` (All 260+ Vitest tests pass).
  - Run `pnpm test:e2e` (All 16 Playwright tests pass on Desktop and Mobile).
  - Run `pnpm typecheck` (Strict TypeScript across monorepo).
- [ ] **8. System Status Page:**
  - Visit `/status` on the deployed web app.
  - Confirm green operational telemetry: `RULES_VERSION: 1.0.0`, `CATALOGUE_VERSION: 0.1.0-draft`, latency $< 150\text{ms}$.

---

## 4. Rollback Procedures

If an incident occurs post-deployment, follow these immediate rollback steps:

### Rollback Frontend (Vercel)
1. Open the [Vercel Dashboard](https://vercel.com) &rarr; **Deployments**.
2. Locate the previous known-good deployment commit.
3. Click the three dots `...` &rarr; **Instant Rollback**.
4. The production domain will instantly switch back within seconds without rebuilding.

### Rollback Backend API (Render)
1. Open the [Render Dashboard](https://render.com) &rarr; `bodywise-match-api` service.
2. Go to **Events** / **Deploy History**.
3. Select the previous stable build and click **Rollback to this deploy**.
4. Render will redeploy that exact container image.

### Rollback Database (Supabase)
1. If a migration needs reversal:
   - Connect using the direct URL or Supabase SQL Editor.
   - Schema tables can be rolled back using:
     ```sql
     DROP TABLE IF EXISTS consents CASCADE;
     DROP TABLE IF EXISTS experiences CASCADE;
     DROP TABLE IF EXISTS issue_guides CASCADE;
     DROP TABLE IF EXISTS preference_feedback CASCADE;
     DROP TABLE IF EXISTS recommendations CASCADE;
     DROP TABLE IF EXISTS match_answers CASCADE;
     DROP TABLE IF EXISTS match_sessions CASCADE;
     DROP TABLE IF EXISTS products CASCADE;
     ```
   - Re-run `pnpm db:migrate` followed by `pnpm db:seed`.
2. Supabase Point-in-Time Recovery (PITR) is also available in Project Settings for enterprise rollback.

---

## 5. Ongoing Monitoring & Operations

- **Status Dashboard:** Always accessible at [`/status`](https://bodywise-match.vercel.app/status).
- **Privacy Purge Route:** Anonymous users can purge server and client session data at [`/privacy/data`](https://bodywise-match.vercel.app/privacy/data).
- **Fastify Health Endpoint:** Directly pingable at [`/health`](https://bodywise-match-api.onrender.com/health).
