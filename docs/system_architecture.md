# Coffee POS System Architecture

**Project:** Coffee POS Web Application  
**Document Type:** System Architecture and ER Diagram  
**Version:** 2.0  
**Last Updated:** 2026-05-09  

## 1. Architecture Goals

The Coffee POS architecture is designed for fast cashier operation, reliable order persistence, live barista queue refresh, role-based access control, and a clean path for future inventory, loyalty, and multi-branch features.

Primary goals:

1. Keep POS UI fast and touch-friendly.
2. Keep payment, order, inventory, and reporting logic outside UI components.
3. Use Microsoft SQL Server as the system of record.
4. Enforce authorization in service functions and protected layouts.
5. Use HTTP-only session cookies for staff sessions.
6. Keep the MVP small enough to ship while leaving extension points for Phase 2 and Phase 3.

## 2. High-Level Architecture

```mermaid
flowchart LR
  User["Staff User<br/>Admin, Manager, Cashier, Barista"]
  Browser["Web Browser<br/>Tablet / Desktop"]
  NextApp["Next.js App Router<br/>React UI + Server Actions"]
  ClientState["Zustand POS Cart<br/>Client State"]
  Services["Service Layer<br/>Auth, Products, Orders, Reports"]
  MssqlClient["MSSQL Data Access<br/>Connection Pool + Transactions"]
  SqlServer["Microsoft SQL Server<br/>Operational Database"]
  Vercel["Vercel Hosting"]

  User --> Browser
  Browser --> NextApp
  NextApp --> ClientState
  NextApp --> Services
  Services --> MssqlClient
  MssqlClient --> SqlServer
  Vercel --> NextApp
```

## 3. Application Layers

### 3.1 Presentation Layer

Responsible for screens, layouts, forms, loading states, and error states.

Primary folders:

```text
frontend/app/
frontend/components/
frontend/hooks/
frontend/stores/
```

Rules:

- UI components must not contain payment or order persistence logic.
- POS cart state is client-side and temporary before checkout.
- Protected pages must enforce role-based access before rendering.
- Forms should use Zod validation and server actions.

### 3.2 Application and Service Layer

Responsible for use cases and business rules.

Primary folders:

```text
backend/actions/
backend/services/
backend/calculations/
backend/validations/
backend/auth/
```

Rules:

- `backend/actions/*` exposes server actions to UI components.
- `backend/services/*` owns database calls and use-case orchestration.
- `backend/calculations/pos.ts` owns pricing, VAT, service charge, discount, and change calculations.
- `backend/auth/*` owns password verification and HTTP-only session cookies.

### 3.3 Data Layer

Responsible for SQL Server connection pooling, transactions, schema, and seed data.

Primary folders:

```text
backend/mssql/
database/mssql/schema.sql
database/mssql/seed.sql
shared/types/database.ts
```

Rules:

- SQL Server access must happen only on the server.
- Mutations that create orders, order items, modifiers, and payments must use transactions.
- Secrets must stay in server-only environment variables.
- Browser code must never receive database credentials.

## 4. Deployment Architecture

```mermaid
flowchart TB
  Dev["Developer Workstation"]
  Git["Git Repository<br/>GitHub"]
  VercelPreview["Vercel Preview Deployments<br/>Pull Requests"]
  VercelProd["Vercel Production<br/>main branch"]
  SqlServer["Microsoft SQL Server<br/>Managed or Self-Hosted"]

  Dev --> Git
  Git --> VercelPreview
  Git --> VercelProd
  VercelPreview --> SqlServer
  VercelProd --> SqlServer
```

Required environment variables:

```env
NEXT_PUBLIC_APP_URL=
MSSQL_CONNECTION_STRING=
MSSQL_SERVER=
MSSQL_PORT=
MSSQL_DATABASE=
MSSQL_USER=
MSSQL_PASSWORD=
MSSQL_ENCRYPT=
MSSQL_TRUST_SERVER_CERTIFICATE=
MSSQL_POOL_MAX=
```

## 5. Role-Based Access Model

| Role | Main Pages | Key Permissions |
| --- | --- | --- |
| Admin | Dashboard, Products, Orders, Reports, Settings, Staff | Full access, settings, staff, reports, refunds, cancellations |
| Manager | Dashboard, Products, Orders, Inventory, Reports | Store operations, product management, reports, allowed refunds |
| Cashier | POS, Receipt, Own Orders, Customers | Create orders, accept payments, print receipts, suspend/resume orders |
| Barista | Barista Display | View active drink orders and update preparation status |

