# AGENTS.md

Context guide for any coding agent working in this repo.

## What this project is

Personal finance platform for the Argentine market named ManejARG. Connects digital wallets (Mercado Pago via official API, others via PDF/CSV statement uploads), normalizes transactions, categorizes them with AI, and provides active spending/savings recommendations  not just an expense dashboard.

## Project documentation

This file (`AGENTS.md`) covers stack, conventions, and behavioral rules. Detailed technical specs live in separate files, always consult the relevant one before implementing, don't rely on summaries here if they go out of sync:

- **`docs/SCHEMA.md`**  complete data model: tables, columns, RLS policies. Source of truth for the database.
- **`docs/ARCHITECTURE.md`**  system flows, diagrams, and the reasoning behind major technical decisions.
- **`docs/API.md`**  backend endpoint contracts (routes, request/response shapes).
- **`ROADMAP.md`**  development phases and scope boundaries. Always check which phase is active before implementing, don't build ahead into future phases.
- **`PROGRESS.md`**  persistent memory across sessions. Read this first when starting a new session.

If something in this file conflicts with one of the above, the dedicated file wins for that topic, update this file's summary to match rather than leaving them inconsistent.

## Repo structure

Monorepo:

```
/frontend   -- Vite + React + TypeScript
/backend    -- FastAPI (Python)
```

The frontend never talks to Supabase directly for app data. Supabase Auth can be used from the frontend for signup/login flows, while all data logic, parsing, and AI go through the FastAPI backend.

## Stack

- Python 3.12+
- Node 20+

### Frontend
- Vite + React + TypeScript
- Tailwind CSS for styling
- pnpm as package manager
- ESLint + Prettier

### Backend
- FastAPI (Python)
- pip + venv for dependency management
- ruff as linter/formatter
- Pydantic for request/response validation and internal data models
- PostgreSQL (via Supabase) as the database. accessed only from the backend, never from the client
- Supabase for Auth as well
- DSPy for the AI pipeline: building and optimizing prompts for transaction categorization/extraction, plus evaluation
- MarkItDown to convert statement PDFs to Markdown before processing
- Redis for caching, rate limiting, and queuing async tasks (e.g. heavy PDF parsing that risks Vercel's serverless timeout)
- Sentry for error tracking and monitoring (backend only)

### External integrations
- Official Mercado Pago API (OAuth)

## Deployment

- Hosted on Vercel, both frontend and backend, with FastAPI running as Vercel serverless functions.
- Keep in mind serverless constraints: execution time limits and cold starts. PDF parsing (MarkItDown) and DSPy-driven LLM calls can be slow — heavy or slow tasks should go through the Redis queue instead of running synchronously inside a serverless function. If a new task risks approaching Vercel's function timeout, queue it rather than letting it run inline.
- Environment variables are configured in the Vercel dashboard per environment (production, preview). Local `.env` files are for local dev only and are never synced automatically — document any new variable in both places.

## Code conventions

- Strict TypeScript on the frontend; avoid `any`
- Python: type hints required on all functions
- Table and column names in `snake_case`, English
- React components in `PascalCase`, one component per file
- Commits follow **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, etc.)
- Never log sensitive financial data or OAuth tokens to console or persistent logs

## Testing

- Tests from day one, not deferred.
- Backend: pytest. Priority coverage on critical logic, statement parsing, financial calculations, categorization, DSPy pipeline outputs.
- Frontend: component tests for business logic in the UI (calculations, amount formatting); full coverage of purely visual UI is not required.
- E2E: Playwright for critical user flows (connecting an account, uploading a statement, viewing categorized transactions).
- Any new parsing or financial calculation function needs at least one test before merging.

## CI/CD

- GitHub Actions runs on every push and pull request: lint (ESLint/Prettier, ruff), type checks, and the full test suite (pytest + Playwright).
- A PR cannot merge to `main` if CI fails.
- Deployment to Vercel is triggered automatically on merge to `main` (production) and on pull requests (preview deployments).

## How to work in this repo (rules for the agent)

