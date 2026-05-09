# Coffee POS MVP Implementation Plan

**Status:** Completed  
**Current Database:** Microsoft SQL Server  
**Branch:** `main`

## Completed Scope

1. Bootstrap Next.js application.
2. Add TypeScript, Tailwind CSS, and core project structure.
3. Add SQL Server data access through `mssql`.
4. Add SQL Server schema and seed scripts.
5. Add staff authentication with PBKDF2 password hashes and HTTP-only sessions.
6. Add role guards for Admin, Manager, Cashier, and Barista.
7. Add product management.
8. Add POS catalog and cart.
9. Add checkout with SQL Server transaction handling.
10. Add receipt page.
11. Add barista queue with live polling refresh.
12. Add order history and detail pages.
13. Add basic sales dashboard.
14. Add unit and E2E test coverage.
15. Add deployment and architecture documentation.

## Current Architecture

- Next.js App Router for pages and server actions.
- SQL Server as the operational database.
- `lib/mssql/client.ts` for pooled connections, parameterized queries, and transactions.
- `lib/auth/session.ts` for server-side session persistence.
- `lib/auth/password.ts` for PBKDF2 password hashing and verification.
- `lib/services/*` for business use cases.
- `mssql/schema.sql` and `mssql/seed.sql` for database setup.

## Verification Commands

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run e2e
```

The E2E suite skips the checkout flow when SQL Server environment variables are intentionally absent.
