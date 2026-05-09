# Coffee POS API Specification

**Project:** Coffee POS Web Application  
**Document Type:** API and Server Action Specification  
**Version:** 1.0  
**Last Updated:** 2026-05-09  
**Related Documents:**
- `docs/coffee_pos_requirements.md`
- `docs/system_architecture.md`
- `docs/superpowers/plans/2026-05-09-coffee-pos-mvp.md`

---

## 1. API Style

The MVP should use **Next.js Server Actions** for application mutations and protected reads. Supabase client calls are wrapped by service functions so business logic stays out of UI components.

Primary code locations:

```text
app/actions/
lib/services/
lib/validations/
lib/calculations/
```

Public REST endpoints are not required for the MVP. If mobile apps, external ordering, or delivery integrations are added later, expose REST endpoints under `app/api/*` using the same service functions.

---

## 2. Common Standards

## 2.1 Authentication

All protected API calls require a valid Supabase Auth session.

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

## 2.2 Authorization

Every service function must check role permissions before performing sensitive actions.

Roles:

```ts
type UserRole = "admin" | "manager" | "cashier" | "barista";
```

## 2.3 Standard Success Response

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};
```

## 2.4 Standard Error Response

```ts
type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## 2.5 Error Codes

| Code | Meaning |
|---|---|
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
| `REALTIME_DISCONNECTED` | Realtime subscription is disconnected |
| `DATABASE_ERROR` | Unhandled database error |

---

## 3. Domain Types

```ts
type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";

type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

type PaymentMethod =
  | "cash"
  | "promptpay_qr"
  | "qr_payment"
  | "credit_card"
  | "e_wallet";
```

---

## 4. Authentication API

## 4.1 `loginAction`

**Server Action:** `app/actions/auth.ts`  
**Service:** `lib/services/auth-service.ts`  
**Allowed Roles:** Public  
**Purpose:** Authenticate staff with Supabase Auth and redirect by role.

Request:

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Validation:

| Field | Rule |
|---|---|
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
|---|---|
| `admin` | `/dashboard` |
| `manager` | `/dashboard` |
| `cashier` | `/pos` |
| `barista` | `/barista` |

Errors:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

```json
{
  "ok": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Your account has been disabled. Please contact Admin"
  }
}
```

## 4.2 `sendPasswordResetAction`

**Server Action:** `app/actions/auth.ts`  
**Allowed Roles:** Public  
**Purpose:** Send password reset email through Supabase Auth.

Request:

```ts
type PasswordResetRequest = {
  email: string;
};
```

Success response must not reveal whether the email exists:

```json
{
  "ok": true,
  "data": {
    "message": "If this email exists, a reset link has been sent"
  }
}
```

---

## 5. Product API

## 5.1 `getProducts`

**Service:** `lib/services/product-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier, Barista  
**Purpose:** Load active and non-archived products for POS and product management.

Query:

```ts
type ProductFilters = {
  search?: string;
  categoryId?: string;
  status?: "available" | "unavailable" | "all";
};
```

Response:

```ts
type ProductDto = {
  id: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  cost: number;
  isAvailable: boolean;
  isArchived: boolean;
  trackStock: boolean;
  sortOrder: number;
};
```

## 5.2 `getProductById`

**Service:** `lib/services/product-service.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Load one product for edit form.

Request:

```ts
type GetProductByIdRequest = {
  id: string;
};
```

Errors:

| Code | Message |
|---|---|
| `NOT_FOUND` | Product not found |
| `FORBIDDEN` | You do not have permission to view this product |

## 5.3 `createProductAction`

**Server Action:** `app/actions/products.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Create a sellable menu item.

Request:

```ts
type ProductInput = {
  name: string;
  sku: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  price: number;
  cost: number;
  isAvailable: boolean;
  trackStock: boolean;
  sortOrder: number;
  modifierGroupIds: string[];
};
```

Validation:

| Field | Rule |
|---|---|
| `name` | Required |
| `sku` | Required, unique |
| `categoryId` | Required UUID |
| `price` | Greater than 0 |
| `cost` | Cannot be negative |
| `imageUrl` | Valid URL when provided |

Success:

```json
{
  "ok": true,
  "data": {
    "id": "product-uuid"
  }
}
```

## 5.4 `updateProductAction`

**Server Action:** `app/actions/products.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Update product data and assigned modifier groups.

