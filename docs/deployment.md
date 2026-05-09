# Deployment

## Supabase

1. Create a Supabase project.
2. Apply migrations from `supabase/migrations`.
3. Run `supabase/seed.sql` for initial categories, products, modifiers, and store settings.
4. Enable Auth email/password provider.
5. Create staff Auth users for test and production use.
6. Insert matching `profiles` rows for each Auth user with one of these roles: `admin`, `manager`, `cashier`, `barista`.
7. Configure Auth redirect URLs:
   - Local: `http://localhost:3000`
   - Production: `https://your-vercel-domain.vercel.app`
8. Enable Realtime for these tables:
   - `orders`
   - `order_items`
   - `order_item_modifiers`
9. Create a Storage bucket for product images and store logo when image upload is implemented.

## Required Environment Variables

Set these in local `.env.local` and Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production example:

```env
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

## Vercel

1. Connect the Git repository to Vercel.
2. Set the required environment variables.
3. Use the main branch for production deployments.
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

- Without Supabase env vars, the Playwright checkout test is skipped.
- With Supabase env vars and seeded users, the Playwright checkout test runs the full cashier-to-barista flow.

Required seeded users for E2E:

| Role | Email | Password |
|---|---|---|
| Cashier | `cashier@example.com` | `password123` |
| Barista | `barista@example.com` | `password123` |

## Supabase Migration Verification

`npx.cmd supabase db lint` requires a running local Supabase database on the default local port. Start Supabase locally or connect to the intended project before running migration lint.

Expected command:

```powershell
npx.cmd supabase db lint
```

## Release Checklist

- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run e2e` passes or skips only because Supabase env vars are intentionally absent.
- [ ] Supabase migrations are applied.
- [ ] RLS policies are enabled.
- [ ] Realtime is enabled for order queue tables.
- [ ] Vercel environment variables are configured.
- [ ] Service role key is not exposed to browser code.
- [ ] Admin, Manager, Cashier, and Barista login flows are verified.
