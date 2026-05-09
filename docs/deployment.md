# Deployment

## Microsoft SQL Server

1. Create a SQL Server database, for example `pos_coffee`.
2. Run `mssql/schema.sql`.
3. Run `mssql/seed.sql` for starter categories, products, modifiers, store settings, and demo staff users.
4. Create a least-privilege SQL login for the application.
5. Configure network access from the hosting provider to SQL Server.
6. Configure backups and retention for production.

Seeded staff users use `password123`:

| Role | Email |
| --- | --- |
| Admin | `admin@example.com` |
| Manager | `manager@example.com` |
| Cashier | `cashier@example.com` |
| Barista | `barista@example.com` |

## Required Environment Variables

Set these in local `.env.local` and production project settings:

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

Use either `MSSQL_CONNECTION_STRING` or the individual `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_USER`, and `MSSQL_PASSWORD` fields.

Production example:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
```

## Vercel

1. Connect the Git repository to Vercel.
2. Set the required environment variables.
3. Use the `main` branch for production deployments.
4. Use pull requests for preview deployments.
5. Confirm the production build command is:

```powershell
npm.cmd run build
```

## Local Verification

Use the correctly cased project path on Windows:

```powershell
cd C:\Users\FDB-MM-024\Documents\My_Project\POS_coffee
```

Run:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run e2e
```

E2E behavior:

- Without SQL Server env vars, the Playwright checkout test is skipped.
- With SQL Server env vars and seeded users, the Playwright checkout test runs the full cashier-to-barista flow.

## Release Checklist

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run e2e` passes or skips only because SQL Server env vars are intentionally absent.
- [ ] `mssql/schema.sql` is applied.
- [ ] `mssql/seed.sql` is applied in non-production environments.
- [ ] Production staff users have unique passwords.
- [ ] Application SQL login uses least-privilege permissions.
- [ ] SQL Server backups are configured.
- [ ] Admin, Manager, Cashier, and Barista login flows are verified.
