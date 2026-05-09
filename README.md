# POS Coffee

A modern point-of-sale web application for coffee shops, built to keep the counter, barista queue, product catalog, and sales reporting in one clear workflow.

POS Coffee is designed for a small cafe team that needs fast checkout, accurate order status tracking, role-based access, and a practical foundation for production deployment with Microsoft SQL Server.

## Highlights

- Fast cashier POS with product browsing, modifiers, cart totals, and checkout validation.
- Live barista queue with periodic refresh for paid orders, preparation flow, and pickup completion.
- Product management for categories, menu items, prices, availability, and modifiers.
- Order history and receipt pages for operational traceability.
- Sales dashboard with summary metrics and charts.
- Role-based access for admin, manager, cashier, and barista workflows.
- Microsoft SQL Server schema, seed data, server-side sessions, and password-based staff authentication.
- Focused unit and E2E test coverage for core POS behavior.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Microsoft SQL Server
- `mssql` Node.js driver
- PBKDF2 password hashing and HTTP-only session cookies
- Zustand for POS cart state
- Zod for validation
- Recharts for dashboard charts
- Vitest and Playwright

## Application Areas

| Area | Purpose |
| --- | --- |
| POS | Cashier product selection, modifiers, cart, payment, and order creation |
| Barista Queue | Live order preparation board with periodic refresh |
| Products | Menu and modifier management |
| Orders | Order lookup, detail view, receipt flow, and cancellation |
| Dashboard | Basic sales overview for managers and admins |
| Auth | Login, password recovery entry point, session protection, and role redirects |

## Getting Started

Install dependencies:

```powershell
npm.cmd install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Fill in the SQL Server values in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MSSQL_CONNECTION_STRING=
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=pos_coffee
MSSQL_USER=sa
MSSQL_PASSWORD=
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
MSSQL_POOL_MAX=10
```

Run the SQL scripts in order:

```text
database/mssql/schema.sql
database/mssql/seed.sql
```

Run the development server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Seeded users use `password123`:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Manager | `manager@example.com` |
| Cashier | `cashier@example.com` |
| Barista | `barista@example.com` |

## Verification

Run unit tests:

```powershell
npm.cmd run test
```

Run a production build:

```powershell
npm.cmd run build
```

Run E2E tests:

```powershell
npm.cmd run e2e
```

The Playwright checkout test is skipped automatically when SQL Server environment variables are not configured.

## Documentation

- `docs/coffee_pos_requirements.md` - product requirements
- `docs/system_architecture.md` - system architecture, modules, ER diagram, and deployment shape
- `docs/api_spec.md` - API and service contract reference
- `docs/deployment.md` - deployment and verification checklist
- `database/mssql/schema.sql` - SQL Server schema
- `database/mssql/seed.sql` - starter data and demo staff users

## Current MVP Status

The MVP foundation is complete:

- 14 of 14 implementation tasks completed.
- SQL Server data access is implemented.
- Unit tests pass.
- Production build passes.
- E2E suite is available and skips only when SQL Server runtime configuration is intentionally absent.

## Repository

Remote:

```text
https://github.com/apiwatapply-svg/POS_coffee.git
```

Active branch:

```text
main
```
