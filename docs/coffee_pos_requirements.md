# Coffee POS Web Application - Detailed Requirement Specification

**Project Name:** Coffee POS Web Application  
**Document Type:** Software Requirement Specification (SRS)  
**Version:** 1.0  
**Target Platform:** Web Application  
**Frontend:** Node.js / Next.js  
**Backend / Database:** Supabase  
**Deployment:** Vercel  
**Version Control:** Git

---

## Related Technical Documents

- [System Architecture and ER Diagram](./system_architecture.md)
- [API and Server Action Specification](./api_spec.md)
- [MVP Implementation Plan](./superpowers/plans/2026-05-09-coffee-pos-mvp.md)

---

## 1. Project Overview

The Coffee POS Web Application is a web-based Point of Sale system designed for coffee shops, cafes, and small beverage businesses. The system must allow staff to sell coffee and other products quickly, manage orders, send drink preparation tasks to baristas, track inventory, manage products, view sales reports, and control user access based on roles.

The application should be optimized for tablet devices, touchscreen usage, and fast cashier operation. It should support real-time order queue updates so that baristas can see new orders immediately after payment or order confirmation.

---

## 2. Business Objectives

The main objectives of the system are:

1. Reduce order-taking time at the cashier counter.
2. Improve order accuracy by allowing detailed drink customization.
3. Provide real-time communication between cashier and barista.
4. Track daily sales, payment methods, and best-selling products.
5. Manage coffee shop products, add-ons, modifiers, and inventory.
6. Support user roles such as Admin, Manager, Cashier, and Barista.
7. Provide a scalable foundation for future features such as loyalty points, multi-branch stores, online ordering, and delivery integration.

---

## 3. Technology Stack

### 3.1 Frontend

- Node.js
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form for form handling
- Zod for validation
- Zustand or Redux Toolkit for POS cart state
- TanStack Query or SWR for server state
- Recharts for dashboard charts

### 3.2 Backend and Database

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Row Level Security (RLS)
- Supabase Edge Functions if required for server-side business logic

### 3.3 Deployment

- Vercel for frontend deployment
- Supabase cloud for database and authentication

### 3.4 Version Control

- Git
- GitHub or GitLab
- Pull Request based development workflow

---

## 4. User Roles and Permissions

### 4.1 Owner / Admin

The Owner or Admin has full access to the system.

Permissions:

- Access dashboard.
- Manage products.
- Manage categories.
- Manage modifiers and add-ons.
- Manage inventory.
- Manage staff accounts.
- Manage customers.
- View all orders.
- Refund and cancel orders.
- View all reports.
- Configure store settings.
- Manage tax and receipt settings.
- Export reports.

### 4.2 Manager

The Manager can operate and manage store operations but cannot fully control owner-level settings.

Permissions:

- Access dashboard.
- Manage products.
- Manage categories.
- Manage modifiers.
- Manage inventory.
- View orders.
- View reports.
- Refund and cancel orders if allowed by store setting.
- Cannot delete or disable Admin accounts.
- Cannot change critical store settings.

### 4.3 Cashier

The Cashier handles sales transactions.

Permissions:

- Access POS page.
- Create orders.
- Apply allowed discounts.
- Accept payments.
- Print receipts.
- View own orders.
- Suspend and resume orders.
- Cannot view sales reports unless allowed.
- Cannot manage products or staff.

### 4.4 Barista

The Barista handles drink preparation.

Permissions:

- Access Barista Display page.
- View active drink orders.
- Update preparation status.
- Mark orders as ready or completed.
- Cannot access payments, reports, product costs, or settings.

---

## 5. System Page List

The complete system should include the following pages:

| No. | Page Name | URL | Main Role |
|---:|---|---|---|
| 1 | Login Page | /login | All users |
| 2 | Forgot Password Page | /forgot-password | All users |
| 3 | POS Page | /pos | Cashier, Manager, Admin |
| 4 | Checkout Modal / Panel | /pos checkout modal | Cashier, Manager, Admin |
| 5 | Receipt Page | /receipt/:orderId | Cashier, Manager, Admin |
| 6 | Barista Display Page | /barista | Barista, Manager, Admin |
| 7 | Order Queue Page | /orders/queue | Manager, Admin |
| 8 | Dashboard Page | /dashboard | Manager, Admin |
| 9 | Products Page | /products | Manager, Admin |
| 10 | Product Create / Edit Page | /products/create, /products/:id/edit | Manager, Admin |
| 11 | Categories Page | /categories | Manager, Admin |
| 12 | Modifiers Page | /modifiers | Manager, Admin |
| 13 | Orders History Page | /orders | Cashier, Manager, Admin |
| 14 | Order Detail Page | /orders/:id | Cashier, Manager, Admin |
| 15 | Inventory Page | /inventory | Manager, Admin |
| 16 | Stock Movement Page | /inventory/movements | Manager, Admin |
| 17 | Customers Page | /customers | Cashier, Manager, Admin |
| 18 | Staff Management Page | /staff | Admin |
| 19 | Reports Page | /reports | Manager, Admin |
| 20 | Settings Page | /settings | Admin |
| 21 | Audit Log Page | /audit-logs | Admin |

