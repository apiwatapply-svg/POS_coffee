# Coffee POS System Architecture

**Project:** Coffee POS Web Application  
**Document Type:** System Architecture and ER Diagram  
**Version:** 1.0  
**Last Updated:** 2026-05-09  
**Related Documents:**
- `docs/coffee_pos_requirements.md`
- `docs/api_spec.md`
- `docs/superpowers/plans/2026-05-09-coffee-pos-mvp.md`

---

## 1. Architecture Goals

The Coffee POS architecture is designed for fast cashier operation, reliable order persistence, realtime barista updates, role-based access control, and a clean path for future inventory, loyalty, and multi-branch features.

Primary goals:

1. Keep POS UI fast and touch-friendly.
2. Keep payment, order, inventory, and reporting logic outside UI components.
3. Enforce authorization in both application code and Supabase RLS.
4. Use realtime subscriptions for barista queue updates.
5. Keep the MVP small enough to ship, while leaving clear extension points for Phase 2 and Phase 3.

---

## 2. High-Level System Architecture

```mermaid
flowchart LR
  User["Staff User<br/>Admin, Manager, Cashier, Barista"]
  Browser["Web Browser<br/>Tablet / Desktop"]
  NextApp["Next.js App Router<br/>React UI + Server Actions"]
  ClientState["Zustand POS Cart<br/>Client State"]
  QueryLayer["TanStack Query<br/>Server State Cache"]
  Services["Service Layer<br/>Auth, Products, Orders, Reports"]
  SupabaseAuth["Supabase Auth"]
  SupabaseDB["Supabase PostgreSQL<br/>RLS Enabled"]
  SupabaseRealtime["Supabase Realtime<br/>orders, order_items"]
  SupabaseStorage["Supabase Storage<br/>Product Images, Logo"]
  Vercel["Vercel Hosting"]

  User --> Browser
  Browser --> NextApp
  NextApp --> ClientState
  NextApp --> QueryLayer
  NextApp --> Services
  Services --> SupabaseAuth
  Services --> SupabaseDB
  Services --> SupabaseStorage
  SupabaseRealtime --> Browser
  Vercel --> NextApp
```

---

## 3. Application Layers

## 3.1 Presentation Layer

Responsible for UI screens, layouts, forms, loading states, and error states.

Recommended folders:

```text
app/
components/
hooks/
stores/
```

Rules:

- UI components must not contain payment or order persistence logic.
- POS cart can use client state because it is temporary before checkout.
- Pages must enforce role-based access before rendering protected content.
- Forms should use React Hook Form and Zod validation.

## 3.2 Application and Service Layer

Responsible for use cases and business rules.

Recommended folders:

```text
app/actions/
lib/services/
lib/calculations/
lib/validations/
```

Rules:

- `app/actions/*` exposes server actions to UI components.
- `lib/services/*` owns database calls and use-case orchestration.
- `lib/calculations/pos.ts` owns pricing, VAT, service charge, discount, and change calculations.
- `lib/validations/*` owns input validation schemas.

## 3.3 Data Layer

Responsible for Supabase clients, PostgreSQL schema, RLS policies, and seed data.

Recommended folders:

```text
lib/supabase/
supabase/migrations/
supabase/seed.sql
types/database.ts
```

Rules:

- Use browser Supabase client only for safe client-side reads and realtime subscriptions.
- Use server Supabase client for authenticated server actions.
- Use service role client only on the server and only when a trusted operation requires it.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

---

## 4. Deployment Architecture