- **Ask before large changes**: architecture decisions, schema changes, new dependencies, or refactors touching multiple files require explicit confirmation before executing. Small, scoped changes (bug fixes, component tweaks) can proceed without asking.
- Don't assume product decisions. If a task is ambiguous on the *what* (not the *how*), ask.
- Keep this file up to date: if a new convention or architecture decision is made during development, reflect it here.
- **Before committing, pushing, or deploying**: run the full test suite (frontend and backend) and confirm everything passes before proceeding. If any test fails, do not continue with commit/push/deploy — fix the issue first, or explicitly report what's broken and why, and wait for confirmation on how to proceed.
- **Before implementing any feature**: check whether a relevant personal skill exists (C:\Users\cepita\.agents\skills) and follow its guidelines. If an applicable skill exists, consulting it is a required step before writing code, not optional.

## Project memory

After every large change (new feature, architecture change, schema decision, new integration), document it in `PROGRESS.md`: what was done, which files/paths were touched, what decisions were made and why, and what's pending.

`PROGRESS.md` is the persistent memory across sessions, always read it at the start of a new session to get real, up-to-date context on the project, without depending on the previous chat still being available. This is not optional: every large change gets logged there, not just when remembered.

## How to run the project locally

```bash
# Frontend
cd frontend
pnpm install
pnpm dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Keep these commands updated as the setup evolves (e.g. if Docker is introduced later).

## Environment variables and secrets

- Never commit `.env` files. They must be in `.gitignore` from the first commit.
- Keep `.env.example` up to date in both `/frontend` and `/backend` with required keys (no real values) whenever a new variable is added.
- Expected variables (fill in as they're added):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (backend only, never in frontend)
  - `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`
  - LLM provider API key (OpenAI/Anthropic, to be defined)
  - `REDIS_URL`
  - `SENTRY_DSN` (backend only)
- If a task requires an environment variable that doesn't exist yet, flag it and ask, never invent values or leave silent placeholders in the code.

## Error handling

- Backend: custom exceptions per domain (e.g. `ParsingError`, `MercadoPagoAuthError`) instead of generic exceptions. API error responses follow a consistent shape: `{"error": "message", "code": "SOME_ERROR"}`.
- All unhandled backend exceptions are reported to Sentry. Never log or send sensitive financial data, OAuth tokens, or full request bodies to Sentry, scrub before reporting.
- Never expose internal details (stack traces, SQL queries) in client-facing responses; log details on the backend, return a generic message to the frontend.
- Frontend: API errors are caught in the `lib/`/`services/` layer, never leave a `fetch` without error handling.

## Git workflow

- Work on feature branches, never commit directly to `main`.
- Branch naming: `type/short-description` (e.g. `feat/auth-supabase`, `fix/pdf-parsing-naranjax`).
- Open a pull request to merge into `main`. Merge only after GitHub Actions CI passes (lint, type checks, full test suite), see CI/CD section above.

## Language

- Code, variable/function/table names: English.
- User-facing UI text (labels, messages, copy): Spanish (Argentina), warm and clear tone, amounts in pesos.
- Code comments: Spanish or English, whichever is clearer for the specific case.

## Data model

See `SCHEMA.md` for the complete model. Quick orientation: `transactions` is the central table (multi-currency, with `is_transfer` flagging and `metadata` jsonb for source-specific fields), linked to `accounts`, `categories`, `goals`, and `alerts`. `transaction_edits` audits manual edits, `merchant_category_rules` stores learned categorization corrections.

## Security

- **RLS (Row Level Security) required from day one** on all Supabase tables. Never rely solely on backend filtering.
- Mercado Pago OAuth tokens never exposed to the client; they live only in the backend.
- Bank statement PDFs are sensitive data: access restricted per user in Storage as well, via RLS/policies.

## Transaction categorization

- DSPy handles prompt construction and optimization for the categorization/extraction pipeline. The LLM categorizes once when the transaction is inserted, not on every query.
- If the user manually corrects a category, save that correction as a rule for that `merchant` and apply it before calling the LLM again next time.
- Financial context is built directly into the DSPy pipeline input (no RAG, user data is structured and small, not documents to retrieve).

## What to avoid

- No RAG for the user's financial data.
- No PDF parsing in Supabase Edge Functions (time/memory limits); all parsing lives in the FastAPI backend. Watch for Vercel serverless function timeouts too, see Deployment section.
- No business logic mixed into UI components; keep API calls and data transformations in a separate layer (`lib/` or `services/`) on the frontend.
- No schema or architecture changes without confirmation (see rules section above).

## Project status

MVP in design phase. Core docs (`SCHEMA.md`, `ARCHITECTURE.md`, `API.md`) are defined. Next step: scaffold the repo structure and start implementing.