---

## 6. Detailed Page Requirements

## 6.1 Login Page

### URL

`/login`

### Purpose

Allow registered staff to sign in to the Coffee POS system.

### UI Components

- Store logo.
- Email input.
- Password input.
- Login button.
- Forgot password link.
- Loading indicator.
- Error message display.

### Functional Requirements

- User must enter email and password.
- System must authenticate using Supabase Auth.
- User role must be loaded after successful login.
- System must redirect user based on role.
- Disabled users must not be able to login.

### Validation Rules

- Email is required.
- Email must be valid format.
- Password is required.
- Password must not be empty.

### Redirect Rules

- Admin -> `/dashboard`
- Manager -> `/dashboard`
- Cashier -> `/pos`
- Barista -> `/barista`

### Error Handling

- Invalid email or password: show "Invalid email or password".
- Account disabled: show "Your account has been disabled. Please contact Admin".
- Network error: show "Unable to connect. Please try again".

---

## 6.2 Forgot Password Page

### URL

`/forgot-password`

### Purpose

Allow users to request password reset email.

### UI Components

- Email input.
- Send reset link button.
- Back to login link.
- Success message.
- Error message.

### Functional Requirements

- User enters email.
- System sends reset email using Supabase Auth.
- System shows success message even if email does not exist for security reasons.

---

## 6.3 POS Page

### URL

`/pos`

### Purpose

The main cashier screen for creating orders and accepting payments.

### Layout

The POS page should be split into two main sections:

1. Product selection area.
2. Cart and order summary area.

### Product Selection Area

Components:

- Product search input.
- Category filter tabs.
- Product grid.
- Product card.
- Product image.
- Product name.
- Product price.
- Product availability status.
- Out of stock indicator.

Product card must show:

- Product image.
- Product name.
- Base price.
- Category.
- Unavailable or sold-out label when applicable.

### Cart Area

Components:

- Current order number or temporary cart ID.
- List of selected items.
- Quantity increase button.
- Quantity decrease button.
- Remove item button.
- Item modifier summary.
- Item note.
- Subtotal.
- Discount.
- VAT.
- Service charge.
- Grand total.
- Suspend order button.
- Clear cart button.
- Checkout button.

### Product Customization

When a product is selected, the system should open a modifier modal if the product has modifiers.

Modifier examples:

- Cup size: Small, Medium, Large.
- Temperature: Hot, Iced, Frappe.
- Sweetness: 0%, 25%, 50%, 75%, 100%.
- Ice level: No ice, Less ice, Normal ice, Extra ice.
- Milk option: Fresh milk, Oat milk, Soy milk, Almond milk.
- Add-ons: Extra shot, Syrup, Whipped cream, Brown sugar pearl.

### Functional Requirements

- Cashier can search products by name or SKU.
- Cashier can filter products by category.
- Cashier can add products to cart.
- Cashier can select required modifiers before adding to cart.
- Cashier can edit item modifiers after adding to cart.
- Cashier can add notes to each item.
- Cashier can change quantity.
- Cashier can remove item.
- System must calculate price in real time.
- System must block checkout if cart is empty.
- System must block adding unavailable products.
- System should support suspended orders.

### Calculation Rules

Item total:

`Item Total = (Base Price + Sum of Modifier Price) x Quantity`

Order subtotal:

`Subtotal = Sum of all item totals`

Discount:

`Discount can be fixed amount or percentage depending on store setting`

VAT:

`VAT = (Subtotal - Discount) x VAT Rate`

Service charge:

`Service Charge = (Subtotal - Discount) x Service Charge Rate`

Grand total:

`Grand Total = Subtotal - Discount + VAT + Service Charge`

### Important Missing Requirement Added

The POS page must support offline-safe UI behavior. If internet connection is temporarily lost, the system should show a warning and prevent final payment confirmation until connection is restored. This is important because Supabase requires network connection to save order and payment data.