```mermaid
flowchart TB
  Dev["Developer Workstation"]
  Git["Git Repository<br/>GitHub or GitLab"]
  VercelPreview["Vercel Preview Deployments<br/>Pull Requests"]
  VercelProd["Vercel Production<br/>main branch"]
  SupabaseCloud["Supabase Cloud<br/>Auth, DB, Realtime, Storage"]

  Dev --> Git
  Git --> VercelPreview
  Git --> VercelProd
  VercelPreview --> SupabaseCloud
  VercelProd --> SupabaseCloud
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 5. Role-Based Access Model

| Role | Main Pages | Key Permissions |
|---|---|---|
| Admin | Dashboard, Products, Orders, Reports, Settings, Staff | Full access, settings, staff, reports, refunds, cancellations |
| Manager | Dashboard, Products, Orders, Inventory, Reports | Store operations, product management, reports, allowed refunds |
| Cashier | POS, Receipt, Own Orders, Customers | Create orders, accept payments, print receipts, suspend/resume orders |
| Barista | Barista Display | View active drink orders and update preparation status |

Authorization must be enforced in two places:

1. Page-level guards in Next.js.
2. Supabase RLS policies in PostgreSQL.

---

## 6. Core Runtime Workflows

## 6.1 Login Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as Login Page
  participant Action as auth server action
  participant Auth as Supabase Auth
  participant DB as profiles table

  User->>UI: Enter email and password
  UI->>Action: loginAction(email, password)
  Action->>Auth: signInWithPassword
  Auth-->>Action: session user
  Action->>DB: load profile by auth_user_id
  DB-->>Action: role and is_active
  Action-->>UI: redirect by role or return error
```

## 6.2 POS Checkout Flow

```mermaid
sequenceDiagram
  actor Cashier
  participant POS as POS Page
  participant Cart as Zustand Cart
  participant OrderAction as order server action
  participant DB as Supabase PostgreSQL
  participant Realtime as Supabase Realtime
  participant Barista as Barista Page

  Cashier->>POS: Select product and modifiers
  POS->>Cart: Add item
  Cart-->>POS: Recalculate totals
  Cashier->>POS: Confirm payment
  POS->>OrderAction: createOrder(cart, payment)
  OrderAction->>DB: insert orders
  OrderAction->>DB: insert order_items
  OrderAction->>DB: insert order_item_modifiers
  OrderAction->>DB: insert payments
  DB-->>Realtime: broadcast order changes
  Realtime-->>Barista: active queue updated
  OrderAction-->>POS: orderId
  POS-->>Cashier: redirect to receipt page
```

## 6.3 Barista Status Flow

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Preparing: Start
  Preparing --> Ready: Ready
  Ready --> Completed: Complete
  Pending --> Cancelled: Cancel
  Preparing --> Cancelled: Cancel
  Ready --> Cancelled: Cancel
  Completed --> [*]
  Cancelled --> [*]
