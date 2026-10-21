-- PHUZA AUCTION shared database starter
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- This is a demo auction schema. It does not process payments or pay referral rewards.
begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Member' check (char_length(display_name) between 2 and 40),
  referral_code text not null unique check (referral_code ~ '^[A-Z0-9]{8,16}$'),
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 500),
  start_price numeric(12,2) not null check (start_price > 0),
  current_price numeric(12,2) not null check (current_price > 0),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint current_price_not_below_start check (current_price >= start_price)
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists auctions_status_created_idx on public.auctions(status, created_at desc);
create index if not exists bids_auction_created_idx on public.bids(auction_id, created_at desc);
create index if not exists bids_bidder_created_idx on public.bids(bidder_id, created_at desc);
create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  entry_type text not null check (entry_type in ('credit','debit','adjustment','withdrawal_request','withdrawal_paid','withdrawal_rejected')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  description text not null default '' check (char_length(description) <= 300),
  reference_id text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_ledger_user_created_idx on public.wallet_ledger(user_id, created_at desc);

-- Generate referral codes without trusting user-supplied IDs.
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
    exit when not exists (select 1 from public.profiles p where p.referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- On account creation, create profile and optionally record a valid referral.
-- Referral code comes from auth signup metadata, but referrer identity is resolved server-side.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_ref_code text;
  v_referrer uuid;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Member');
  v_name := left(v_name, 40);
  if char_length(v_name) < 2 then v_name := 'Member'; end if;

  v_ref_code := upper(coalesce(new.raw_user_meta_data ->> 'referral_code_used', ''));
  if v_ref_code <> '' then
    select p.id into v_referrer
    from public.profiles p
    where p.referral_code = v_ref_code
    limit 1;
    if v_referrer = new.id then v_referrer := null; end if;
  end if;

  insert into public.profiles(id, display_name, referral_code, referred_by)
  values (new.id, v_name, public.generate_referral_code(), v_referrer);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_phuza on auth.users;
create trigger on_auth_user_created_phuza
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Users cannot choose a bidder ID or bypass the current-price check.
create or replace function public.place_bid(p_auction_id uuid, p_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_auction public.auctions%rowtype;
  v_bid_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'You must sign in to bid';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Bid must be greater than zero';
  end if;

  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if not found then raise exception 'Auction not found'; end if;
  if v_auction.status <> 'open' then raise exception 'Auction is not open'; end if;
  if v_auction.ends_at is not null and v_auction.ends_at <= now() then
    raise exception 'Auction has ended';
  end if;
  if v_auction.seller_id = v_user then raise exception 'You cannot bid on your own listing'; end if;
  if p_amount <= v_auction.current_price then
    raise exception 'Your bid must be higher than the current price';
  end if;

  insert into public.bids(auction_id, bidder_id, amount)
  values (p_auction_id, v_user, round(p_amount, 2))
  returning id into v_bid_id;

  update public.auctions
  set current_price = round(p_amount, 2), updated_at = now()
  where id = p_auction_id;

  return v_bid_id;
end;
$$;

-- Public leaderboard deliberately excludes email and wallet data.
-- Safe public profile projection: never expose referral codes or referrer links publicly.
create or replace view public.public_profiles
with (security_invoker = false)
as
select id, display_name
from public.profiles;

create or replace view public.public_leaderboard
with (security_invoker = false)
as
select
  p.id,
  p.display_name,
  count(child.id)::integer as referral_count,
  p.created_at as joined_at
from public.profiles p
left join public.profiles child on child.referred_by = p.id
group by p.id, p.display_name, p.created_at
order by count(child.id) desc, p.created_at asc;

-- Enable RLS on every exposed table.
alter table public.profiles enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;
alter table public.wallet_ledger enable row level security;

-- Profiles: public can read only the fields selected by the frontend. Table policy permits
-- profile row reads; never store email or secret data in this table.
drop policy if exists "profiles readable by everyone" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "users update own display name only" on public.profiles;
create policy "users update own display name only" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- No direct profile inserts: the auth trigger creates the row. Column-level grants prevent
-- changing referral_code/referred_by through the browser.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Auctions: everyone can see public listings. Authenticated users can create listings only
-- for themselves. Owner updates/deletes are not granted in this starter.
drop policy if exists "auctions are publicly readable" on public.auctions;
create policy "auctions are publicly readable" on public.auctions for select using (true);
drop policy if exists "signed in users create own auctions" on public.auctions;
create policy "signed in users create own auctions" on public.auctions
for insert to authenticated with check (auth.uid() = seller_id and status = 'open' and current_price = start_price);
revoke update, delete on public.auctions from anon, authenticated;
grant select on public.auctions to anon, authenticated;
grant insert (seller_id, title, description, start_price, current_price) on public.auctions to authenticated;

-- Bids: public can read bid history; inserts/updates are only through place_bid RPC.
drop policy if exists "bids are publicly readable" on public.bids;
create policy "bids are publicly readable" on public.bids for select using (true);
revoke insert, update, delete on public.bids from anon, authenticated;
grant select on public.bids to anon, authenticated;
revoke all on function public.place_bid(uuid, numeric) from public;
grant execute on function public.place_bid(uuid, numeric) to authenticated;

-- Wallet ledger: a user can read only their own records. No client write privileges or policies.
drop policy if exists "users read own wallet ledger" on public.wallet_ledger;
create policy "users read own wallet ledger" on public.wallet_ledger
for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.wallet_ledger from anon, authenticated;
grant select on public.wallet_ledger to authenticated;

-- Leaderboard view access. Profiles contain no email, but only display name and referral count
-- are selected by the view. RLS remains active on the underlying profiles table.
grant select on public.public_profiles to anon, authenticated;
grant select on public.public_leaderboard to anon, authenticated;

-- Supabase Realtime: add tables to the publication if not already present.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'auctions'
  ) then
    alter publication supabase_realtime add table public.auctions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table public.bids;
  end if;
end $$;

commit;