---

## 6.4 Checkout Modal / Panel

### Purpose

Confirm payment and complete the order.

### UI Components

- Order item summary.
- Subtotal.
- Discount.
- VAT.
- Service charge.
- Grand total.
- Payment method selector.
- Cash received input.
- Change calculation.
- Payment confirmation checkbox for QR payment.
- Confirm payment button.
- Cancel button.

### Supported Payment Methods

- Cash.
- PromptPay QR.
- QR Payment.
- Credit card.
- E-wallet.
- Mixed payment optional for future version.

### Cash Payment Rules

- Cash received amount must be greater than or equal to grand total.
- Change must be calculated automatically.

Formula:

`Change = Cash Received - Grand Total`

### QR Payment Rules

- Cashier must confirm that payment has been received.
- Optional upload slip feature can be added in future version.

### Functional Requirements

- On confirm payment, system must create order record.
- System must create order item records.
- System must create payment record.
- System must deduct inventory if stock tracking is enabled.
- System must send order to barista queue.
- System must generate receipt number.
- System must redirect to receipt page or show receipt modal.

### Error Handling

- If payment save fails, order must not be marked as paid.
- If inventory deduction fails, system must rollback transaction or show admin warning.
- If receipt generation fails, order must still be saved and receipt can be reprinted later.

---

## 6.5 Receipt Page

### URL

`/receipt/:orderId`

### Purpose

Display printable receipt for completed order.

### UI Components

- Store logo.
- Store name.
- Store address.
- Store phone number.
- Tax ID.
- Receipt number.
- Order number.
- Date and time.
- Cashier name.
- Customer name if available.
- Item list.
- Modifiers under each item.
- Item quantity.
- Item price.
- Subtotal.
- Discount.
- VAT.
- Service charge.
- Grand total.
- Payment method.
- Cash received.
- Change.
- Receipt footer message.
- Print button.
- Back to POS button.

### Functional Requirements

- Receipt can be printed.
- Receipt can be reprinted from order history.
- Receipt layout must support thermal printer width such as 58mm or 80mm.
- Receipt must include refund or cancelled status if applicable.

---

## 6.6 Barista Display Page

### URL

`/barista`

### Purpose

Allow baristas to view and update drink preparation orders in real time.

### UI Components

- Order queue cards.
- Order number.
- Queue number.
- Order time.
- Elapsed preparation time.
- Drink list.
- Modifiers.
- Item notes.
- Order notes.
- Start button.
- Ready button.
- Complete button.

### Order Status Flow

1. Pending
2. Preparing
3. Ready
4. Completed
5. Cancelled

### Functional Requirements

- New paid orders must appear in real time.
- Barista can mark order as Preparing.
- Barista can mark order as Ready.
- Barista can mark order as Completed.
- Cancelled orders should disappear or show cancelled label.
- Orders should be sorted by creation time.
- Long-waiting orders should be visually highlighted.

### Real-time Requirement

Use Supabase Realtime subscription on the orders table and order_items table.

---

## 6.7 Dashboard Page

### URL

`/dashboard`

### Purpose

Display key business performance metrics.

### UI Components

- Total sales today.
- Total orders today.
- Total cups sold today.
- Average order value.
- Best-selling product today.
- Sales by hour chart.
- Sales last 7 days chart.
- Payment method summary.
- Low stock alert.
- Recent orders table.

### Metrics

Average Order Value:

`AOV = Total Sales / Number of Orders`

Total Cups Sold:

`Total Cups Sold = Sum of quantity for beverage category products`

### Access

Admin and Manager only.

---

## 6.8 Products Page

### URL

`/products`

### Purpose

Manage sellable menu items.

### UI Components

- Product table.
- Product image.
- Product name.
- SKU.
- Category.
- Selling price.
- Cost price.
- Availability status.
- Stock tracking status.
- Search input.
- Category filter.
- Status filter.
- Add product button.
- Edit button.
- Archive button.

### Functional Requirements

- Admin or Manager can create product.
- Admin or Manager can edit product.
- Admin or Manager can archive product.
- Product should not be physically deleted if it has sales history.
- Archived products should not appear on POS.

---

## 6.9 Product Create / Edit Page

### URL

`/products/create`  
`/products/:id/edit`

### Fields

- Product name.
- SKU.
- Category.
- Description.
- Product image.
- Selling price.
- Cost price.
- Availability status.
- Track stock status.
- Linked inventory recipe.
- Modifier groups.
- Sort order.

### Validation Rules

