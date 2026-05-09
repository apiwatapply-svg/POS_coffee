# Coffee POS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Coffee POS web application MVP covering login, role-based access, POS cart, modifiers, checkout, receipt, barista realtime queue, product management, order history, and a basic dashboard.

**Architecture:** Use Next.js App Router with TypeScript for the frontend and server actions for business operations. Keep business logic in `lib/services`, validation in `lib/validations`, shared types in `types`, local POS cart state in Zustand, and persistent data in Supabase PostgreSQL with RLS enabled from the first migration.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Realtime/Storage, React Hook Form, Zod, Zustand, TanStack Query, Recharts, Vitest, Playwright, Vercel.

---

## Scope Strategy

The requirements describe a full POS platform. Implement it in separate deliverables so each release is testable:

1. **MVP:** Authentication, roles, product catalog, modifiers, POS, checkout, receipt, barista queue, order history, basic dashboard.
2. **Phase 2:** Inventory, recipe-based deduction, customers, loyalty, staff management, audit logs, advanced reports.
3. **Phase 3:** Multi-branch, online ordering, delivery integration, promotion engine, membership tiers, mobile app.

This plan focuses on the MVP. Phase 2 and Phase 3 are listed as follow-up plans at the end.

## Target File Structure

Create this structure from the empty workspace:

```text
C:/Users/FDB-MM-024/Documents/My_Project/POS_Coffee/
  app/
    (auth)/login/page.tsx
    (auth)/forgot-password/page.tsx
    (protected)/layout.tsx
    (protected)/dashboard/page.tsx
    (protected)/pos/page.tsx
    (protected)/barista/page.tsx
    (protected)/products/page.tsx
    (protected)/products/create/page.tsx
    (protected)/products/[id]/edit/page.tsx
    (protected)/orders/page.tsx
    (protected)/orders/[id]/page.tsx
    (protected)/receipt/[orderId]/page.tsx
    actions/auth.ts
    actions/orders.ts
    actions/products.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    layout/AppShell.tsx
    pos/CartPanel.tsx
    pos/CheckoutPanel.tsx
    pos/ModifierDialog.tsx
    pos/ProductGrid.tsx
    barista/OrderQueueBoard.tsx
    products/ProductForm.tsx
    products/ProductTable.tsx
    orders/OrderDetail.tsx
    orders/OrdersTable.tsx
    receipt/ReceiptView.tsx
    ui/
  hooks/
    use-network-status.ts
    use-realtime-orders.ts
  lib/
    calculations/pos.ts
    constants/roles.ts
    services/auth-service.ts
    services/order-service.ts
    services/product-service.ts
    services/report-service.ts
    supabase/browser.ts
    supabase/server.ts
    supabase/service-role.ts
    utils/format.ts
    validations/auth.ts
    validations/order.ts
    validations/product.ts
  stores/
    pos-cart-store.ts
  tests/
    unit/pos-calculations.test.ts
    unit/order-validation.test.ts
    unit/product-validation.test.ts
    e2e/pos-checkout.spec.ts
  types/
    database.ts
    domain.ts
  supabase/
    migrations/0001_mvp_schema.sql
    migrations/0002_mvp_rls.sql
    seed.sql
  .env.example
  package.json
  playwright.config.ts
  tailwind.config.ts
  tsconfig.json
  vitest.config.ts
```

## Data Model Boundary

MVP tables:

- `profiles`
- `categories`
- `products`
- `modifier_groups`
- `modifier_options`
- `product_modifier_groups`
- `orders`
- `order_items`
- `order_item_modifiers`
- `payments`
- `store_settings`

Phase 2 tables:

- `inventory_items`
- `product_recipes`
- `stock_movements`
- `customers`
- `audit_logs`

Keep Phase 2 tables out of the first migration unless the team wants inventory in MVP acceptance. This prevents order checkout from being blocked by inventory complexity.

## Task 1: Bootstrap Next.js App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `.env.example`

- [ ] **Step 1: Initialize project dependencies**