```

---

## 7. ER Diagram

This ER diagram covers the full requirement set, including MVP and Phase 2 entities. MVP implementation can start with the tables marked as MVP.

```mermaid
erDiagram
  profiles {
    uuid id PK
    uuid auth_user_id UK
    text full_name
    text email UK
    text phone
    text role
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }

  categories {
    uuid id PK
    text name
    text description
    integer sort_order
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }

  products {
    uuid id PK
    uuid category_id FK
    text sku UK
    text name
    text description
    text image_url
    numeric price
    numeric cost
    boolean is_available
    boolean is_archived
    boolean track_stock
    integer sort_order
    timestamptz created_at
    timestamptz updated_at
  }

  modifier_groups {
    uuid id PK
    text name
    boolean is_required
    integer min_select
    integer max_select
    boolean is_active
    integer sort_order
  }

  modifier_options {
    uuid id PK
    uuid modifier_group_id FK
    text name
    numeric price_delta
    boolean is_active
    integer sort_order
  }

  product_modifier_groups {
    uuid id PK
    uuid product_id FK
    uuid modifier_group_id FK
  }

  orders {
    uuid id PK
    text order_number UK
    text receipt_number UK
    uuid customer_id FK
    uuid cashier_id FK
    text status
    text payment_status
    numeric subtotal
    numeric discount_amount
    numeric vat_amount
    numeric service_charge_amount
    numeric total_amount
    text order_type
    text note
    timestamptz created_at
    timestamptz updated_at
  }

  order_items {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    text product_name
    integer quantity
    numeric base_price
    numeric modifier_total
    numeric unit_price
    numeric total_price
    text note
  }

  order_item_modifiers {
    uuid id PK
    uuid order_item_id FK
    text modifier_group_name
    text modifier_option_name
    numeric price_delta
  }

  payments {
    uuid id PK
    uuid order_id FK
    text payment_method
    numeric amount
    numeric received_amount
    numeric change_amount
    text status
    text transaction_ref
    timestamptz paid_at
    uuid created_by FK
  }

  inventory_items {
    uuid id PK
    text name
    text unit
    numeric quantity
    numeric low_stock_threshold
    numeric cost_per_unit
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }

  product_recipes {
    uuid id PK
    uuid product_id FK
    uuid inventory_item_id FK
    numeric quantity_required
    text unit
  }

  stock_movements {
    uuid id PK
    uuid inventory_item_id FK
    text movement_type
    numeric quantity_before
    numeric quantity_change
    numeric quantity_after
    uuid reference_order_id FK
    text note
    uuid created_by FK
    timestamptz created_at
  }

  customers {
    uuid id PK
    text name
    text phone UK
    text email
    integer points
    numeric total_spent
    integer total_orders
    timestamptz last_order_at
    timestamptz created_at
    timestamptz updated_at
  }

  store_settings {
    uuid id PK
    text store_name
    text logo_url
    text address
    text phone
    text tax_id
    text currency
    text timezone
    boolean vat_enabled
    numeric vat_rate
    boolean service_charge_enabled
    numeric service_charge_rate
    text receipt_prefix
    text receipt_footer
    text printer_paper_size
    timestamptz updated_at
  }

  audit_logs {
    uuid id PK
    uuid user_id FK
    text action_type
    text entity_type
    uuid entity_id
    jsonb old_value
    jsonb new_value
    text ip_address
    timestamptz created_at
  }

  categories ||--o{ products : contains
  products ||--o{ product_modifier_groups : has
  modifier_groups ||--o{ product_modifier_groups : assigned_to
  modifier_groups ||--o{ modifier_options : contains
  profiles ||--o{ orders : cashier_creates
  customers ||--o{ orders : places
  orders ||--o{ order_items : contains
  products ||--o{ order_items : sold_as
  order_items ||--o{ order_item_modifiers : customized_by
  orders ||--o{ payments : paid_by
  profiles ||--o{ payments : records
  products ||--o{ product_recipes : consumes
  inventory_items ||--o{ product_recipes : ingredient
  inventory_items ||--o{ stock_movements : changes
  orders ||--o{ stock_movements : references
  profiles ||--o{ stock_movements : creates
  profiles ||--o{ audit_logs : performs
```

---

## 8. Table Ownership by Phase

| Phase | Tables |
|---|---|
| MVP | `profiles`, `categories`, `products`, `modifier_groups`, `modifier_options`, `product_modifier_groups`, `orders`, `order_items`, `order_item_modifiers`, `payments`, `store_settings` |
| Phase 2 | `inventory_items`, `product_recipes`, `stock_movements`, `customers`, `audit_logs` |
| Phase 3 | Add `branches`, `online_orders`, `delivery_integrations`, `promotions`, `membership_tiers` |

---

## 9. Realtime Design

Realtime subscriptions:

| Channel | Tables | Used By | Purpose |
|---|---|---|---|
| `barista-orders` | `orders`, `order_items`, `order_item_modifiers` | Barista Display | Show paid orders and status changes |
| `order-status` | `orders` | POS, Orders Detail | Update cashier when order status changes |

Rules:

- Subscribe only after user is authenticated.
- Barista page should filter active statuses: `pending`, `preparing`, `ready`.
- Completed and cancelled orders should be removed from the active barista board.
- If realtime disconnects, show a warning and allow manual refresh.

---

## 10. Security Architecture

Security controls:

1. Supabase Auth manages identity.
2. `profiles` maps Supabase auth users to application roles.
3. Next.js protected layouts guard page access.
4. RLS protects table access.
5. Server actions validate all inputs with Zod.
6. Service role key is used only server-side.
7. Sensitive actions create audit logs in Phase 2.

RLS examples:

| Rule | Enforcement |
|---|---|
| Cashier can read own orders | `orders.cashier_id = current_profile_id()` |
| Manager and Admin can read all orders | role in `admin`, `manager` |
| Barista can read active paid orders | role in `barista`, `manager`, `admin` |
| Only Admin can manage staff | `profiles` write policy |
| Only Manager and Admin can manage products | `products` write policy |

---

## 11. Failure Handling

| Failure | Expected Behavior |
|---|---|
| Network disconnected at POS | Show warning and block final payment confirmation |
| Order save fails | Do not create paid order, show actionable error |
| Payment save fails | Order must not be marked as paid |
| Realtime disconnected | Show reconnect warning and allow refresh |
| Receipt print fails | Keep order saved and allow reprint |
| Unauthorized access | Redirect to allowed home page or show access denied |