- Product name is required.
- SKU must be unique.
- Selling price must be greater than 0.
- Cost price cannot be negative.
- Product image must be valid image file.

### Important Missing Requirement Added: Product Recipe

For coffee shops, inventory should not only track product stock. The system should support recipe-based inventory deduction.

Example:

Latte uses:

- Coffee beans: 18g.
- Milk: 200ml.
- Cup 16oz: 1 piece.
- Lid 16oz: 1 piece.

When one Latte is sold, the system deducts each ingredient according to the recipe.

---

## 6.10 Categories Page

### URL

`/categories`

### Purpose

Manage product categories shown in POS.

### Fields

- Category name.
- Description.
- Display order.
- Active status.
- Color or icon optional.

### Functional Requirements

- Category can be created.
- Category can be edited.
- Category can be disabled.
- Disabled categories should not appear on POS.

---

## 6.11 Modifiers / Add-ons Page

### URL

`/modifiers`

### Purpose

Manage product customization options.

### Modifier Group Fields

- Group name.
- Required or optional.
- Minimum selection.
- Maximum selection.
- Active status.
- Sort order.

### Modifier Option Fields

- Option name.
- Additional price.
- Active status.
- Sort order.

### Example Modifier Groups

Cup Size:

- Small: +0.
- Medium: +10.
- Large: +20.

Sweetness:

- 0%: +0.
- 25%: +0.
- 50%: +0.
- 75%: +0.
- 100%: +0.

Milk Type:

- Fresh Milk: +0.
- Oat Milk: +20.
- Soy Milk: +15.

Add-ons:

- Extra Shot: +20.
- Syrup: +10.
- Whipped Cream: +15.

### Functional Requirements

- Modifier groups can be assigned to products.
- Required modifier groups must be selected before adding item to cart.
- Optional modifier groups can be skipped.
- Modifier price must be included in item total.

---

## 6.12 Orders History Page

### URL

`/orders`

### Purpose

View and search historical orders.

### UI Components

- Orders table.
- Order number.
- Receipt number.
- Date and time.
- Cashier.
- Customer.
- Total amount.
- Payment method.
- Order status.
- Payment status.
- View detail button.
- Reprint receipt button.

### Filters

- Date range.
- Cashier.
- Payment method.
- Order status.
- Customer.
- Order number.

### Functional Requirements

- Cashier can see own orders.
- Admin and Manager can see all orders.
- Admin and Manager can refund or cancel orders depending on permission.

---

## 6.13 Order Detail Page

### URL

`/orders/:id`

### Purpose

View complete order details.

### UI Components

- Order information.
- Customer information.
- Cashier information.
- Order item list.
- Modifier details.
- Payment details.
- Receipt preview.
- Status history.
- Refund button.
- Cancel button.
- Print button.

### Functional Requirements

- Show complete order lifecycle.
- Allow receipt reprint.
- Allow refund with reason.
- Allow cancellation with reason.
- Store audit log for sensitive actions.

---

## 6.14 Inventory Page

### URL

`/inventory`

### Purpose

Manage ingredients and physical stock.

### UI Components

- Inventory item table.
- Item name.
- Unit.
- Current quantity.
- Low stock threshold.
- Cost per unit.
- Status.
- Stock In button.
- Stock Out button.
- Adjust Stock button.

### Example Inventory Items

- Coffee beans.
- Fresh milk.
- Oat milk.
- Chocolate powder.
- Matcha powder.
- Syrup.
- Cup 16oz.
- Cup 22oz.
- Lids.
- Straws.
- Tissue.

### Status Rules

- Normal: quantity greater than low stock threshold.
- Low Stock: quantity less than or equal to low stock threshold.
- Out of Stock: quantity is 0.

---

## 6.15 Stock Movement Page

### URL

`/inventory/movements`

### Purpose

Track all inventory transactions.

### Movement Types

- Stock In.
- Stock Out.
- Sale.
- Waste.
- Return.
- Adjustment.
- Refund restore.

### Fields

- Inventory item.
- Movement type.
- Quantity before.
- Quantity changed.
- Quantity after.
- Reference order.
- Created by.
- Created at.
- Note.

### Functional Requirements

- Every inventory change must create stock movement record.
- Stock movement should not be deleted.
- Admin can filter by date, item, movement type, or user.

---

## 6.16 Customers Page

### URL

`/customers`

### Purpose

Manage customer information and loyalty data.

### Fields

- Customer name.
- Phone number.
- Email.
- Birthday optional.
- Loyalty points.
- Total spending.
- Total orders.
- Last purchase date.