Run:

```powershell
npm init -y
npm install next react react-dom @supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers zustand @tanstack/react-query recharts lucide-react clsx tailwind-merge
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom playwright eslint eslint-config-next
```

Expected: `package.json` contains runtime and dev dependencies.

- [ ] **Step 2: Add scripts**

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Create environment example**

Create `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Create app shell baseline**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coffee POS",
  description: "Coffee shop point of sale system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify bootstrap**

Run:

```powershell
npm run build
```

Expected: Next.js builds successfully.

- [ ] **Step 6: Commit**

Run:

```powershell
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs app .env.example
git commit -m "chore: bootstrap coffee pos app"
```

## Task 2: Supabase Clients and Database Types

**Files:**
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/service-role.ts`
- Create: `types/database.ts`
- Create: `types/domain.ts`

- [ ] **Step 1: Define domain enums**

Create `types/domain.ts`:

```ts
export type UserRole = "admin" | "manager" | "cashier" | "barista";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";
export type PaymentMethod = "cash" | "promptpay_qr" | "qr_payment" | "credit_card" | "e_wallet";
```

- [ ] **Step 2: Add browser Supabase client**

Create `lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Add server Supabase client**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}
```

- [ ] **Step 4: Add service role client**

Create `lib/supabase/service-role.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

- [ ] **Step 5: Verify**

Run:

```powershell
npm run build
```

Expected: Build passes without missing env type errors.

- [ ] **Step 6: Commit**

```powershell
git add lib/supabase types
git commit -m "chore: add supabase clients"
```

## Task 3: MVP Database Migration

**Files:**
- Create: `supabase/migrations/0001_mvp_schema.sql`
- Create: `supabase/migrations/0002_mvp_rls.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create schema migration**

Create `supabase/migrations/0001_mvp_schema.sql` with tables for MVP:

```sql
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

insert into public.store_settings (store_name) values ('Coffee POS');
```

- [ ] **Step 2: Create RLS migration**

Create `supabase/migrations/0002_mvp_rls.sql`:

```sql
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

create policy "staff can read active catalog"
on public.categories for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage categories"
on public.categories for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read available products"
on public.products for select
using (is_archived = false and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "manager admin manage products"
on public.products for all
using (public.current_profile_role() in ('admin', 'manager'))
with check (public.current_profile_role() in ('admin', 'manager'));

create policy "staff can read modifiers"
on public.modifier_groups for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "staff can read modifier options"
on public.modifier_options for select
using (is_active = true and public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "staff can read product modifier links"
on public.product_modifier_groups for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "cashier manager admin create orders"
on public.orders for insert
with check (cashier_id = public.current_profile_id() and public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "cashier reads own orders and managers read all"
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
    select 1 from public.orders
    where orders.id = order_items.order_id
    and (
      orders.cashier_id = public.current_profile_id()
      or public.current_profile_role() in ('admin', 'manager', 'barista')
    )
  )
);

create policy "authorized users insert order items"
on public.order_items for insert
with check (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "authorized users read order item modifiers"
on public.order_item_modifiers for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier', 'barista'));

create policy "authorized users insert order item modifiers"
on public.order_item_modifiers for insert
with check (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "cashier manager admin manage payments"
on public.payments for all
using (public.current_profile_role() in ('admin', 'manager', 'cashier'))
with check (created_by = public.current_profile_id() and public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "manager admin read settings"
on public.store_settings for select
using (public.current_profile_role() in ('admin', 'manager', 'cashier'));

create policy "admin update settings"
on public.store_settings for update
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');
```

- [ ] **Step 3: Create seed data**

Create `supabase/seed.sql` with coffee menu categories, products, modifier groups, and options:

```sql
insert into public.categories (name, sort_order) values
('Coffee', 1),
('Tea', 2),
('Bakery', 3);

insert into public.products (category_id, sku, name, price, cost, sort_order)
select id, 'LATTE', 'Latte', 85, 35, 1 from public.categories where name = 'Coffee';

insert into public.products (category_id, sku, name, price, cost, sort_order)
select id, 'AMERICANO', 'Americano', 70, 25, 2 from public.categories where name = 'Coffee';

insert into public.modifier_groups (name, is_required, min_select, max_select, sort_order) values
('Cup Size', true, 1, 1, 1),
('Temperature', true, 1, 1, 2),
('Sweetness', true, 1, 1, 3),
('Milk Type', false, 0, 1, 4),
('Add-ons', false, 0, 3, 5);
```

- [ ] **Step 4: Verify migration syntax**

Run:

```powershell
npx supabase db lint
```

Expected: No SQL syntax or policy errors.

- [ ] **Step 5: Commit**

```powershell
git add supabase
git commit -m "feat: add mvp supabase schema"
```

## Task 4: Calculation and Validation Core

**Files:**
- Create: `lib/calculations/pos.ts`
- Create: `lib/validations/order.ts`
- Create: `lib/validations/product.ts`
- Create: `tests/unit/pos-calculations.test.ts`
- Create: `tests/unit/order-validation.test.ts`
- Create: `tests/unit/product-validation.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `tests/unit/pos-calculations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateChange, calculateItemTotal, calculateOrderTotals } from "@/lib/calculations/pos";

describe("POS calculations", () => {
  it("calculates item total from base price, modifiers, and quantity", () => {
    expect(calculateItemTotal({ basePrice: 85, modifierTotal: 20, quantity: 2 })).toBe(210);
  });

  it("calculates fixed discount, VAT, service charge, and grand total", () => {
    expect(
      calculateOrderTotals({
        items: [{ totalPrice: 210 }, { totalPrice: 70 }],
        discount: { type: "fixed", value: 30 },
        vatRate: 7,
        serviceChargeRate: 10,
      }),
    ).toEqual({
      subtotal: 280,
      discountAmount: 30,
      taxableBase: 250,
      vatAmount: 17.5,
      serviceChargeAmount: 25,
      totalAmount: 262.5,
    });
  });

  it("calculates change for cash payment", () => {
    expect(calculateChange({ totalAmount: 262.5, receivedAmount: 300 })).toBe(37.5);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm run test -- tests/unit/pos-calculations.test.ts
```

Expected: FAIL because calculation functions do not exist.

- [ ] **Step 3: Implement calculations**

Create `lib/calculations/pos.ts`:

```ts
type Discount = { type: "fixed" | "percentage"; value: number };

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateItemTotal(input: { basePrice: number; modifierTotal: number; quantity: number }) {
  return roundMoney((input.basePrice + input.modifierTotal) * input.quantity);
}

export function calculateOrderTotals(input: {
  items: Array<{ totalPrice: number }>;
  discount: Discount;
  vatRate: number;
  serviceChargeRate: number;
}) {
  const subtotal = roundMoney(input.items.reduce((sum, item) => sum + item.totalPrice, 0));
  const discountAmount =
    input.discount.type === "percentage"
      ? roundMoney(subtotal * (input.discount.value / 100))
      : roundMoney(input.discount.value);
  const taxableBase = roundMoney(Math.max(subtotal - discountAmount, 0));
  const vatAmount = roundMoney(taxableBase * (input.vatRate / 100));
  const serviceChargeAmount = roundMoney(taxableBase * (input.serviceChargeRate / 100));
  const totalAmount = roundMoney(taxableBase + vatAmount + serviceChargeAmount);

  return { subtotal, discountAmount, taxableBase, vatAmount, serviceChargeAmount, totalAmount };
}

export function calculateChange(input: { totalAmount: number; receivedAmount: number }) {
  return roundMoney(input.receivedAmount - input.totalAmount);
}
```

- [ ] **Step 4: Add Zod schemas**

Create `lib/validations/order.ts`:

```ts
import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  basePrice: z.number().positive(),
  modifierTotal: z.number().min(0),
  note: z.string().max(500).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
  paymentMethod: z.enum(["cash", "promptpay_qr", "qr_payment", "credit_card", "e_wallet"]),
  receivedAmount: z.number().min(0).optional(),
  paymentConfirmed: z.boolean().optional(),
});
```

Create `lib/validations/product.ts`:

```ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  price: z.number().positive("Selling price must be greater than 0"),
  cost: z.number().min(0, "Cost cannot be negative"),
  isAvailable: z.boolean(),
  trackStock: z.boolean(),
  sortOrder: z.number().int().min(0),
});
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm run test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add lib/calculations lib/validations tests/unit
git commit -m "feat: add pos calculations and validation"
```

## Task 5: Authentication and Role Guards

**Files:**
- Create: `lib/services/auth-service.ts`
- Create: `app/actions/auth.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `app/(protected)/layout.tsx`
- Create: `lib/constants/roles.ts`

