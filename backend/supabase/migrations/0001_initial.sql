create extension if not exists pgcrypto;

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null,
  connection_type text not null,
  display_name text,
  current_balance numeric,
  currency text not null default 'ARS',
  balance_synced_at timestamptz,
  oauth_access_token text,
  oauth_refresh_token text,
  oauth_expires_at timestamptz,
  created_at timestamptz default now()
);

alter table accounts enable row level security;

create policy "users manage own accounts"
on accounts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  type text not null,
  icon text,
  color text,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "users see own and global categories"
on categories for select
using (user_id is null or auth.uid() = user_id);

create policy "users manage own categories"
on categories for insert
with check (auth.uid() = user_id);

create policy "users update own categories"
on categories for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users delete own categories"
on categories for delete
using (auth.uid() = user_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  category_id uuid references categories,
  type text not null,
  amount numeric not null,
  currency text not null,
  exchange_rate_to_ars numeric,
  exchange_rate_date date,
  date date not null,
  raw_description text,
  merchant text,
  is_transfer boolean not null default false,
  transfer_pair_id uuid references transactions,
  is_manually_edited boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "users manage own transactions"
on transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index idx_transactions_user_date on transactions (user_id, date desc);
create index idx_transactions_account on transactions (account_id);

create table transaction_edits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions not null,
  user_id uuid references auth.users not null,
  field_name text not null,
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
with check (auth.uid() = user_id);

create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null,
  rate_to_ars numeric not null,
  rate_date date not null,
  source text not null default 'bcra',
  fetched_at timestamptz default now(),
  unique (currency, rate_date)
);

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
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories,
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
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  category_id uuid references categories,
  threshold numeric,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table alerts enable row level security;

create policy "users manage own alerts"
on alerts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