Authorization is enforced in:

1. Protected layouts and role guards.
2. Server actions.
3. Service functions before sensitive data access.

## 6. Core Runtime Workflows

### 6.1 Login Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as Login Page
  participant Action as Auth Server Action
  participant DB as SQL Server
  participant Cookie as HTTP-only Session Cookie

  User->>UI: Enter email and password
  UI->>Action: loginAction(email, password)
  Action->>DB: Load active profile by email
  Action->>Action: Verify PBKDF2 password hash
  Action->>DB: Insert staff_sessions row
  Action->>Cookie: Set pos_session cookie
  Action-->>UI: Redirect by role
```

### 6.2 POS Checkout Flow

```mermaid
sequenceDiagram
  actor Cashier
  participant POS as POS Page
  participant Cart as Zustand Cart
  participant OrderAction as Order Server Action
  participant DB as SQL Server Transaction
  participant Barista as Barista Page

  Cashier->>POS: Select product and modifiers
  POS->>Cart: Add item
  Cart-->>POS: Recalculate totals
  Cashier->>POS: Confirm payment
  POS->>OrderAction: createOrder(cart, payment)
  OrderAction->>DB: Insert order, items, modifiers, and payment
  DB-->>OrderAction: Commit transaction
  OrderAction-->>POS: orderId
  POS-->>Cashier: Redirect to receipt page
  Barista->>OrderAction: Periodic refresh
```

### 6.3 Barista Status Flow

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

## 7. ER Diagram

```mermaid
erDiagram
  profiles ||--o{ staff_sessions : owns
  profiles ||--o{ orders : creates
  profiles ||--o{ payments : confirms
  categories ||--o{ products : contains
  products ||--o{ product_modifier_groups : has
  modifier_groups ||--o{ product_modifier_groups : applies
  modifier_groups ||--o{ modifier_options : contains
  orders ||--o{ order_items : contains
  order_items ||--o{ order_item_modifiers : contains
  orders ||--o{ payments : paid_by

  profiles {
    uniqueidentifier id PK
    uniqueidentifier auth_user_id UK
    nvarchar full_name
    nvarchar email UK
    nvarchar password_hash
    nvarchar role
    bit is_active
  }

  staff_sessions {
    uniqueidentifier id PK
    uniqueidentifier profile_id FK
    datetimeoffset expires_at
  }

  categories {
    uniqueidentifier id PK
    nvarchar name
    int sort_order
    bit is_active
  }

  products {
    uniqueidentifier id PK
    uniqueidentifier category_id FK
    nvarchar sku UK
    nvarchar name
    decimal price
    decimal cost
    bit is_available
    bit is_archived
  }

  modifier_groups {
    uniqueidentifier id PK
    nvarchar name
    bit is_required
    int min_select
    int max_select
  }

  modifier_options {
    uniqueidentifier id PK
    uniqueidentifier modifier_group_id FK
    nvarchar name
    decimal price_delta
  }

  product_modifier_groups {
    uniqueidentifier id PK
    uniqueidentifier product_id FK
    uniqueidentifier modifier_group_id FK
  }

  orders {
    uniqueidentifier id PK
    nvarchar order_number UK
    nvarchar receipt_number UK
    uniqueidentifier cashier_id FK
    nvarchar status
    nvarchar payment_status
    decimal total_amount
  }

  order_items {
    uniqueidentifier id PK
    uniqueidentifier order_id FK
    uniqueidentifier product_id FK
    nvarchar product_name
    int quantity
    decimal total_price
  }

  order_item_modifiers {
    uniqueidentifier id PK
    uniqueidentifier order_item_id FK
    nvarchar modifier_group_name
    nvarchar modifier_option_name
    decimal price_delta
  }

  payments {
    uniqueidentifier id PK
    uniqueidentifier order_id FK
    nvarchar payment_method
    decimal amount
    nvarchar status
  }
```

## 8. Live Queue Design

The MVP uses periodic refresh on the barista board. This avoids direct browser database access and keeps SQL Server credentials server-only.

Current behavior:

- The barista board refreshes every 5 seconds.
- Queue data is loaded through server-rendered data and server actions.
- Future versions can add SignalR, WebSocket fan-out, or a message broker if true push updates are required.

## 9. Security Notes

- Passwords are stored as PBKDF2 hashes.
- Staff sessions are stored in `staff_sessions` and referenced by an HTTP-only cookie.
- SQL Server credentials are server-only environment variables.
- Service functions enforce role checks before sensitive operations.
- Production SQL users should use least-privilege permissions.
