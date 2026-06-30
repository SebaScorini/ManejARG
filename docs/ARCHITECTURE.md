# ARCHITECTURE.md

System architecture and technical decisions. Companion to `SCHEMA.md` (data model) and `AGENTS.md` (stack and rules).

## High-level flow

```
┌─────────────────┐
│   Mercado Pago   │
│   Official API   │
└────────┬─────────┘
         │ OAuth + webhook (auto) + manual "sync now" button
         ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                  │
│  (Vercel serverless functions)                │
│                                                │
│  ┌──────────────┐    ┌─────────────────────┐ │
│  │ PDF/CSV       │    │  Mercado Pago sync   │ │
│  │ upload        │    │  service             │ │
│  │ (sync)        │    │                      │ │
│  └──────┬───────┘    └──────────┬──────────┘ │
│         │                        │             │
│         ▼                        ▼             │
│  ┌──────────────┐         ┌──────────────┐   │
│  │  MarkItDown   │         │  Normalize    │   │
│  │  PDF → MD     │         │  to common    │   │
│  └──────┬───────┘         │  transaction   │   │
│         │                  │  shape         │   │
│         ▼                  └──────┬───────┘   │
│  ┌──────────────────────────────┐ │            │
│  │  DSPy categorization/         │◄┘            │
│  │  extraction pipeline          │              │
│  │  (checks merchant_category_   │              │
│  │   rules first, then LLM)      │              │
│  └──────────┬───────────────────┘              │
│             ▼                                   │
│  ┌──────────────────────────────┐              │
│  │  Write to `transactions`      │              │
│  │  (+ exchange rate if non-ARS) │              │
│  └──────────┬───────────────────┘              │
│             │                                   │
│  ┌──────────┴───────────┐                      │
│  │ Redis: cache, rate    │                      │
│  │ limiting, async queue │                      │
│  │ for heavy/slow tasks  │                      │
│  └───────────────────────┘                      │
│                                                   │
│  Sentry: error tracking on all of the above      │
└────────────────────┬─────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   Supabase        │
            │   (PostgreSQL,    │
            │    Auth, Storage, │
            │    RLS)           │
            └─────────┬─────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Vite + React     │
            │  frontend         │
            │  (Vercel)         │
            └──────────────────┘
```

## Key flows

### 1. Connecting Mercado Pago
1. User initiates OAuth from the frontend.
2. Backend handles the OAuth callback, stores encrypted tokens in `accounts`.
3. From then on, transactions sync two ways:
   - **Automatic**: a scheduled cron job polls the Mercado Pago API periodically (start with every 15-30 minutes; adjust based on Mercado Pago's rate limits and real usage once implemented).
   - **Manual**: a "sync now" button in the UI triggers an on-demand sync for that account.

### 2. Uploading a PDF/CSV statement
1. User uploads file from the frontend to Supabase Storage.
2. Backend downloads it, runs MarkItDown to get Markdown text.
3. **This flow is synchronous for files under the size threshold**: the user waits while the backend extracts and categorizes transactions, then sees the result.
4. **Threshold**: files over **5MB or 20 pages** (whichever limit is hit first) are routed to the async flow instead — uploaded to Storage, queued in Redis, processed in the background, and the user is notified (in-app, polling or websocket TBD) when done.
5. Known risk even under the threshold: large PDFs combined with DSPy/LLM calls could still approach Vercel's serverless timeout. If this is observed in practice, lower the threshold rather than letting requests time out silently.

### 3. Categorization pipeline
1. For each extracted transaction, first check `merchant_category_rules` for a known merchant the user has already corrected.
2. If no rule exists, run the DSPy pipeline (LLM call) to categorize.
3. Write the transaction to `transactions` with the resulting `category_id`.
4. If the user later edits the category manually, write an entry to `transaction_edits` and upsert a row in `merchant_category_rules` for that merchant.

### 4. Multi-currency handling
1. Exchange rates are fetched from BCRA **once per day** (scheduled job) per currency in use, and stored in the `exchange_rates` table — not fetched live per transaction.
2. Rates are also cached in Redis (24h TTL) to avoid hitting Postgres on every transaction insert.
3. When a transaction in a non-ARS currency is inserted, look up the cached rate for that transaction's date (falling back to the most recent available rate for weekends/holidays when BCRA doesn't publish).
4. Store `exchange_rate_to_ars` and `exchange_rate_date` on the transaction itself (rate is fixed at the time of the transaction, not recalculated later).
5. The frontend offers a toggle: view totals consolidated in ARS, or split by currency.

## Why these decisions

- **FastAPI on Vercel serverless instead of a separate backend host**: keeps deployment simple (one platform, one CI/CD pipeline) at the cost of serverless constraints (timeouts, cold starts). Acceptable tradeoff for a portfolio-scale project; documented as a known risk rather than ignored.
- **Synchronous PDF processing for MVP**: simpler to build and reason about than an async queue + notification system. Revisit if real-world PDF sizes make this impractical.
- **DSPy instead of hand-written prompts**: allows iterating on and evaluating the categorization pipeline systematically instead of tweaking prompt strings by hand.
- **No RAG**: user financial data is structured and small enough to fit directly in context — RAG would add complexity without benefit here.
- **Redis for the queue (not just cache)**: solves both the Vercel timeout risk for heavy tasks and rate limiting for external APIs (Mercado Pago, BCRA, LLM provider) with a single piece of infrastructure.

## Open questions

- Exact notification mechanism for async PDF processing completion (in-app polling vs. websocket) — decide during implementation based on what's simplest with the existing stack.
