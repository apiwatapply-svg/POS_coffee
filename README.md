# POS Coffee

A modern point-of-sale web application for coffee shops, built to keep the counter, barista queue, product catalog, and sales reporting in one clear workflow.

POS Coffee is designed for a small cafe team that needs fast checkout, accurate order status tracking, role-based access, and a practical foundation for production deployment.

## Highlights

- Fast cashier POS with product browsing, modifiers, cart totals, and checkout validation.
- Realtime barista queue for paid orders, preparation flow, and pickup completion.
- Product management for categories, menu items, prices, availability, and modifiers.
- Order history and receipt pages for operational traceability.
- Sales dashboard with summary metrics and charts.
- Role-based access for admin, manager, cashier, and barista workflows.
- Supabase-backed authentication, database schema, RLS policies, seed data, and realtime subscriptions.
- Focused unit and E2E test coverage for core POS behavior.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, RLS, and Realtime
- Zustand for POS cart state
- Zod for validation
- Recharts for dashboard charts
- Vitest and Playwright

## Application Areas

| Area | Purpose |
| --- | --- |
| POS | Cashier product selection, modifiers, cart, payment, and order creation |
| Barista Queue | Realtime order preparation board |
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

Fill in the Supabase values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run the development server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Supabase Setup

1. Create a Supabase project.
2. Apply the SQL migrations in `supabase/migrations`.
3. Run `supabase/seed.sql` for starter categories, products, modifiers, and store settings.
4. Enable email/password authentication.
5. Create staff users and matching rows in `profiles`.
6. Enable Realtime for `orders`, `order_items`, and `order_item_modifiers`.

More details are available in `docs/deployment.md`.

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

The Playwright checkout test is skipped automatically when Supabase environment variables are not configured.

## Documentation

- `docs/coffee_pos_requirements.md` - product requirements
- `docs/system_architecture.md` - system architecture, modules, ER diagram, and deployment shape
- `docs/api_spec.md` - API and service contract reference
- `docs/deployment.md` - deployment and verification checklist
- `docs/superpowers/plans/2026-05-09-coffee-pos-mvp.md` - implementation plan and task breakdown

## Current MVP Status

The MVP foundation is complete:

- 14 of 14 implementation tasks completed.
- Unit tests pass.
- Production build passes.
- E2E suite is available and skips only when Supabase runtime configuration is intentionally absent.

## Repository

Remote:

```text
https://github.com/apiwatapply-svg/POS_coffee.git
```

Active branch:

```text
feature/mvp-foundation
```