### Functional Requirements

- Cashier can search customer by phone number.
- Cashier can attach customer to order.
- System can calculate loyalty points.
- Admin can edit customer information.

### Loyalty Point Rule Example

`1 point for every 100 THB spent`

Points can be redeemed as discount if enabled by store setting.

---

## 6.17 Staff Management Page

### URL

`/staff`

### Purpose

Manage employee accounts and permissions.

### Fields

- Full name.
- Email.
- Role.
- Phone.
- Active status.
- Last login.
- Created date.

### Functional Requirements

- Admin can create staff account.
- Admin can assign role.
- Admin can disable account.
- Admin can reset password.
- Admin cannot accidentally delete own account.

---

## 6.18 Reports Page

### URL

`/reports`

### Purpose

Provide sales and operational reports.

### Report Types

- Daily sales report.
- Monthly sales report.
- Sales by product.
- Sales by category.
- Sales by staff.
- Sales by payment method.
- Discount report.
- Refund report.
- Inventory usage report.
- Best seller report.
- Hourly sales report.

### Export Features

- Export CSV.
- Export Excel.
- Export PDF optional.

### Required Filters

- Date range.
- Staff.
- Product.
- Category.
- Payment method.
- Branch optional for future.

---

## 6.19 Settings Page

### URL

`/settings`

### Purpose

Configure store settings.

### Store Information

- Store name.
- Logo.
- Address.
- Phone number.
- Tax ID.
- Currency.
- Timezone.

### Sales Settings

- VAT enabled.
- VAT rate.
- Service charge enabled.
- Service charge rate.
- Allow discount.
- Maximum discount percentage for cashier.
- Allow refund.
- Allow order cancellation.

### Receipt Settings

- Receipt prefix.
- Receipt running number.
- Receipt header.
- Receipt footer.
- Show tax ID.
- Show QR code.
- Printer paper size: 58mm or 80mm.

---

## 6.20 Audit Log Page

### URL

`/audit-logs`

### Purpose

Track important system actions for security and accountability.

### Logged Actions

- Login.
- Logout.
- Create order.
- Cancel order.
- Refund order.
- Change product price.
- Change inventory quantity.
- Create staff.
- Disable staff.
- Change settings.

### Fields

- User.
- Action type.
- Entity type.
- Entity ID.
- Old value.
- New value.
- IP address optional.
- Created at.

---

## 7. Database Design

The system should use Supabase PostgreSQL.

### 7.1 profiles

Stores staff profile data linked to Supabase Auth.

Fields:

- id uuid primary key.
- auth_user_id uuid.
- full_name text.
- email text.
- phone text.
- role text.
- is_active boolean.
- created_at timestamp.
- updated_at timestamp.

### 7.2 categories

Fields:

- id uuid primary key.
- name text.
- description text.
- sort_order integer.
- is_active boolean.
- created_at timestamp.
- updated_at timestamp.

### 7.3 products

Fields:

- id uuid primary key.
- category_id uuid foreign key.
- sku text unique.
- name text.
- description text.
- image_url text.
- price numeric.
- cost numeric.
- is_available boolean.
- is_archived boolean.
- track_stock boolean.
- sort_order integer.
- created_at timestamp.
- updated_at timestamp.

### 7.4 modifier_groups

Fields:

- id uuid primary key.
- name text.
- is_required boolean.
- min_select integer.
- max_select integer.
- is_active boolean.
- sort_order integer.

### 7.5 modifier_options

Fields:

- id uuid primary key.
- modifier_group_id uuid foreign key.
- name text.
- price_delta numeric.
- is_active boolean.
- sort_order integer.

### 7.6 product_modifier_groups

Fields:

- id uuid primary key.
- product_id uuid foreign key.
- modifier_group_id uuid foreign key.

### 7.7 orders

Fields:

- id uuid primary key.
- order_number text unique.
- receipt_number text unique.
- customer_id uuid nullable.
- cashier_id uuid.
- status text.
- payment_status text.
- subtotal numeric.
- discount_amount numeric.
- vat_amount numeric.
- service_charge_amount numeric.
- total_amount numeric.
- order_type text.
- note text.
- created_at timestamp.
- updated_at timestamp.

### 7.8 order_items

Fields:

- id uuid primary key.
- order_id uuid foreign key.
- product_id uuid.
- product_name text.
- quantity integer.
- base_price numeric.
- modifier_total numeric.
- unit_price numeric.
- total_price numeric.
- note text.

