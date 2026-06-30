# API.md

Backend API contract. Companion to `SCHEMA.md` (data model) and `ARCHITECTURE.md` (system flows).

## Conventions

- All routes are versioned and prefixed with `/v1`.
- All routes (except auth) require a valid Supabase JWT in the `Authorization: Bearer <token>` header.
- Request/response bodies are validated with Pydantic models — every endpoint has a corresponding request/response schema in `backend/app/schemas/`.
- Errors follow the shape defined in `AGENTS.md`: `{"error": "message", "code": "SOME_ERROR"}`.
- List endpoints are paginated with `limit`/`offset` query params (default `limit=50`, max `limit=200`).
- Dates in `YYYY-MM-DD`, timestamps in ISO 8601 UTC.
- Amounts are returned as numbers in the transaction's original currency; the client handles formatting and ARS conversion display using `exchange_rate_to_ars` when present.

This file lists endpoint contracts. As new endpoints are implemented, add them here — this file should always reflect the real API, not the planned one.

---

## Auth

Handled by Supabase Auth directly from the frontend (signup, login, session refresh). The backend only validates the JWT on incoming requests; it does not implement its own auth endpoints.

---

## Accounts

### `GET /v1/accounts`
List all connected accounts for the authenticated user.

**Response 200**
```json
[
  {
    "id": "uuid",
    "provider": "mercadopago",
    "connection_type": "api",
    "display_name": "My Mercado Pago",
    "current_balance": 45000.00,
    "currency": "ARS",
    "balance_synced_at": "2026-06-30T10:00:00Z"
  }
]
```

### `POST /v1/accounts/mercadopago/connect`
Start Mercado Pago OAuth flow. Returns the authorization URL the frontend redirects to.

**Response 200**
```json
{ "authorization_url": "https://auth.mercadopago.com/..." }
```

### `GET /v1/accounts/mercadopago/callback`
OAuth callback. Mercado Pago redirects here with a code; backend exchanges it for tokens and creates/updates the `accounts` row.

### `POST /v1/accounts/{account_id}/sync`
Manually trigger a sync for a Mercado Pago-connected account (the "sync now" button).

**Response 202**
```json
{ "status": "syncing" }
```

### `POST /v1/accounts/upload-statement`
Upload a PDF/CSV statement for parsing.

- **Files under 5MB and 20 pages**: processed synchronously — the request blocks until parsing and categorization complete.
- **Files over that threshold**: queued for async processing instead.

**Request**: multipart/form-data with `file` and `account_id`.

**Response 200** (synchronous path)
```json
{
  "transactions_created": 23,
  "transactions": [ /* array of created transaction objects, see below */ ]
}
```

**Response 202** (async path — file queued)
```json
{ "status": "processing", "job_id": "uuid" }
```

**Response 422** if the file can't be parsed (e.g. unsupported format, corrupted PDF).

### `GET /v1/accounts/upload-statement/{job_id}`
Poll the status of an async statement processing job.

**Response 200**
```json
{ "status": "processing" }
```
or, once done:
```json
{ "status": "completed", "transactions_created": 87, "transactions": [ /* ... */ ] }
```

---

## Transactions

### `GET /v1/transactions`
List transactions for the authenticated user.

**Query params**: `limit`, `offset`, `account_id` (optional filter), `category_id` (optional filter), `date_from`, `date_to`, `currency_view` (`split` | `consolidated_ars`, default `split`).

**Response 200**
```json
{
  "total": 142,
  "limit": 50,
  "offset": 0,
  "transactions": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "category_id": "uuid",
      "type": "expense",
      "amount": -1500.00,
      "currency": "ARS",
      "exchange_rate_to_ars": null,
      "date": "2026-06-28",
      "merchant": "Rappi",
      "raw_description": "RAPPI*PEDIDO123",
      "is_transfer": false,
      "is_manually_edited": false
    }
  ]
}
```

### `PATCH /v1/transactions/{transaction_id}`
Edit any field on a transaction. Writes an entry to `transaction_edits` per changed field and sets `is_manually_edited = true`.

**Request**
```json
{ "category_id": "uuid", "amount": -1600.00 }
```

**Response 200**: the updated transaction object.

### `GET /v1/transactions/{transaction_id}/edits`
Get the edit history for a transaction.

**Response 200**
```json
[
  { "field_name": "amount", "old_value": "-1500.00", "new_value": "-1600.00", "edited_at": "2026-06-30T12:00:00Z" }
]
```

### `GET /v1/transactions/summary`
Aggregated totals by category and/or time period, used for the dashboard.

**Query params**: `date_from`, `date_to`, `currency_view` (`split` | `consolidated_ars`), `exclude_transfers` (boolean, default `false`).

**Response 200**
```json
{
  "total_income": 800000.00,
  "total_expense": -650000.00,
  "by_category": [
    { "category_id": "uuid", "category_name": "Delivery", "total": -120000.00 }
  ]
}
```

---

## Categories

### `GET /v1/categories`
List predefined + user's custom categories.

### `POST /v1/categories`
Create a custom category.

**Request**
```json
{ "name": "Mascotas", "type": "expense", "icon": "paw", "color": "#A855F7" }
```

---

## Goals

### `GET /v1/goals`
List the user's savings goals.

### `POST /v1/goals`
Create a goal.

**Request**
```json
{ "name": "Viaje a Brasil", "target_amount": 500000.00, "currency": "ARS", "target_date": "2026-12-01", "category_id": null }
```

### `PATCH /v1/goals/{goal_id}`
Update a goal (e.g. `current_amount` progress).

---

## Alerts

### `GET /v1/alerts`
List the user's configured alerts.

### `POST /v1/alerts`
Create an alert.

**Request**
```json
{ "type": "category_limit", "category_id": "uuid", "threshold": 100000.00 }
```

---

## Open questions

- Exact webhook/polling payload contract from Mercado Pago (depends on their API docs — verify when implementing).
- Whether `GET /v1/transactions/summary` needs additional groupings (by account, by week) once the dashboard UI is designed.
- Rate limit thresholds per endpoint (Redis-backed) — to be defined based on real usage patterns.
- Exact mechanism for notifying the frontend when an async PDF job completes (polling interval vs. websocket).