- [ ] **Step 1: Implement role constants**

Create `lib/constants/roles.ts`:

```ts
import type { UserRole } from "@/types/domain";

export const roleHomePath: Record<UserRole, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  cashier: "/pos",
  barista: "/barista",
};

export const protectedRouteRoles: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "manager"],
  "/pos": ["admin", "manager", "cashier"],
  "/barista": ["admin", "manager", "barista"],
  "/products": ["admin", "manager"],
  "/orders": ["admin", "manager", "cashier"],
};
```

- [ ] **Step 2: Implement auth service**

Create `lib/services/auth-service.ts` with functions:

```ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/constants/roles";
import type { UserRole } from "@/types/domain";

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userResult.user.id)
    .single();

  return profile;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");
  if (!allowedRoles.includes(profile.role as UserRole)) redirect(roleHomePath[profile.role as UserRole]);
  return profile;
}
```

- [ ] **Step 3: Implement login server action**

Create `app/actions/auth.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/constants/roles";
import type { UserRole } from "@/types/domain";

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password" };

  const { data: userResult } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("auth_user_id", userResult.user?.id)
    .single();

  if (!profile?.is_active) return { error: "Your account has been disabled. Please contact Admin" };
  redirect(roleHomePath[profile.role as UserRole]);
}
```

- [ ] **Step 4: Build login UI**

Create `app/(auth)/login/page.tsx` with email input, password input, login button, forgot-password link, loading state, and error message from `loginAction`.

- [ ] **Step 5: Verify role redirects manually**

Run:

```powershell
npm run dev
```

Open `http://localhost:3000/login`.

Expected:
- Admin and Manager route to `/dashboard`.
- Cashier routes to `/pos`.
- Barista routes to `/barista`.
- Disabled user sees disabled account message.

- [ ] **Step 6: Commit**

```powershell
git add app/actions app/(auth) app/(protected) lib/services/auth-service.ts lib/constants
git commit -m "feat: add authentication and role guards"
```

## Task 6: Product Catalog and Management

**Files:**
- Create: `lib/services/product-service.ts`
- Create: `app/actions/products.ts`
- Create: `components/products/ProductTable.tsx`
- Create: `components/products/ProductForm.tsx`
- Create: `app/(protected)/products/page.tsx`
- Create: `app/(protected)/products/create/page.tsx`
- Create: `app/(protected)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Implement product service**

Create `lib/services/product-service.ts` with:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/product";

export async function getProducts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("is_archived", false)
    .order("sort_order");
  if (error) throw new Error("Unable to load products");
  return data;
}

export async function createProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").insert({
    category_id: parsed.categoryId,
    sku: parsed.sku,
    name: parsed.name,
    description: parsed.description,
    price: parsed.price,
    cost: parsed.cost,
    is_available: parsed.isAvailable,
    track_stock: parsed.trackStock,
    sort_order: parsed.sortOrder,
  });
  if (error) throw new Error(error.code === "23505" ? "SKU must be unique" : "Unable to create product");
}
```

- [ ] **Step 2: Build products list**

Create `app/(protected)/products/page.tsx` to call `requireRole(["admin", "manager"])`, load products, and render `ProductTable`.

