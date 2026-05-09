# Coffee POS API Specification

**Project:** Coffee POS Web Application  
**Document Type:** API and Server Action Specification  
**Version:** 2.0  
**Last Updated:** 2026-05-09  

## 1. API Style

The MVP uses Next.js Server Actions for application mutations and protected reads. SQL Server calls are wrapped by service functions so business logic stays out of UI components.

Primary code locations:

```text
app/actions/
lib/services/
lib/validations/
lib/calculations/
lib/auth/
lib/mssql/
```

Public REST endpoints are not required for the MVP. If mobile apps, external ordering, or delivery integrations are added later, expose REST endpoints under `app/api/*` using the same service functions.

## 2. Common Standards

### 2.1 Authentication

Protected calls require a valid `pos_session` HTTP-only cookie. The session id maps to `staff_sessions`, which maps to `profiles`.

Unauthenticated response:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Please login to continue"
  }
}
```

### 2.2 Authorization

Every service function must check role permissions before performing sensitive actions.

```ts
type UserRole = "admin" | "manager" | "cashier" | "barista";
```

### 2.3 Error Codes

| Code | Meaning |
| --- | --- |
| `UNAUTHENTICATED` | User session is missing or expired |
| `FORBIDDEN` | User role cannot perform this action |
| `VALIDATION_ERROR` | Request payload does not pass validation |
| `NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_SKU` | Product SKU already exists |
| `PRODUCT_UNAVAILABLE` | Product cannot be sold |
| `EMPTY_CART` | Checkout attempted with no cart items |
| `CASH_NOT_ENOUGH` | Cash received is lower than order total |
| `QR_NOT_CONFIRMED` | QR payment was not confirmed |
| `ORDER_SAVE_FAILED` | Order persistence failed |
| `PAYMENT_SAVE_FAILED` | Payment persistence failed |
| `DATABASE_ERROR` | Unhandled SQL Server error |

## 3. Authentication Actions

### 3.1 `loginAction`

**Server Action:** `app/actions/auth.ts`  
**Data:** `profiles`, `staff_sessions`  
**Allowed Roles:** Public  
**Purpose:** Authenticate staff by email/password and redirect by role.

Request:

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Validation:

| Field | Rule |
| --- | --- |
| `email` | Required, valid email |
| `password` | Required, not empty |

Success:

```json
{
  "ok": true,
  "data": {
    "redirectTo": "/pos"
  }
}
```

Redirect rules:

| Role | Redirect |
| --- | --- |
| `admin` | `/dashboard` |
| `manager` | `/dashboard` |
| `cashier` | `/pos` |
| `barista` | `/barista` |

### 3.2 `sendPasswordResetAction`

**Server Action:** `app/actions/auth.ts`  
**Allowed Roles:** Public  
**Purpose:** Return a safe password reset message. The MVP expects administrator-managed password resets.

## 4. Product Services

### 4.1 `getProducts`

**Service:** `lib/services/product-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier, Barista  
**Purpose:** Load active and non-archived products.

### 4.2 `getPosCatalog`

Loads products with category and modifier group data for the POS screen.

Response shape:

```ts
type PosProduct = Product & {
  categories: { id: string; name: string } | null;
  product_modifier_groups: Array<{
    modifier_groups: {
      id: string;
      name: string;
      is_required: boolean;
      min_select: number;
      max_select: number;
      modifier_options: Array<{
        id: string;
        name: string;
        price_delta: number;
      }>;
    } | null;
  }>;
};
```

### 4.3 `createProduct`, `updateProduct`, `archiveProduct`

**Allowed Roles:** Admin, Manager  
**Validation:** `lib/validations/product.ts`  
**Database:** SQL Server `products`

## 5. Order Services

### 5.1 `createOrder`

**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier  
**Purpose:** Create an order, order items, selected modifiers, payment row, and paid order status.

The operation runs inside a SQL Server transaction.

Request:

```ts
type CreateOrderInput = {
  cart: {
    items: CartItem[];
    discount: number;
    note?: string;
  };
  payment: {
    method: PaymentMethod;
    receivedAmount?: number;
    qrPaymentConfirmed?: boolean;
    transactionRef?: string;
  };
};
```

### 5.2 `getOrderById`

Loads one order with cashier profile, order items, item modifiers, payment rows, and store settings.

### 5.3 `getOrders`

Loads order history. Admin and Manager see all orders. Cashier sees only their own orders.

### 5.4 `getActiveBaristaOrders`

Loads paid orders with status `pending`, `preparing`, or `ready`.

### 5.5 `updateOrderStatus`

Allowed transitions:

| From | To |
| --- | --- |
| `pending` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled` |
| `ready` | `completed`, `cancelled` |

### 5.6 `cancelOrder`

**Allowed Roles:** Admin, Manager  
**Purpose:** Mark an order as cancelled and append a cancellation note.

## 6. Dashboard Service

### 6.1 `getDashboardSummary`

**Service:** `lib/services/report-service.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Load daily sales totals, order count, average order value, hourly sales, payment method summary, best-selling product, and recent orders.

## 7. SQL Server Data Access

Primary helper:

```ts
getMssqlPool()
query<T>(sql, params)
queryOne<T>(sql, params)
withTransaction(callback)
```

All user input must be passed as query parameters, never string-concatenated into SQL.
