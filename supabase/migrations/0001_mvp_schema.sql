create extension if not exists "pgcrypto";

create type app_role as enum ('admin', 'manager', 'cashier', 'barista');
create type order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded');
create type payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');
create type payment_method as enum ('cash', 'promptpay_qr', 'qr_payment', 'credit_card', 'e_wallet');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  sku text not null unique,
  name text not null,
  description text,
  image_url text,
  price numeric(12,2) not null check (price > 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  is_available boolean not null default true,
  is_archived boolean not null default false,
  track_stock boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_required boolean not null default false,
  min_select integer not null default 0 check (min_select >= 0),
  max_select integer not null default 1 check (max_select >= 1),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(12,2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.product_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  unique(product_id, modifier_group_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  receipt_number text not null unique,
  customer_id uuid,
  cashier_id uuid not null references public.profiles(id),
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  service_charge_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  order_type text not null default 'in_store',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  base_price numeric(12,2) not null,
  modifier_total numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  note text
);

create table public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_group_name text not null,
  modifier_option_name text not null,
  price_delta numeric(12,2) not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method payment_method not null,
  amount numeric(12,2) not null check (amount >= 0),
  received_amount numeric(12,2),
  change_amount numeric(12,2),
  status payment_status not null default 'paid',
  transaction_ref text,
  paid_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Coffee POS',
  logo_url text,
  address text,
  phone text,
  tax_id text,
  currency text not null default 'THB',
  timezone text not null default 'Asia/Bangkok',
  vat_enabled boolean not null default true,
  vat_rate numeric(5,2) not null default 7,
  service_charge_enabled boolean not null default false,
  service_charge_rate numeric(5,2) not null default 0,
  receipt_prefix text not null default 'R',
  receipt_footer text not null default 'Thank you',
  printer_paper_size text not null default '80mm',
  updated_at timestamptz not null default now()
);

create index categories_active_sort_idx on public.categories (is_active, sort_order);
create index products_catalog_idx on public.products (is_archived, is_available, category_id, sort_order);
create index orders_cashier_created_idx on public.orders (cashier_id, created_at desc);
create index orders_status_created_idx on public.orders (payment_status, status, created_at);
create index order_items_order_idx on public.order_items (order_id);
create index payments_order_idx on public.payments (order_id);

insert into public.store_settings (store_name)
values ('Coffee POS');