### 7.9 order_item_modifiers

Fields:

- id uuid primary key.
- order_item_id uuid foreign key.
- modifier_group_name text.
- modifier_option_name text.
- price_delta numeric.

### 7.10 payments

Fields:

- id uuid primary key.
- order_id uuid foreign key.
- payment_method text.
- amount numeric.
- received_amount numeric.
- change_amount numeric.
- status text.
- transaction_ref text.
- paid_at timestamp.
- created_by uuid.

### 7.11 inventory_items

Fields:

- id uuid primary key.
- name text.
- unit text.
- quantity numeric.
- low_stock_threshold numeric.
- cost_per_unit numeric.
- is_active boolean.
- created_at timestamp.
- updated_at timestamp.

### 7.12 product_recipes

Fields:

- id uuid primary key.
- product_id uuid foreign key.
- inventory_item_id uuid foreign key.
- quantity_required numeric.
- unit text.

Purpose:

Defines how much inventory is consumed when one product is sold.

### 7.13 stock_movements

Fields:

- id uuid primary key.
- inventory_item_id uuid foreign key.
- movement_type text.
- quantity_before numeric.
- quantity_change numeric.
- quantity_after numeric.
- reference_order_id uuid nullable.
- note text.
- created_by uuid.
- created_at timestamp.

### 7.14 customers

Fields:

- id uuid primary key.
- name text.
- phone text unique.
- email text.
- points integer.
- total_spent numeric.
- total_orders integer.
- last_order_at timestamp.
- created_at timestamp.
- updated_at timestamp.

### 7.15 store_settings

Fields:

- id uuid primary key.
- store_name text.
- logo_url text.
- address text.
- phone text.
- tax_id text.
- currency text.
- timezone text.
- vat_enabled boolean.
- vat_rate numeric.
- service_charge_enabled boolean.
- service_charge_rate numeric.
- receipt_prefix text.
- receipt_footer text.
- printer_paper_size text.
- updated_at timestamp.

### 7.16 audit_logs

Fields:

- id uuid primary key.
- user_id uuid.
- action_type text.
- entity_type text.
- entity_id uuid.
- old_value jsonb.
- new_value jsonb.
- ip_address text.
- created_at timestamp.

---

## 8. API / Server Action Requirements

Even when using Supabase directly, the system should separate business logic into service functions or Next.js server actions.

### 8.1 Authentication APIs

- login(email, password)
- logout()
- getCurrentUser()
- getUserRole()

### 8.2 Product APIs

- getProducts()
- getProductById(id)
- createProduct(data)
- updateProduct(id, data)
- archiveProduct(id)
- uploadProductImage(file)

### 8.3 Order APIs

- createOrder(cart, paymentData)
- getOrders(filters)
- getOrderById(id)
- updateOrderStatus(orderId, status)
- cancelOrder(orderId, reason)
- refundOrder(orderId, reason)

### 8.4 Inventory APIs

- getInventoryItems()
- createInventoryItem(data)
- updateInventoryItem(id, data)
- stockIn(itemId, quantity, note)
- stockOut(itemId, quantity, note)
- adjustStock(itemId, quantity, reason)
- deductInventoryFromOrder(orderId)

### 8.5 Report APIs

- getDailySales(date)
- getSalesByDateRange(startDate, endDate)
- getSalesByProduct(filters)
- getSalesByCategory(filters)
- getPaymentMethodSummary(filters)
- exportReport(type, filters)

---

## 9. Core Business Workflows

## 9.1 Sales Workflow

1. Cashier logs in.
2. Cashier opens POS page.
3. Cashier selects products.
4. Cashier selects modifiers.
5. System adds items to cart.
6. System calculates subtotal, discount, VAT, service charge, and total.
7. Cashier clicks checkout.
8. Cashier selects payment method.
9. Cashier confirms payment.
10. System creates order.
11. System creates order items.
12. System creates payment record.
13. System deducts inventory.
14. System sends order to barista queue.
15. System generates receipt.
16. Cashier prints receipt.

## 9.2 Barista Workflow

1. Barista logs in.
2. Barista opens Barista Display page.
3. New paid orders appear automatically.
4. Barista clicks Start.
5. Order status changes to Preparing.
6. Barista prepares drink.
7. Barista clicks Ready.
8. Order status changes to Ready.
9. Customer receives drink.
10. Barista clicks Complete.
11. Order status changes to Completed.

## 9.3 Refund Workflow