Request:

```ts
type UpdateProductRequest = {
  id: string;
  data: ProductInput;
};
```

## 5.5 `archiveProductAction`

**Server Action:** `app/actions/products.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Archive a product instead of physically deleting it.

Request:

```ts
type ArchiveProductRequest = {
  id: string;
};
```

Success:

```json
{
  "ok": true,
  "data": {
    "archived": true
  }
}
```

---

## 6. Modifier API

## 6.1 `getModifierGroups`

**Service:** `lib/services/product-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier, Barista  
**Purpose:** Load modifier groups and options for POS customization.

Response:

```ts
type ModifierGroupDto = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: Array<{
    id: string;
    name: string;
    priceDelta: number;
    sortOrder: number;
  }>;
};
```

## 6.2 `getProductModifiers`

**Service:** `lib/services/product-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier, Barista  
**Purpose:** Load modifier groups assigned to a selected product.

Request:

```ts
type ProductModifiersRequest = {
  productId: string;
};
```

---

## 7. Order and Checkout API

## 7.1 `createOrderAction`

**Server Action:** `app/actions/orders.ts`  
**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier  
**Purpose:** Create paid order, order items, item modifiers, payment record, and return receipt target.

Request:

```ts
type CreateOrderRequest = {
  cart: {
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      basePrice: number;
      modifiers: Array<{
        groupName: string;
        optionName: string;
        priceDelta: number;
      }>;
      note?: string;
    }>;
    discount: {
      type: "fixed" | "percentage";
      value: number;
    };
    note?: string;
  };
  payment: {
    method: PaymentMethod;
    receivedAmount?: number;
    transactionRef?: string;
    qrPaymentConfirmed?: boolean;
  };
};
```

Validation:

| Rule | Error Code |
|---|---|
| Cart must contain at least one item | `EMPTY_CART` |
| Quantity must be greater than 0 | `VALIDATION_ERROR` |
| Required modifiers must be selected | `VALIDATION_ERROR` |
| Discount cannot exceed allowed limit | `VALIDATION_ERROR` |
| Cash received must be greater than or equal to total | `CASH_NOT_ENOUGH` |
| QR payment must be confirmed | `QR_NOT_CONFIRMED` |
| Product must be available | `PRODUCT_UNAVAILABLE` |

Success:

```json
{
  "ok": true,
  "data": {
    "orderId": "order-uuid",
    "orderNumber": "O202605090001",
    "receiptNumber": "R202605090001",
    "redirectTo": "/receipt/order-uuid"
  }
}
```

Failure rule:

If payment persistence fails, the order must not be marked as paid.

## 7.2 `getOrders`

**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier  
**Purpose:** Search and filter order history.

Request:

```ts
type OrderFilters = {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  paymentMethod?: PaymentMethod;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
};
```

Authorization:

| Role | Access |
|---|---|
| Admin | All orders |
| Manager | All orders |
| Cashier | Own orders only |

Response:

```ts
type OrderListItemDto = {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  customerName?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};
```

## 7.3 `getOrderById`

**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier  
**Purpose:** Load complete order detail and receipt data.

Request:

```ts
type GetOrderByIdRequest = {
  id: string;
};
```

Response includes:

- Order header
- Cashier profile
- Customer data when available
- Order items
- Item modifiers
- Payment details
- Store settings

## 7.4 `updateOrderStatusAction`

**Server Action:** `app/actions/orders.ts`  
**Allowed Roles:** Admin, Manager, Barista  
**Purpose:** Update barista preparation status.

Request:

```ts
type UpdateOrderStatusRequest = {
  orderId: string;
  status: Extract<OrderStatus, "preparing" | "ready" | "completed" | "cancelled">;
};
```

Allowed transitions:

| Current | Next |
|---|---|
| `pending` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled` |
| `ready` | `completed`, `cancelled` |
| `completed` | none |
| `cancelled` | none |
| `refunded` | none |

Errors:

