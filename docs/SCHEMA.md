# SCHEMA.md

Complete data model for the project. Source of truth for table structure — keep in sync with actual Supabase migrations.

All tables use `auth.users` (Supabase Auth) as the user reference. RLS is mandatory on every table from day one.

---

## `accounts`

Connected wallets per user.

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null,              -- 'mercadopago' | 'uala' | 'brubank' | 'naranjax' | ...
  connection_type text not null,       -- 'api' | 'pdf_upload'
  display_name text,                   -- e.g. "My Ualá account"
  current_balance numeric,
  currency text not null default 'ARS',
  balance_synced_at timestamptz,
  oauth_access_token text,             -- encrypted, only for provider='mercadopago'
  oauth_refresh_token text,
  oauth_expires_at timestamptz,
  created_at timestamptz default now()
);

alter table accounts enable row level security;

create policy "users manage own accounts"
on accounts for all
using (auth.uid() = user_id);
```

OAuth tokens should be encrypted at rest (Supabase Vault or pgsodium) before production — not plain text, even with RLS in place.

---

## `categories`

Predefined + user-customizable expense/income categories.

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,  -- null = predefined/global category
  name text not null,
  type text not null,                  -- 'expense' | 'income'
  icon text,
  color text,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "users see own and global categories"
on categories for select
using (user_id is null or auth.uid() = user_id);

create policy "users manage own categories"
on categories for insert, update, delete
using (auth.uid() = user_id);
```

Seed predefined categories with `user_id = null` (e.g. "Delivery", "Groceries", "Subscriptions", "Rent", "Transport").

---

## `transactions`

Central table. Every imported or manually added transaction lives here.

```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  category_id uuid references categories,

  type text not null,                  -- 'income' | 'expense'
  amount numeric not null,             -- signed: negative = expense, positive = income
  currency text not null,              -- 'ARS' | 'USD' | ...

  -- BCRA official exchange rate at time of transaction, for consolidated totals.
  -- Null if currency = 'ARS' (no conversion needed).
  exchange_rate_to_ars numeric,
  exchange_rate_date date,

  date date not null,
  raw_description text,                -- original text from API/PDF
  merchant text,                       -- normalized merchant name

  is_transfer boolean not null default false,   -- movement between user's own accounts
  transfer_pair_id uuid references transactions, -- link to the mirrored transaction

  is_manually_edited boolean not null default false,

  metadata jsonb default '{}',         -- flexible field for source-specific data

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "users manage own transactions"
on transactions for all
using (auth.uid() = user_id);

create index idx_transactions_user_date on transactions (user_id, date desc);
create index idx_transactions_account on transactions (account_id);
```

Notes:
- `is_transfer = true` transactions are **included** in totals but flagged, so the UI can offer a toggle to exclude them rather than excluding by default.
- Consolidated ARS totals are computed at query/application time using `amount * exchange_rate_to_ars` (or `amount` directly if `currency = 'ARS'`) — there's also a toggle to view totals split by currency instead of consolidated.
- `metadata` jsonb holds anything provider-specific that doesn't deserve its own column yet.

---

## `transaction_edits`

Audit trail for manual edits — preserves the original imported value alongside the user's edit.

```sql
create table transaction_edits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions not null,
  user_id uuid references auth.users not null,
  field_name text not null,            -- e.g. 'amount', 'category_id', 'merchant'
  old_value text,
  new_value text,
  edited_at timestamptz default now()
);

alter table transaction_edits enable row level security;

create policy "users see own edits"
on transaction_edits for select
using (auth.uid() = user_id);

create policy "users create own edits"
on transaction_edits for insert
using (auth.uid() = user_id);
```

When a user edits any field on a `transactions` row, the backend writes one row per changed field here before updating `transactions`, and sets `is_manually_edited = true` on the transaction.

---

## `exchange_rates`

Daily cache of BCRA official exchange rates, fetched once per day and reused for all transactions on that date.

```sql
create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null,              -- 'USD', etc. (ARS is implicit as the target)
  rate_to_ars numeric not null,
  rate_date date not null,
  source text not null default 'bcra',
  fetched_at timestamptz default now(),
  unique (currency, rate_date)
);

-- No RLS needed: this is global reference data, not user-specific.
```

Fetched once per day (e.g. via a scheduled job) for each currency in use. Also cached in Redis with a 24h TTL to avoid hitting Postgres on every transaction insert. When a transaction in a non-ARS currency is inserted, look up the rate for that transaction's `date` here (falling back to the most recent available rate if the exact date is missing, e.g. weekends/holidays when BCRA doesn't publish).

---

## `merchant_category_rules`

Learned categorization corrections, applied before calling the LLM again for a known merchant.

```sql
create table merchant_category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  merchant text not null,
  category_id uuid references categories not null,
  created_at timestamptz default now(),
  unique (user_id, merchant)
);

alter table merchant_category_rules enable row level security;

create policy "users manage own rules"
on merchant_category_rules for all
using (auth.uid() = user_id);
```

---

## `goals`

Savings goals — standalone or tied to a specific category.

```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories,  -- null = standalone goal
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  currency text not null default 'ARS',
  target_date date,
  created_at timestamptz default now()
);

alter table goals enable row level security;

create policy "users manage own goals"
on goals for all
using (auth.uid() = user_id);
```

---

## `alerts`

User-configured notification rules.

```sql
create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,                  -- 'category_limit' | 'low_balance' | 'unusual_spending' | ...
  category_id uuid references categories,  -- relevant for type='category_limit'
  threshold numeric,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table alerts enable row level security;

create policy "users manage own alerts"
on alerts for all
using (auth.uid() = user_id);
```

---

## Open questions / not yet defined

- Exact shape of `metadata` jsonb per provider (to be defined once real Ualá/Brubank/NaranjaX statements are parsed).
- Indexing strategy beyond the basics above, once query patterns from the actual dashboard are clearer.