1. Admin or Manager opens order detail.
2. User clicks Refund.
3. System asks for refund reason.
4. System validates permission.
5. System changes payment status to Refunded.
6. System changes order status to Refunded or Cancelled.
7. System restores inventory if configured.
8. System creates audit log.

## 9.4 Stock In Workflow

1. Manager opens Inventory page.
2. Manager selects item.
3. Manager clicks Stock In.
4. Manager enters quantity and note.
5. System updates inventory quantity.
6. System creates stock movement record.

---

## 10. Security Requirements

### 10.1 Authentication

- Use Supabase Auth.
- Email and password login.
- Password reset via email.
- Session must expire based on Supabase configuration.

### 10.2 Authorization

- All pages must check user role.
- Unauthorized users must be redirected or shown access denied.
- Sensitive actions must be protected at both frontend and database level.

### 10.3 Row Level Security

Supabase RLS must be enabled on important tables.

Example policies:

- Cashier can insert orders.
- Cashier can read own orders.
- Manager and Admin can read all orders.
- Only Admin can manage staff.
- Only Admin and Manager can update products.
- Barista can read active orders but cannot read payment records.

### 10.4 Sensitive Data

- Supabase service role key must never be exposed to frontend.
- Environment variables must be configured in Vercel.
- Payment transaction references should be protected.
- Audit logs should not be editable by normal users.

---

## 11. Validation Requirements

### Product Validation

- Product name required.
- SKU unique.
- Price greater than 0.
- Cost cannot be negative.

### Order Validation

- Cart cannot be empty.
- Quantity must be greater than 0.
- Required modifiers must be selected.
- Discount cannot exceed allowed limit.
- Total amount cannot be negative.

### Payment Validation

- Payment method required.
- Cash received must be enough.
- Payment amount must equal order total.
- Refunded orders cannot be refunded again.

### Inventory Validation

- Stock quantity cannot be negative unless negative stock is allowed by settings.
- Stock adjustment requires reason.
- Stock movement must always be recorded.

---

## 12. Error Handling Requirements

The system must handle the following errors clearly:

- Login failed.
- Network disconnected.
- Product unavailable.
- Inventory not enough.
- Payment confirmation failed.
- Order creation failed.
- Receipt print failed.
- Unauthorized access.
- Database error.
- Realtime connection lost.

Error messages should be clear and actionable.

Example:

Instead of: "Error 500"  
Use: "Unable to save order. Please check your internet connection and try again."

---

## 13. UI / UX Requirements

### General UI

- Clean and modern design.
- Responsive layout.
- Touch-friendly buttons.
- Large product cards.
- Fast navigation.
- Clear loading states.
- Clear empty states.
- Clear error states.

### POS UI

- Product buttons must be large enough for tablet use.
- Checkout button must be visually prominent.
- Cart totals must always be visible.
- Modifier selection must be easy and fast.
- Common actions should require minimum clicks.

### Barista UI

- Order cards must be readable from a distance.
- Order age should be visible.
- Urgent orders should be highlighted.
- Status buttons should be large and clear.

### Dashboard UI

- Key metrics should be shown as cards.
- Charts should be easy to understand.
- Low stock alert should be visible.

---

## 14. Performance Requirements

- POS page initial load should be under 2 seconds after cache.
- Product search should respond within 300ms.
- Add to cart should respond immediately.
- Checkout should complete within 3 seconds under normal network conditions.
- Barista realtime update delay should be under 3 seconds.
- Dashboard data should load within 5 seconds.

---

## 15. Deployment Requirements

### Vercel

- Connect Git repository to Vercel.
- Main branch deploys to production.
- Pull requests generate preview deployments.
- Environment variables must be configured in Vercel.

### Required Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL

### Supabase

- Create project.
- Create database schema.
- Enable RLS.
- Configure Auth redirect URLs.
- Configure Storage bucket for product images and store logo.
- Configure Realtime for orders.

---

## 16. Git Workflow Requirements

### Branches