| Code | Message |
|---|---|
| `VALIDATION_ERROR` | Invalid status transition |
| `FORBIDDEN` | You do not have permission to update this order |

## 7.5 `cancelOrderAction`

**Server Action:** `app/actions/orders.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Cancel order with reason.

Request:

```ts
type CancelOrderRequest = {
  orderId: string;
  reason: string;
};
```

MVP note:

Cancellation can update order status only. Phase 2 should add audit log and inventory restore behavior.

## 7.6 `refundOrderAction`

**Server Action:** `app/actions/orders.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Refund a paid order with reason.

Request:

```ts
type RefundOrderRequest = {
  orderId: string;
  reason: string;
};
```

Validation:

| Rule | Error Code |
|---|---|
| Order must exist | `NOT_FOUND` |
| Order must be paid | `VALIDATION_ERROR` |
| Refunded order cannot be refunded again | `VALIDATION_ERROR` |

Phase 2 behavior:

- Restore inventory if store setting allows.
- Create audit log.

---

## 8. Barista Queue API

## 8.1 `getActiveBaristaOrders`

**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Barista  
**Purpose:** Load active paid drink orders.

Filter:

```ts
status in ["pending", "preparing", "ready"]
payment_status = "paid"
```

Response:

```ts
type BaristaOrderDto = {
  id: string;
  orderNumber: string;
  queueNumber: string;
  createdAt: string;
  elapsedMinutes: number;
  status: Extract<OrderStatus, "pending" | "preparing" | "ready">;
  note?: string;
  items: Array<{
    productName: string;
    quantity: number;
    note?: string;
    modifiers: Array<{
      groupName: string;
      optionName: string;
    }>;
  }>;
};
```

## 8.2 Realtime Subscription Contract

**Channel:** `barista-orders`  
**Tables:** `orders`, `order_items`, `order_item_modifiers`  
**Client Hook:** `hooks/use-realtime-orders.ts`

Events:

| Event | Client Behavior |
|---|---|
| `INSERT orders` | Refetch active queue |
| `UPDATE orders.status` | Update or remove order card |
| `INSERT order_items` | Refetch active queue |
| `INSERT order_item_modifiers` | Refetch active queue |

---

## 9. Receipt API

## 9.1 `getReceiptData`

**Service:** `lib/services/order-service.ts`  
**Allowed Roles:** Admin, Manager, Cashier  
**Purpose:** Load printable receipt by order ID.

Request:

```ts
type ReceiptRequest = {
  orderId: string;
};
```

Response:

```ts
type ReceiptDto = {
  store: {
    name: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    taxId?: string;
    receiptFooter: string;
    printerPaperSize: "58mm" | "80mm";
  };
  order: {
    orderNumber: string;
    receiptNumber: string;
    createdAt: string;
    cashierName: string;
    customerName?: string;
    status: OrderStatus;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers: Array<{
      groupName: string;
      optionName: string;
      priceDelta: number;
    }>;
  }>;
  totals: {
    subtotal: number;
    discountAmount: number;
    vatAmount: number;
    serviceChargeAmount: number;
    totalAmount: number;
  };
  payment: {
    method: PaymentMethod;
    receivedAmount?: number;
    changeAmount?: number;
  };
};
```

---

## 10. Dashboard and Report API

## 10.1 `getDashboardSummary`

**Service:** `lib/services/report-service.ts`  
**Allowed Roles:** Admin, Manager  
**Purpose:** Load basic dashboard metrics.

Request:

```ts
type DashboardSummaryRequest = {
  date: string;
};
```

Response:

```ts
type DashboardSummaryDto = {
  totalSalesToday: number;
  totalOrdersToday: number;
  totalCupsSoldToday: number;
  averageOrderValue: number;
  bestSellingProductToday?: {
    productId: string;
    productName: string;
    quantity: number;
  };
  salesByHour: Array<{
    hour: string;
    totalSales: number;
  }>;
  paymentMethodSummary: Array<{
    paymentMethod: PaymentMethod;
    totalAmount: number;
    orderCount: number;
  }>;
  recentOrders: OrderListItemDto[];
};
```

Formula:

```ts
averageOrderValue = totalOrdersToday === 0 ? 0 : totalSalesToday / totalOrdersToday;
```

---

## 11. Inventory API, Phase 2

These APIs are required by the full requirements but should be implemented in Phase 2 unless inventory is moved into MVP scope.

## 11.1 `getInventoryItems`

Allowed Roles: Admin, Manager

## 11.2 `createInventoryItemAction`

Allowed Roles: Admin, Manager

## 11.3 `stockInAction`

Allowed Roles: Admin, Manager

Request:

```ts
type StockInRequest = {
  itemId: string;
  quantity: number;
  note: string;
};
```

## 11.4 `stockOutAction`

Allowed Roles: Admin, Manager

## 11.5 `adjustStockAction`

Allowed Roles: Admin, Manager

Validation:

| Rule | Error Code |
|---|---|
| Quantity must not create negative stock unless allowed | `VALIDATION_ERROR` |
| Adjustment requires reason | `VALIDATION_ERROR` |
| Every inventory change must create movement record | `DATABASE_ERROR` if movement fails |

## 11.6 `deductInventoryFromOrder`

Allowed Caller: `createOrderAction`

Behavior:

1. Load product recipes for each sold product.
2. Deduct each ingredient by `quantity_required * sold_quantity`.
3. Create `stock_movements` records with movement type `sale`.
4. Fail checkout or show admin warning based on store setting.

---

## 12. Customer API, Phase 2

## 12.1 `getCustomers`

Allowed Roles: Admin, Manager, Cashier

## 12.2 `searchCustomerByPhone`

Allowed Roles: Admin, Manager, Cashier

Request:

```ts
type SearchCustomerByPhoneRequest = {
  phone: string;
};
```

## 12.3 `attachCustomerToOrderAction`

Allowed Roles: Admin, Manager, Cashier

## 12.4 `calculateLoyaltyPoints`

Formula:

```ts
pointsEarned = Math.floor(totalAmount / 100);
```

---

## 13. Staff API, Phase 2

## 13.1 `createStaffAction`

Allowed Roles: Admin

Request:

```ts
type CreateStaffRequest = {
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
};
```

## 13.2 `disableStaffAction`

Allowed Roles: Admin

Rule:

Admin cannot disable their own account.

## 13.3 `resetStaffPasswordAction`

Allowed Roles: Admin

---

## 14. Settings API

## 14.1 `getStoreSettings`

Allowed Roles: Admin, Manager, Cashier

## 14.2 `updateStoreSettingsAction`

Allowed Roles: Admin

Request:

```ts
type StoreSettingsInput = {
  storeName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  currency: string;
  timezone: string;
  vatEnabled: boolean;
  vatRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  allowDiscount: boolean;
  maximumCashierDiscountPercentage: number;
  allowRefund: boolean;
  allowOrderCancellation: boolean;
  receiptPrefix: string;
  receiptFooter: string;
  printerPaperSize: "58mm" | "80mm";
};
```

---

## 15. Audit Log API, Phase 2

## 15.1 `createAuditLog`

Allowed Caller: Server services only

Request:

```ts
type CreateAuditLogRequest = {
  userId: string;
  actionType:
    | "login"
    | "logout"
    | "create_order"
    | "cancel_order"
    | "refund_order"
    | "change_product_price"
    | "change_inventory_quantity"
    | "create_staff"
    | "disable_staff"
    | "change_settings";
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
};
```

Rule:

Audit logs are append-only. Normal users cannot edit or delete audit log records.

---

## 16. API Acceptance Checklist

- [ ] All protected actions verify authenticated user.
- [ ] All protected actions verify role permissions.
- [ ] All input payloads are validated with Zod.
- [ ] All money calculations use shared calculation helpers.
- [ ] Checkout creates order, items, modifiers, and payment consistently.
- [ ] Failed payment save does not produce a paid order.
- [ ] Cashier can read only own orders.
- [ ] Admin and Manager can read all orders.
- [ ] Barista can update only preparation statuses.
- [ ] Product archive never physically deletes sales history.
- [ ] Service role key is never imported by client components.
- [ ] Errors use clear, actionable messages.