- [ ] **Step 3: Build product create/edit form**

Create `components/products/ProductForm.tsx` using React Hook Form and Zod resolver. Include fields: name, SKU, category, description, selling price, cost price, availability, stock tracking, sort order.

- [ ] **Step 4: Add archive action**

Add `archiveProduct(id)` to `product-service.ts`:

```ts
export async function archiveProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update({ is_archived: true }).eq("id", id);
  if (error) throw new Error("Unable to archive product");
}
```

- [ ] **Step 5: Verify product flow**

Run:

```powershell
npm run build
```

Manual check:
- Manager can open `/products`.
- Cashier is redirected away from `/products`.
- Product with duplicate SKU shows clear error.
- Archived product no longer appears on POS catalog.

- [ ] **Step 6: Commit**

```powershell
git add app/actions/products.ts app/(protected)/products components/products lib/services/product-service.ts
git commit -m "feat: add product management"
```

## Task 7: POS Cart Store and Product Grid

**Files:**
- Create: `stores/pos-cart-store.ts`
- Create: `components/pos/ProductGrid.tsx`
- Create: `components/pos/ModifierDialog.tsx`
- Create: `components/pos/CartPanel.tsx`
- Create: `hooks/use-network-status.ts`
- Create: `app/(protected)/pos/page.tsx`

- [ ] **Step 1: Implement POS cart store**

Create `stores/pos-cart-store.ts`:

```ts
import { create } from "zustand";
import { calculateItemTotal, calculateOrderTotals } from "@/lib/calculations/pos";

export type CartModifier = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type CartItem = {
  clientId: string;
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  note?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (clientId: string, quantity: number) => void;
  removeItem: (clientId: string) => void;
  clearCart: () => void;
  totals: () => ReturnType<typeof calculateOrderTotals>;
};

export const usePosCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set({ items: [...get().items, item] }),
  updateQuantity: (clientId, quantity) =>
    set({ items: get().items.map((item) => (item.clientId === clientId ? { ...item, quantity } : item)) }),
  removeItem: (clientId) => set({ items: get().items.filter((item) => item.clientId !== clientId) }),
  clearCart: () => set({ items: [] }),
  totals: () =>
    calculateOrderTotals({
      items: get().items.map((item) => ({
        totalPrice: calculateItemTotal({
          basePrice: item.basePrice,
          modifierTotal: item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0),
          quantity: item.quantity,
        }),
      })),
      discount: { type: "fixed", value: 0 },
      vatRate: 7,
      serviceChargeRate: 0,
    }),
}));
```

- [ ] **Step 2: Implement network status hook**

Create `hooks/use-network-status.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const updateOnline = () => setIsOnline(true);
    const updateOffline = () => setIsOnline(false);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOffline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  return isOnline;
}
```

- [ ] **Step 3: Build POS page layout**

Create `app/(protected)/pos/page.tsx` to enforce `requireRole(["admin", "manager", "cashier"])`, load available products and modifiers, and render product grid plus cart panel.

- [ ] **Step 4: Build modifier dialog**

Create `components/pos/ModifierDialog.tsx` to enforce required groups before adding item to cart. Show validation message when required group has no selected option.

- [ ] **Step 5: Verify POS behavior**

Manual check:
- Search by product name.
- Filter by category.
- Product card blocks unavailable product.
- Required modifiers must be selected.
- Quantity increase/decrease updates totals immediately.
- Checkout button is disabled when cart is empty.
- Offline warning appears and confirm payment is blocked when browser is offline.

- [ ] **Step 6: Commit**

```powershell
git add app/(protected)/pos components/pos stores hooks/use-network-status.ts
git commit -m "feat: add pos cart and product selection"
```

## Task 8: Checkout and Order Creation

**Files:**
- Create: `lib/services/order-service.ts`
- Create: `app/actions/orders.ts`
- Create: `components/pos/CheckoutPanel.tsx`
- Modify: `components/pos/CartPanel.tsx`

- [ ] **Step 1: Implement order number helpers**

