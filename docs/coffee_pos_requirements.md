# Coffee POS Web Application - Requirement Specification

**Project Name:** Coffee POS Web Application  
**Document Type:** Software Requirement Specification  
**Version:** 2.0  
**Target Platform:** Web Application  
**Frontend:** Node.js / Next.js  
**Backend / Database:** Microsoft SQL Server  
**Deployment:** Vercel plus managed or self-hosted SQL Server  
**Version Control:** Git

## Related Technical Documents

- [System Architecture and ER Diagram](./system_architecture.md)
- [API and Server Action Specification](./api_spec.md)
- [Deployment Guide](./deployment.md)

## 1. Project Overview

The Coffee POS Web Application is a web-based point-of-sale system for coffee shops, cafes, and small beverage businesses. The system allows staff to sell products quickly, manage orders, send drink preparation tasks to baristas, track sales, manage products, and control user access based on roles.

The application should be optimized for tablet devices, touchscreen usage, and fast cashier operation. The barista queue should refresh automatically at a short interval so staff can see newly paid orders without exposing database credentials to the browser.

## 2. Business Objectives

1. Reduce order-taking time at the cashier counter.
2. Improve order accuracy through drink customization.
3. Provide clear communication between cashier and barista.
4. Track daily sales, payment methods, and best-selling products.
5. Manage products, categories, modifiers, and starter store settings.
6. Support Admin, Manager, Cashier, and Barista roles.
7. Provide a scalable foundation for loyalty, inventory, online ordering, and multi-branch support.

## 3. Technology Stack

### 3.1 Frontend

- Node.js
- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod for validation
- Zustand for POS cart state
- Recharts for dashboard charts

### 3.2 Backend and Database

- Next.js Server Actions
- Microsoft SQL Server
- `mssql` Node.js driver
- SQL Server transactions for checkout
- HTTP-only cookie sessions
- PBKDF2 password hashing

### 3.3 Deployment

- Vercel for the web application
- Managed or self-hosted Microsoft SQL Server
- Environment variables for SQL Server credentials

## 4. User Roles and Permissions

| Role | Permissions |
| --- | --- |
| Admin | Full access to dashboard, products, orders, reports, settings, and staff operations |
| Manager | Store operations, product management, order history, dashboard, reports, and allowed cancellations |
| Cashier | POS, checkout, receipts, and own order history |
| Barista | Active drink queue and order preparation status updates |

## 5. System Pages

| Page | URL | Main Role |
| --- | --- | --- |
| Login | `/login` | All users |
| Forgot Password | `/forgot-password` | All users |
| POS | `/pos` | Cashier, Manager, Admin |
| Receipt | `/receipt/:orderId` | Cashier, Manager, Admin |
| Barista Display | `/barista` | Barista, Manager, Admin |
| Dashboard | `/dashboard` | Manager, Admin |
| Products | `/products` | Manager, Admin |
| Product Create/Edit | `/products/create`, `/products/:id/edit` | Manager, Admin |
| Orders History | `/orders` | Cashier, Manager, Admin |
| Order Detail | `/orders/:id` | Cashier, Manager, Admin |

## 6. Core Functional Requirements

### 6.1 Authentication

- Staff can sign in with email and password.
- Passwords must be verified against PBKDF2 password hashes.
- Successful login creates a server-side session in `staff_sessions`.
- The browser stores only an HTTP-only `pos_session` cookie.
- Disabled users cannot log in.
- Users are redirected by role after login.

### 6.2 POS

- Cashier can browse available products.
- Cashier can select modifiers such as size, temperature, sweetness, milk type, and add-ons.
- Cart totals must include modifier price changes, discount, VAT, service charge, and final total.
- Cash payment must validate received amount and change.
- QR payment must require confirmation before checkout.
- Checkout must create order, items, modifiers, and payment in a SQL Server transaction.

### 6.3 Barista Queue

- Barista can view paid active orders.
- Active statuses are `pending`, `preparing`, and `ready`.
- Barista can update status from pending to preparing, preparing to ready, and ready to completed.
- Queue data refreshes automatically at a short interval.

### 6.4 Product Management

- Manager and Admin can create products.
- Manager and Admin can update products.
- Manager and Admin can archive products instead of deleting them.
- SKU must be unique.

### 6.5 Orders

- Admin and Manager can view all orders.
- Cashier can view only their own orders.
- Order detail must show cashier name, items, modifiers, payments, and store settings.
- Admin and Manager can cancel allowed orders with a reason.

### 6.6 Dashboard

- Dashboard shows daily sales total.
- Dashboard shows daily order count.
- Dashboard shows average order value.
- Dashboard shows best-selling product.
- Dashboard shows hourly sales and payment method summary.
- Dashboard shows recent orders.

## 7. Data Requirements

The MVP database must include:

- `profiles`
- `staff_sessions`
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

SQL Server scripts are stored in:

```text
mssql/schema.sql
mssql/seed.sql
```

## 8. Security Requirements

- Database credentials must never be exposed to client code.
- All SQL queries must use parameterized inputs.
- Checkout must use a database transaction.
- Passwords must never be stored in plain text.
- Session cookies must be HTTP-only.
- Production SQL users should use least-privilege permissions.
- Protected pages must check the current profile and role before rendering.

## 9. Acceptance Criteria

- Staff login works with seeded users.
- Role-based redirects work.
- Cashier can create a paid order.
- Receipt page renders created order data.
- Barista can move an order through the preparation flow.
- Manager/Admin can manage products.
- Dashboard renders daily metrics.
- `npm.cmd run test` passes.
- `npm.cmd run build` passes.
- Playwright E2E runs when SQL Server is configured, or skips when SQL Server env vars are intentionally absent.

## 10. Recommended Folder Structure

```text
coffee-pos/
|-- app/
|-- components/
|-- docs/
|-- hooks/
|-- lib/
|   |-- auth/
|   |-- calculations/
|   |-- mssql/
|   |-- services/
|   `-- validations/
|-- mssql/
|-- stores/
|-- tests/
`-- types/
```
