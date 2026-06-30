# ROADMAP.md

Development phases for the project. Each phase has a clear goal and a hard scope boundary — don't build ahead into the next phase.

When working with a coding agent, always specify which phase is active so it doesn't over-engineer or pull in features from later phases.

---

## Phase 1 — Foundation
**Goal**: Repo is set up, the app runs locally, a user can sign up and log in.

- Monorepo scaffold (`/frontend`, `/backend`)
- Base configs: ESLint, Prettier, ruff, pytest, Playwright
- Supabase project setup: Auth enabled, RLS on from day one
- Database migrations for all tables defined in `SCHEMA.md`
- Backend: FastAPI app skeleton, Supabase client, JWT middleware
- Frontend: Vite + React + Tailwind setup, routing, auth pages (signup, login, logout)
- CI: GitHub Actions running lint + type checks on every push
- `.env.example` files for both `/frontend` and `/backend`

**Done when**: A user can create an account and log in. Nothing else.

---

## Phase 2 — PDF Upload & Transaction Pipeline
**Goal**: A user can upload a bank statement PDF and see their transactions categorized.

- Supabase Storage setup (with RLS policies for PDFs)
- MarkItDown integration: PDF → Markdown
- DSPy pipeline: extract transactions from Markdown + categorize with LLM
- `merchant_category_rules` applied before LLM call when merchant is known
- PDF size check: sync flow under 5MB/20 pages, async (Redis queue) above threshold
- `exchange_rates` daily fetch from BCRA API + Redis cache
- API endpoints: `POST /v1/accounts/upload-statement`, `GET /v1/accounts/upload-statement/{job_id}`
- Frontend: upload screen, loading state, transaction list view with categories
- pytest: full coverage on parsing and categorization logic
- Playwright: upload flow end-to-end test

**Done when**: A user can upload a real PDF from any Argentine wallet and see categorized transactions.

---

## Phase 3 — Dashboard & Spending Summary
**Goal**: A user gets actual value from the app — not just a list of transactions, but insight into their spending.

- `GET /v1/transactions/summary` endpoint (totals by category, by period)
- Dashboard UI: spending breakdown by category, month-over-month comparison
- Currency toggle: view totals consolidated in ARS or split by currency
- Manual transaction editing (any field), with audit trail in `transaction_edits`
- User category correction → saved to `merchant_category_rules` automatically
- Custom categories (user-created, beyond predefined ones)

**Done when**: A user can upload their statements and understand where their money went last month.

---

## Phase 4 — Mercado Pago Integration
**Goal**: Transactions sync automatically without the user having to upload anything.

- Mercado Pago OAuth flow (connect/disconnect account)
- Polling cron job (every 15-30 min) to sync new transactions
- "Sync now" manual trigger endpoint + UI button
- `is_transfer` detection for movements between own accounts
- Deduplication logic (avoid inserting the same transaction twice on re-sync)

**Done when**: A connected Mercado Pago account syncs transactions automatically.

---

## Phase 5 — Goals & Alerts
**Goal**: The app becomes proactive — not just reporting what happened, but helping the user act.

- Goals: create, track progress, link to category or standalone
- Alerts: category spending limits, unusual spending detection
- AI-powered recommendations: "You spent 40% more on delivery than last month", "At this rate you'll reach your Brazil goal in X months"
- Spending projections to end of month based on current rhythm

**Done when**: A user gets a useful recommendation or alert without having to ask for it.

---

## Phase 6 — Polish & Deploy
**Goal**: The app is production-ready and publicly accessible as a portfolio piece.

- Vercel deployment (frontend + FastAPI serverless functions)
- Environment variables configured in Vercel dashboard
- Sentry integration for backend error tracking
- Performance: Redis caching for dashboard queries
- UI polish: empty states, error states, loading skeletons
- README with project description, setup instructions, and demo screenshots

**Done when**: The app is live on Vercel and presentable as a portfolio project.

---

## Out of scope (for now)

These are good ideas but explicitly not in any current phase — don't implement until a phase is opened for them:

- Native mobile app
- Multi-user / family accounts
- CSV export
- Bank account integration (CBU/home banking scraping)
- Notifications via email or push