In `lib/services/order-service.ts`, create order and receipt numbers with date prefix:

```ts
function createOrderNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `O${stamp}${now.getTime().toString().slice(-6)}`;
}

function createReceiptNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `R${stamp}${now.getTime().toString().slice(-6)}`;
}
```

- [ ] **Step 2: Implement create order service**

Add `createOrder(cart, paymentData)` to `order-service.ts`. The service must:

1. Validate cart with `checkoutSchema`.
2. Create `orders` record with status `pending` and payment status `paid`.
3. Create `order_items`.
4. Create `order_item_modifiers`.
5. Create `payments`.
6. Return `orderId`.

Use the service role client only inside server actions if RLS blocks multi-table checkout, and never expose the service role key to client code.

- [ ] **Step 3: Build checkout panel**

Create `components/pos/CheckoutPanel.tsx` with:

- Order summary
- Payment method selector
- Cash received input
- Change calculation
- QR payment confirmation checkbox
- Confirm payment button
- Cancel button

- [ ] **Step 4: Add payment rules**

Checkout validation must return these messages:

```ts
const paymentMessages = {
  emptyCart: "Cart cannot be empty",
  cashNotEnough: "Cash received amount must be greater than or equal to grand total",
  qrNotConfirmed: "Please confirm that QR payment has been received",
  networkOffline: "Unable to save order. Please check your internet connection and try again.",
};
```

- [ ] **Step 5: Verify checkout**

Manual check:
- Cash payment less than total is blocked.
- QR payment requires checkbox confirmation.
- Successful checkout redirects to `/receipt/[orderId]`.
- Failed save does not mark order as paid.

- [ ] **Step 6: Commit**

```powershell
git add lib/services/order-service.ts app/actions/orders.ts components/pos
git commit -m "feat: implement checkout and order creation"
```

## Task 9: Receipt Page

**Files:**
- Create: `components/receipt/ReceiptView.tsx`
- Create: `app/(protected)/receipt/[orderId]/page.tsx`
- Modify: `lib/services/order-service.ts`

- [ ] **Step 1: Add order detail query**

Add `getOrderById(orderId)` to `order-service.ts` to return order, items, modifiers, payment, cashier profile, and store settings.

- [ ] **Step 2: Build thermal receipt view**

Create `components/receipt/ReceiptView.tsx` with CSS classes for `58mm` and `80mm` widths. Include store info, receipt number, order number, date, cashier, items, modifiers, totals, payment method, cash received, change, and footer.

- [ ] **Step 3: Add print button**

Use `window.print()` from a client component button. Print CSS must hide navigation and actions.

- [ ] **Step 4: Verify**

Manual check:
- Receipt displays all order data.
- Browser print preview uses thermal width styling.
- Reopening receipt URL works from order history.

- [ ] **Step 5: Commit**

```powershell
git add app/(protected)/receipt components/receipt lib/services/order-service.ts
git commit -m "feat: add receipt page"
```

## Task 10: Barista Realtime Queue

**Files:**
- Create: `hooks/use-realtime-orders.ts`
- Create: `components/barista/OrderQueueBoard.tsx`
- Create: `app/(protected)/barista/page.tsx`
- Modify: `lib/services/order-service.ts`

- [ ] **Step 1: Add active orders query**

Add `getActiveBaristaOrders()` to `order-service.ts`:

```ts
export async function getActiveBaristaOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, order_item_modifiers(*))")
    .eq("payment_status", "paid")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load barista queue");
  return data;
}
```

- [ ] **Step 2: Add status update service**

Add `updateOrderStatus(orderId, status)` and validate status transitions:

```ts
const allowedTransitions = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  refunded: [],
} as const;
```

- [ ] **Step 3: Implement realtime hook**

Create `hooks/use-realtime-orders.ts` subscribing to Supabase Realtime changes on `orders` and `order_items`, then invalidate or refetch queue data.

- [ ] **Step 4: Build barista board**