- main: production branch.
- develop: integration branch.
- feature/*: feature development.
- fix/*: bug fixes.
- hotfix/*: urgent production fixes.

### Example Branch Names

- feature/login-auth
- feature/pos-page
- feature/checkout-payment
- feature/barista-display
- feature/product-management
- feature/inventory-management
- feature/reports
- fix/order-total-calculation

### Commit Message Convention

- feat: add POS product grid
- feat: implement checkout modal
- feat: add barista realtime display
- fix: correct VAT calculation
- fix: prevent checkout with empty cart
- refactor: improve order service
- chore: update Supabase schema

### Pull Request Rules

- Do not push directly to main.
- Every feature must be reviewed before merge.
- Build must pass before merge.
- TypeScript errors must be fixed.
- Database migration must be documented.

---

## 17. Testing Requirements

### 17.1 Unit Testing

Test calculation functions:

- Item total calculation.
- Discount calculation.
- VAT calculation.
- Service charge calculation.
- Change calculation.
- Loyalty point calculation.

### 17.2 Integration Testing

Test workflows:

- Login.
- Create order.
- Checkout payment.
- Inventory deduction.
- Barista status update.
- Refund order.

### 17.3 End-to-End Testing

Recommended tool: Playwright.

E2E scenarios:

1. Cashier logs in.
2. Adds Latte to cart.
3. Selects modifiers.
4. Checks out with cash.
5. Prints receipt.
6. Barista sees new order.
7. Barista marks order as completed.

### 17.4 User Acceptance Testing

Users must confirm that:

- POS is fast enough for real store usage.
- Product selection is easy.
- Drink customization is clear.
- Receipt is correct.
- Sales report matches actual orders.
- Inventory deduction is accurate.

---

## 18. MVP Scope

The first version should include:

1. Login.
2. Role-based access.
3. POS page.
4. Product selection.
5. Modifiers.
6. Cart calculation.
7. Checkout.
8. Receipt.
9. Barista display.
10. Product management.
11. Orders history.
12. Dashboard basic sales summary.

## 18.1 Phase 2 Features

- Inventory management.
- Recipe-based stock deduction.
- Customers and loyalty points.
- Advanced reports.
- Staff management.
- Audit logs.

## 18.2 Phase 3 Features

- Multi-branch support.
- Online ordering.
- Delivery integration.
- Promotion engine.
- Membership tiers.
- Mobile app.

---

## 19. Acceptance Criteria

The system is accepted when the following conditions are met:

### Authentication

- Users can login successfully.
- Users are redirected based on role.
- Disabled users cannot login.

### POS

- Cashier can search and select products.
- Cashier can customize drinks.
- Cart calculation is correct.
- Checkout works for cash and QR payment.
- Receipt is generated correctly.

### Orders

- Orders are saved correctly.
- Order items and modifiers are saved correctly.
- Orders appear in Barista Display in real time.
- Order status can be updated.

### Inventory

- Stock can be added.
- Stock can be adjusted.
- Sales deduct stock correctly.
- Stock movement records are created.

### Reports

- Dashboard shows correct daily sales.
- Reports match order data.
- Reports can be filtered by date.

### Security

- Role-based access works correctly.
- RLS policies protect data.
- Secret keys are not exposed.

### Deployment

- Application deploys successfully on Vercel.
- Supabase connection works in production.
- Environment variables are configured correctly.

---

## 20. Recommended Folder Structure

```text
coffee-pos/
|-- app/
|   |-- login/
|   |-- forgot-password/
|   |-- dashboard/
|   |-- pos/
|   |-- barista/
|   |-- products/
|   |-- categories/
|   |-- modifiers/
|   |-- orders/
|   |-- inventory/
|   |-- customers/
|   |-- staff/
|   |-- reports/
|   `-- settings/
|-- components/
|   |-- ui/
|   |-- pos/
|   |-- products/
|   |-- orders/
|   |-- inventory/
|   `-- layout/
|-- lib/
|   |-- supabase/
|   |-- services/
|   |-- validations/
|   `-- utils/
|-- hooks/
|-- stores/
|-- types/
|-- public/
`-- supabase/
    |-- migrations/
    `-- seed.sql
```

---

## 21. Key Development Notes

1. Do not put payment, order, and inventory logic directly inside UI components.
2. Use service functions for business logic.
3. Use TypeScript types for database tables.
4. Use Supabase RLS from the beginning.
5. Do not physically delete products with sales history.
6. Always create audit logs for sensitive actions.
7. Use transactions or safe database functions for order creation and inventory deduction.
8. Keep POS page fast and simple.
9. Optimize for tablet and touch screen usage.
10. Make receipt printing configurable for 58mm and 80mm paper.

---

## 22. Summary of Added Missing Details

The previous requirement was improved by adding:

- Audit Log page.
- Product recipe and ingredient deduction.
- Detailed database fields.
- API and service requirements.
- RLS and security requirements.
- Error handling rules.
- Validation rules.
- Testing requirements.
- Git workflow details.
- Deployment requirements.
- Performance requirements.
- Folder structure.
- MVP, Phase 2, and Phase 3 roadmap.
- Acceptance criteria.
