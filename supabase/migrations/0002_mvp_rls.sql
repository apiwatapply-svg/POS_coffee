alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.payments enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.current_profile_role()
returns app_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() and is_active = true
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() and is_active = true
$$;

create policy "active users can read own profile"
on public.profiles for select
using (auth_user_id = auth.uid() or public.current_profile_role() in ('admin', 'manager'));

create policy "admin can manage profiles"
on public.profiles for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "staff can read active categories"
on public.categories for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage categories"
on public.categories for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read active catalog products"
on public.products for select
using (is_archived = false and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage products"
on public.products for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read active modifier groups"
on public.modifier_groups for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage modifier groups"
on public.modifier_groups for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read active modifier options"
on public.modifier_options for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage modifier options"
on public.modifier_options for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read product modifier links"
on public.product_modifier_groups for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage product modifier links"
on public.product_modifier_groups for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "cashier manager admin create orders"
on public.orders for insert
with check (cashier_id = public.current_profile_id() and public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "cashier reads own orders managers read all barista reads queue"
on public.orders for select
using (
  cashier_id = public.current_profile_id()
  or public.current_profile_role() in ('admin', 'manager', 'barista')
);

create policy "barista manager admin update order status"
on public.orders for update
using (public.current_profile_role() in ('admin', 'manager', 'barista'))
with check (public.current_profile_role() in ('admin', 'manager', 'barista'));

create policy "authorized users read order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (
        orders.cashier_id = public.current_profile_id()
        or public.current_profile_role() in ('admin', 'manager', 'barista')
      )
  )
);

create policy "cashier manager admin insert order items"
on public.order_items for insert
with check (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "authorized users read order item modifiers"
on public.order_item_modifiers for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "cashier manager admin insert order item modifiers"
on public.order_item_modifiers for insert
with check (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "cashier manager admin manage payments"
on public.payments for all
using (public.current_profile_role() in ('admin', 'manager', 'cashier'))
with check (created_by = public.current_profile_id() and public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "authorized users read store settings"
on public.store_settings for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "admin update store settings"
on public.store_settings for update
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