Create cards showing order number, queue number, elapsed time, drink list, modifiers, item notes, order notes, Start, Ready, and Complete buttons. Highlight orders older than 10 minutes.

- [ ] **Step 5: Verify realtime**

Manual check with two browser windows:
- Cashier completes checkout.
- Barista page shows new paid order within 3 seconds.
- Start changes status to Preparing.
- Ready changes status to Ready.
- Complete removes order from active queue.

- [ ] **Step 6: Commit**

```powershell
git add app/(protected)/barista components/barista hooks/use-realtime-orders.ts lib/services/order-service.ts
git commit -m "feat: add barista realtime queue"
```

## Task 11: Orders History and Detail

**Files:**
- Create: `components/orders/OrdersTable.tsx`
- Create: `components/orders/OrderDetail.tsx`
- Create: `app/(protected)/orders/page.tsx`
- Create: `app/(protected)/orders/[id]/page.tsx`
- Modify: `lib/services/order-service.ts`

- [ ] **Step 1: Add filtered orders query**

Implement `getOrders(filters)` with filters for date range, cashier, payment method, order status, customer, and order number.

- [ ] **Step 2: Apply role visibility**

Cashier sees only own orders. Admin and Manager see all orders. Use both service filter and RLS policy.

- [ ] **Step 3: Build orders table**

Show order number, receipt number, date/time, cashier, total, payment method, order status, payment status, view detail button, and reprint receipt button.

- [ ] **Step 4: Build order detail page**

Show full order lifecycle, order items, modifiers, payment details, receipt preview, cancel button for allowed roles, and print button.

- [ ] **Step 5: Verify**

Manual check:
- Cashier cannot see another cashier order.
- Manager can filter by date and status.
- Reprint receipt opens `/receipt/[orderId]`.

- [ ] **Step 6: Commit**

```powershell
git add app/(protected)/orders components/orders lib/services/order-service.ts
git commit -m "feat: add order history and detail"
```

## Task 12: Basic Dashboard

**Files:**
- Create: `lib/services/report-service.ts`
- Create: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Implement dashboard query**

Create `getDashboardSummary(date)` returning:

- Total sales today
- Total orders today
- Total cups sold today
- Average order value
- Best-selling product today
- Sales by hour
- Payment method summary
- Recent orders

- [ ] **Step 2: Build dashboard page**

Use Recharts for sales by hour and cards for metrics. Enforce `requireRole(["admin", "manager"])`.

- [ ] **Step 3: Verify formulas**

Expected formulas:

```ts
const averageOrderValue = totalOrders === 0 ? 0 : totalSales / totalOrders;
const totalCupsSold = beverageOrderItems.reduce((sum, item) => sum + item.quantity, 0);
```

- [ ] **Step 4: Verify**

Manual check:
- Dashboard loads in under 5 seconds with seed data.
- Cashier is redirected away from `/dashboard`.
- AOV equals total sales divided by number of paid orders.

- [ ] **Step 5: Commit**

```powershell
git add app/(protected)/dashboard lib/services/report-service.ts
git commit -m "feat: add basic sales dashboard"
```

## Task 13: MVP End-to-End Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/pos-checkout.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Configure Playwright**

Create `playwright.config.ts` with base URL `http://localhost:3000`.

- [ ] **Step 2: Write checkout test**

Create `tests/e2e/pos-checkout.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("cashier creates latte order and barista completes it", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("cashier@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/pos/);

  await page.getByRole("button", { name: /Latte/ }).click();
  await page.getByRole("radio", { name: "Medium" }).click();
  await page.getByRole("radio", { name: "Iced" }).click();
  await page.getByRole("radio", { name: "50%" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByRole("radio", { name: "Cash" }).click();
  await page.getByLabel("Cash received").fill("200");
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page).toHaveURL(/\/receipt\//);

  const barista = await context.newPage();
  await barista.goto("/barista");
  await expect(barista.getByText("Latte")).toBeVisible();
  await barista.getByRole("button", { name: "Start" }).click();
  await barista.getByRole("button", { name: "Ready" }).click();
  await barista.getByRole("button", { name: "Complete" }).click();
  await expect(barista.getByText("Latte")).toBeHidden();
});
```

