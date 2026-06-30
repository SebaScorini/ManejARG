# PROGRESS.md

Log of major project changes. Persistent memory across sessions — read this file in full at the start of any new work session.

Each new entry goes at the top (reverse chronological order).

---

<!--
Template for new entries:

## YYYY-MM-DD — Short title of the change

**What was done:**
Brief description of the implemented feature/change.

**Key files:**
- `path/to/file.ext` — what it does / what changed
- `path/to/other_file.ext` — what it does / what changed

**Decisions made:**
- Decision and why it was made this way

**Pending / next steps:**
- What's left for later

-->

---

---

## 2026-06-30 — Phase 1 scaffold implemented

**What was done:**
Created the Phase 1 foundation scaffold: monorepo root files, frontend Vite + React + Tailwind auth shell, backend FastAPI skeleton with JWT path, initial Supabase migration, and validation configs.

**Key files:**
- `frontend/` — auth pages, session context, dashboard placeholder, Vite/Tailwind/Playwright config
- `backend/` — FastAPI app, JWT middleware, auth dependency, health/me routes, pytest/ruff config
- `backend/supabase/migrations/0001_initial.sql` — initial schema from `SCHEMA.md`
- `package.json` / `pnpm-workspace.yaml` — workspace root

**Decisions made:**
- Supabase Auth is handled in the frontend for signup/login only; app data still flows through backend.
- Backend auth is scaffolded with a bearer-token path and a test override hook, keeping Phase 1 small and local.

**Pending / next steps:**
- Wire real Supabase project env values and verify auth against live project settings.
- Add Phase 1 CI workflow and any missing UI polish once the repo is ready for the next slice.

## 2026-06-30 — Closed remaining open questions

**What was done:**
Resolved the last open design decisions across `SCHEMA.md`, `ARCHITECTURE.md`, and `API.md` so implementation can start without ambiguity.

**Key files:**
- `SCHEMA.md` — added `exchange_rates` table (daily BCRA cache)
- `ARCHITECTURE.md` — updated Mercado Pago sync flow (polling, not webhook), PDF upload flow (sync/async threshold), multi-currency flow (daily cache, not live calls)
- `API.md` — added async job polling endpoint for large statement uploads

**Decisions made:**
- BCRA exchange rates: fetched once per day via scheduled job, stored in `exchange_rates` table, cached in Redis (24h TTL). Not fetched live per transaction.
- Mercado Pago auto-sync: polling via cron (start at 15-30 min interval), not webhook.
- PDF upload: synchronous under 5MB/20 pages, async (Redis queue) above that threshold.

**Pending / next steps:**
- Scaffold actual repo folder structure (`/frontend`, `/backend`)
- Start implementing: auth + accounts connection flow first
- Decide exact notification mechanism for async job completion during implementation (polling vs. websocket)

## 2026-06-30 — Architecture and API documentation

**What was done:**
Created `ARCHITECTURE.md` (system flows, diagrams, technical decisions) and `API.md` (backend endpoint contracts). Updated `AGENTS.md` to reference all docs instead of duplicating summaries that could go stale.

**Key files:**
- `ARCHITECTURE.md` — full system diagram, Mercado Pago sync flow, PDF upload flow (synchronous for MVP), categorization pipeline flow, multi-currency handling
- `API.md` — versioned REST contract (`/v1`), endpoints for accounts, transactions, categories, goals, alerts
- `AGENTS.md` — added "Project documentation" section pointing to SCHEMA.md, ARCHITECTURE.md, API.md, PROGRESS.md

**Decisions made:**
- Mercado Pago sync: both automatic (webhook/polling) and manual ("sync now" button)
- PDF upload flow is synchronous for MVP; async via Redis queue is the documented fallback if Vercel timeouts become an issue
- API versioned from the start (`/v1`) to avoid breaking changes later
- Pagination via limit/offset

**Pending / next steps:**
- Resolve open questions noted in SCHEMA.md/ARCHITECTURE.md (BCRA rate caching strategy, exact MP webhook payload, PDF size threshold for async fallback)
- Scaffold actual repo folder structure (`/frontend`, `/backend`)
- Start implementing: auth + accounts connection flow first

## 2026-06-30 — Initial project setup

**What was done:**
Defined stack, repo structure, and conventions. Created `AGENTS.md`. No code yet.

**Key files:**
- `AGENTS.md` — context and rules for coding agents

**Decisions made:**
- Monorepo with `/frontend` (Vite + React + TS) and `/backend` (FastAPI)
- Frontend never talks to Supabase directly; everything goes through the backend
- No RAG for the user's financial data
- PDF parsing (MarkItDown) lives in the backend, not in Edge Functions

**Pending / next steps:**
- Define `SCHEMA.md` with complete tables and RLS policies
- Set up initial repo folder structure
- Test MarkItDown against real bank statements
