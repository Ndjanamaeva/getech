/*
# GENESYS Cameroon — Core schema

## Overview
Foundational schema. profiles created first with self-policies only; is_admin()
defined after profiles; remaining tables and the admin-read policy on profiles
added after is_admin() exists. All idempotent.
*/

-- ---------------------------------------------------------------------------
-- profiles (created first, self policies only at this stage)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','superadmin')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;
grant select on public.profiles to service_role;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_read_all" on public.profiles;

-- ---------------------------------------------------------------------------
-- is_admin() helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin','superadmin')
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Now add admin-read policy on profiles (is_admin exists)
drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all"
on public.profiles for select to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

grant select on public.categories to anon, authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
on public.categories for select to anon, authenticated
using (is_active = true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
on public.categories for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete restrict,
  name text not null,
  reference text unique,
  slug text not null unique,
  short_description text,
  long_description text,
  image_url text,
  additional_images text[],
  unit_price numeric(14,2) not null default 0,
  currency text not null default 'XAF',
  show_public_price boolean not null default false,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  stock_quantity int not null default 0,
  reserved_quantity int not null default 0,
  low_stock_threshold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stock_quantity >= 0),
  check (reserved_quantity >= 0),
  check (reserved_quantity <= stock_quantity)
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
on public.products for select to anon, authenticated
using (is_active = true and is_archived = false);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- quote_requests
-- ---------------------------------------------------------------------------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  address text not null,
  city text,
  country text not null default 'Cameroun',
  message text,
  consent boolean not null default false,
  status text not null default 'NOUVELLE'
    check (status in ('NOUVELLE','CONTACTÉE','EN NÉGOCIATION','ACCEPTÉE','REFUSÉE','ANNULÉE')),
  negotiated_amount numeric(14,2),
  commercial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

grant insert on public.quote_requests to anon, authenticated;
grant select, update on public.quote_requests to authenticated;
grant all on public.quote_requests to service_role;

drop policy if exists "quote_requests_public_insert" on public.quote_requests;
create policy "quote_requests_public_insert"
on public.quote_requests for insert to anon, authenticated
with check (consent = true);

drop policy if exists "quote_requests_admin_select" on public.quote_requests;
create policy "quote_requests_admin_select"
on public.quote_requests for select to authenticated
using (public.is_admin());

drop policy if exists "quote_requests_admin_update" on public.quote_requests;
create policy "quote_requests_admin_update"
on public.quote_requests for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- quote_request_history
-- ---------------------------------------------------------------------------
create table if not exists public.quote_request_history (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  previous_status text,
  new_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.quote_request_history enable row level security;

grant insert on public.quote_request_history to anon, authenticated;
grant select on public.quote_request_history to authenticated;
grant all on public.quote_request_history to service_role;

drop policy if exists "history_insert" on public.quote_request_history;
create policy "history_insert"
on public.quote_request_history for insert to anon, authenticated
with check (true);

drop policy if exists "history_admin_select" on public.quote_request_history;
create policy "history_admin_select"
on public.quote_request_history for select to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- sales
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'XAF',
  status text not null default 'VALIDÉE'
    check (status in ('VALIDÉE','ANNULÉE')),
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales enable row level security;

grant select, insert, update on public.sales to authenticated;
grant all on public.sales to service_role;

drop policy if exists "sales_admin_all" on public.sales;
create policy "sales_admin_all"
on public.sales for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- sale_items
-- ---------------------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  product_reference_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sale_items enable row level security;

grant select, insert on public.sale_items to authenticated;
grant all on public.sale_items to service_role;

drop policy if exists "sale_items_admin_all" on public.sale_items;
create policy "sale_items_admin_all"
on public.sale_items for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- inventory_movements
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('IN','OUT','ADJUSTMENT','RETURN')),
  quantity int not null,
  reason text,
  reference_type text,
  reference_id uuid,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

grant select, insert on public.inventory_movements to authenticated;
grant all on public.inventory_movements to service_role;

drop policy if exists "movements_admin_all" on public.inventory_movements;
create policy "movements_admin_all"
on public.inventory_movements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('quote','sale','stock','system')),
  title text not null,
  message text not null,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

grant insert on public.notifications to anon, authenticated;
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists "notifications_public_insert" on public.notifications;
create policy "notifications_public_insert"
on public.notifications for insert to anon, authenticated
with check (true);

drop policy if exists "notifications_admin_select" on public.notifications;
create policy "notifications_admin_select"
on public.notifications for select to authenticated
using (public.is_admin());

drop policy if exists "notifications_admin_update" on public.notifications;
create policy "notifications_admin_update"
on public.notifications for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;

drop policy if exists "audit_admin_insert" on public.audit_logs;
create policy "audit_admin_insert"
on public.audit_logs for insert to authenticated
with check (public.is_admin());

drop policy if exists "audit_admin_select" on public.audit_logs;
create policy "audit_admin_select"
on public.audit_logs for select to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_archived on public.products(is_archived);
create index if not exists idx_products_reference on public.products(reference);
create index if not exists idx_products_slug on public.products(slug);

create index if not exists idx_quotes_reference on public.quote_requests(reference);
create index if not exists idx_quotes_status on public.quote_requests(status);
create index if not exists idx_quotes_product on public.quote_requests(product_id);
create index if not exists idx_quotes_created on public.quote_requests(created_at desc);
create index if not exists idx_quotes_phone on public.quote_requests(phone);
create index if not exists idx_quotes_lastname on public.quote_requests(last_name);

create index if not exists idx_history_quote on public.quote_request_history(quote_request_id);
create index if not exists idx_history_created on public.quote_request_history(created_at desc);

create index if not exists idx_sales_reference on public.sales(reference);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_quote on public.sales(quote_request_id);
create index if not exists idx_sales_validated_at on public.sales(validated_at desc);

create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);

create index if not exists idx_movements_product on public.inventory_movements(product_id);
create index if not exists idx_movements_created on public.inventory_movements(created_at desc);
create index if not exists idx_movements_ref on public.inventory_movements(reference_type, reference_id);

create index if not exists idx_notifications_unread on public.notifications(is_read, created_at desc);

create index if not exists idx_audit_entity on public.audit_logs(entity_type, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_quotes_updated on public.quote_requests;
create trigger trg_quotes_updated before update on public.quote_requests
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_sales_updated on public.sales;
create trigger trg_sales_updated before update on public.sales
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'admin', coalesce(new.raw_user_meta_data->>'full_name', 'Administrateur'))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();