- [ ] **Step 3: Run E2E**

Run:

```powershell
npm run e2e
```

Expected: PASS with seeded cashier and barista users.

- [ ] **Step 4: Commit**

```powershell
git add playwright.config.ts tests/e2e package.json
git commit -m "test: add pos checkout e2e"
```

## Task 14: Deployment Readiness

**Files:**
- Create: `docs/deployment.md`
- Modify: `.env.example`

- [ ] **Step 1: Document Supabase setup**

Create `docs/deployment.md` with:

```md
# Deployment

## Supabase

1. Create a Supabase project.
2. Apply migrations in `supabase/migrations`.
3. Enable Auth email/password provider.
4. Configure redirect URL: `https://your-vercel-domain.vercel.app/auth/callback`.
5. Enable Realtime for `orders` and `order_items`.
6. Create a Storage bucket for product images when image upload is implemented.

## Vercel

Set environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Deploy from the `main` branch after build, unit tests, and E2E tests pass.
```

- [ ] **Step 2: Verify production build**

Run:

```powershell
npm run build
npm run test
```

Expected: Both commands pass.

- [ ] **Step 3: Commit**

```powershell
git add docs/deployment.md .env.example
git commit -m "docs: add deployment guide"
```

## MVP Acceptance Checklist

- [ ] Users can login successfully.
- [ ] Users are redirected based on role.
- [ ] Disabled users cannot login.
- [ ] Cashier can search and select products.
- [ ] Cashier can customize drinks.
- [ ] Cart totals are correct.
- [ ] Checkout works for cash and QR payment.
- [ ] Receipt is generated and printable.
- [ ] Orders are saved with items and modifiers.
- [ ] Paid orders appear in Barista Display in realtime.
- [ ] Barista can move orders through Pending, Preparing, Ready, and Completed.
- [ ] Cashier sees own order history.
- [ ] Manager and Admin see all orders.
- [ ] Dashboard shows daily sales summary.
- [ ] Role-based access works in page guards and RLS.
- [ ] Secret keys are not exposed to browser bundles.
- [ ] Vercel build succeeds.

## Phase 2 Plan Outline

Create a separate plan named `2026-05-09-coffee-pos-phase-2-operations.md` for:

1. Inventory items and stock movement pages.
2. Product recipes and recipe-based inventory deduction during checkout.
3. Refund and cancellation with reason.
4. Inventory restore on refund when configured.
5. Customer search, attach customer to order, loyalty point calculation.
6. Staff management for Admin.
7. Audit log table and audit log writes for sensitive actions.
8. Advanced reports with CSV, Excel, and PDF export.

## Phase 3 Plan Outline

Create a separate plan named `2026-05-09-coffee-pos-phase-3-growth.md` for:

1. Multi-branch data model.
2. Online ordering.
3. Delivery integration.
4. Promotion engine.
5. Membership tiers.
6. Mobile app.

## Self-Review

Spec coverage:

- Authentication: covered in Task 5.
- POS: covered in Tasks 4, 7, and 8.
- Checkout and payment: covered in Task 8.
- Receipt: covered in Task 9.
- Barista realtime: covered in Task 10.
- Products and modifiers: covered in Tasks 3, 6, and 7.
- Orders history and detail: covered in Task 11.
- Dashboard: covered in Task 12.
- RLS and security: covered in Tasks 2, 3, and 5.
- Testing: covered in Tasks 4 and 13.
- Deployment: covered in Task 14.
- Inventory, customers, staff, audit logs, advanced reports: intentionally moved to Phase 2 per the requirements roadmap.

Placeholder scan:

- The plan contains no unresolved implementation placeholders.
- All MVP tasks name exact files, commands, and verification expectations.

Type consistency:

- Role, order status, payment status, and payment method values match between `types/domain.ts`, SQL enums, validation schemas, and services.
