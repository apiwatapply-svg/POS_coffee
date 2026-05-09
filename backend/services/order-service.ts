import { randomUUID } from "node:crypto";
import { calculateChange, calculateItemTotal, calculateOrderTotals } from "@backend/calculations/pos";
import { query, queryOne, withTransaction } from "@backend/mssql/client";
import { getCurrentProfile } from "@backend/services/auth-service";
import { createOrderSchema, validateCheckoutPayment, type CreateOrderInput } from "@backend/validations/order";
import type { Database } from "@shared/types/database";
import type { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "@shared/types/domain";

type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type OrderItemModifierRow = Database["public"]["Tables"]["order_item_modifiers"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type ActiveOrderStatus = Extract<OrderStatus, "pending" | "preparing" | "ready">;

const allowedTransitions: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  refunded: [],
};

export function canUpdateOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function canViewAllOrders(role: UserRole) {
  return role === "admin" || role === "manager";
}

function createOrderNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `O${stamp}${now.getTime().toString().slice(-6)}`;
}

function createReceiptNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `R${stamp}${now.getTime().toString().slice(-6)}`;
}

export async function createOrder(input: unknown) {
  const parsed = createOrderSchema.parse(input);
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager", "cashier"].includes(profile.role)) {
    throw new Error("You do not have permission to create orders");
  }

  const itemTotals = parsed.cart.items.map((item) => {
    const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);
    return {
      item,
      modifierTotal,
      unitPrice: item.basePrice + modifierTotal,
      totalPrice: calculateItemTotal({
        basePrice: item.basePrice,
        modifierTotal,
        quantity: item.quantity,
      }),
    };
  });

  const totals = calculateOrderTotals({
    items: itemTotals.map((item) => ({ totalPrice: item.totalPrice })),
    discount: parsed.cart.discount,
    vatRate: 7,
    serviceChargeRate: 0,
  });

  const paymentError = validateCheckoutPayment({
    totalAmount: totals.totalAmount,
    paymentMethod: parsed.payment.method,
    receivedAmount: parsed.payment.receivedAmount,
    qrPaymentConfirmed: parsed.payment.qrPaymentConfirmed,
  });

  if (paymentError) {
    throw new Error(paymentError);
  }

  const orderId = randomUUID();
  const orderNumber = createOrderNumber();
  const receiptNumber = createReceiptNumber();
  const receivedAmount = parsed.payment.receivedAmount ?? totals.totalAmount;
  const changeAmount =
    parsed.payment.method === "cash" ? calculateChange({ totalAmount: totals.totalAmount, receivedAmount }) : 0;

  await withTransaction(async (run) => {
    await run(
      `
        insert into orders (
          id, order_number, receipt_number, cashier_id, status, payment_status,
          subtotal, discount_amount, vat_amount, service_charge_amount,
          total_amount, note
        )
        values (
          @orderId, @orderNumber, @receiptNumber, @cashierId, 'pending', 'unpaid',
          @subtotal, @discountAmount, @vatAmount, @serviceChargeAmount,
          @totalAmount, @note
        )
      `,
      {
        orderId,
        orderNumber,
        receiptNumber,
        cashierId: profile.id,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        vatAmount: totals.vatAmount,
        serviceChargeAmount: totals.serviceChargeAmount,
        totalAmount: totals.totalAmount,
        note: parsed.cart.note || null,
      },
    );

    for (const { item, modifierTotal, unitPrice, totalPrice } of itemTotals) {
      const orderItemId = randomUUID();
      await run(
        `
          insert into order_items (
            id, order_id, product_id, product_name, quantity, base_price,
            modifier_total, unit_price, total_price, note
          )
          values (
            @orderItemId, @orderId, @productId, @productName, @quantity, @basePrice,
            @modifierTotal, @unitPrice, @totalPrice, @note
          )
        `,
        {
          orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          basePrice: item.basePrice,
          modifierTotal,
          unitPrice,
          totalPrice,
          note: item.note || null,
        },
      );

      for (const modifier of item.modifiers) {
        await run(
          `
            insert into order_item_modifiers (
              id, order_item_id, modifier_group_name, modifier_option_name, price_delta
            )
            values (
              @id, @orderItemId, @modifierGroupName, @modifierOptionName, @priceDelta
            )
          `,
          {
            id: randomUUID(),
            orderItemId,
            modifierGroupName: modifier.groupName,
            modifierOptionName: modifier.optionName,
            priceDelta: modifier.priceDelta,
          },
        );
      }
    }

    await run(
      `
        insert into payments (
          id, order_id, payment_method, amount, received_amount,
          change_amount, status, transaction_ref, created_by
        )
        values (
          @id, @orderId, @paymentMethod, @amount, @receivedAmount,
          @changeAmount, 'paid', @transactionRef, @createdBy
        )
      `,
      {
        id: randomUUID(),
        orderId,
        paymentMethod: parsed.payment.method,
        amount: totals.totalAmount,
        receivedAmount,
        changeAmount,
        transactionRef: parsed.payment.transactionRef || null,
        createdBy: profile.id,
      },
    );

    await run("update orders set payment_status = 'paid', updated_at = sysdatetimeoffset() where id = @orderId", {
      orderId,
    });
  });

  return {
    orderId,
    orderNumber,
    receiptNumber,
    redirectTo: `/receipt/${orderId}`,
  };
}

async function getOrderItems(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, Array<OrderItemRow & { order_item_modifiers: OrderItemModifierRow[] }>>();
  }

  const idList = orderIds.map((_, index) => `@id${index}`).join(",");
  const params = Object.fromEntries(orderIds.map((id, index) => [`id${index}`, id]));
  const itemRows = await query<OrderItemRow>(`select * from order_items where order_id in (${idList}) order by id`, params);
  const itemIds = itemRows.map((item) => item.id);
  const modifierMap = new Map<string, OrderItemModifierRow[]>();

  if (itemIds.length > 0) {
    const itemIdList = itemIds.map((_, index) => `@itemId${index}`).join(",");
    const itemParams = Object.fromEntries(itemIds.map((id, index) => [`itemId${index}`, id]));
    const modifiers = await query<OrderItemModifierRow>(
      `select * from order_item_modifiers where order_item_id in (${itemIdList}) order by id`,
      itemParams,
    );

    modifiers.forEach((modifier) => {
      modifierMap.set(modifier.order_item_id, [...(modifierMap.get(modifier.order_item_id) ?? []), modifier]);
    });
  }

  const itemMap = new Map<string, Array<OrderItemRow & { order_item_modifiers: OrderItemModifierRow[] }>>();
  itemRows.forEach((item) => {
    const hydrated = { ...item, order_item_modifiers: modifierMap.get(item.id) ?? [] };
    itemMap.set(item.order_id, [...(itemMap.get(item.order_id) ?? []), hydrated]);
  });

  return itemMap;
}

async function getOrderPayments(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, PaymentRow[]>();
  }

  const idList = orderIds.map((_, index) => `@id${index}`).join(",");
  const params = Object.fromEntries(orderIds.map((id, index) => [`id${index}`, id]));
  const payments = await query<PaymentRow>(`select * from payments where order_id in (${idList}) order by paid_at`, params);
  const paymentMap = new Map<string, PaymentRow[]>();

  payments.forEach((payment) => {
    paymentMap.set(payment.order_id, [...(paymentMap.get(payment.order_id) ?? []), payment]);
  });

  return paymentMap;
}

export async function getOrderById(orderId: string) {
  const order = await queryOne<OrderRow & { cashier_name: string | null }>(
    `
      select o.*, p.full_name as cashier_name
      from orders o
      left join profiles p on p.id = o.cashier_id
      where o.id = @orderId
    `,
    { orderId },
  );

  if (!order) {
    throw new Error("Order not found");
  }

  const settings = await queryOne<StoreSettings>("select top 1 * from store_settings order by updated_at desc");

  if (!settings) {
    throw new Error("Store settings not found");
  }

  const itemMap = await getOrderItems([orderId]);
  const paymentMap = await getOrderPayments([orderId]);

  return {
    order: {
      ...order,
      profiles: order.cashier_name ? { full_name: order.cashier_name } : null,
      order_items: itemMap.get(orderId) ?? [],
      payments: paymentMap.get(orderId) ?? [],
    } as unknown as ReceiptOrder,
    settings,
  };
}

export type OrderFilters = {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  paymentMethod?: PaymentMethod;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  orderNumber?: string;
};

function bangkokDateBoundary(date: string, dayOffset: number) {
  const value = new Date(`${date}T00:00:00+07:00`);
  value.setDate(value.getDate() + dayOffset);
  return value.toISOString();
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getOrders(filters: OrderFilters = {}) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager", "cashier"].includes(profile.role)) {
    throw new Error("You do not have permission to view orders");
  }

  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (!canViewAllOrders(profile.role)) {
    conditions.push("o.cashier_id = @cashierId");
    params.cashierId = profile.id;
  } else if (filters.cashierId) {
    conditions.push("o.cashier_id = @cashierId");
    params.cashierId = filters.cashierId;
  }

  if (filters.startDate) {
    conditions.push("o.created_at >= @startDate");
    params.startDate = isDateInput(filters.startDate) ? bangkokDateBoundary(filters.startDate, 0) : filters.startDate;
  }

  if (filters.endDate) {
    conditions.push("o.created_at < @endDate");
    params.endDate = isDateInput(filters.endDate) ? bangkokDateBoundary(filters.endDate, 1) : filters.endDate;
  }

  if (filters.orderStatus) {
    conditions.push("o.status = @orderStatus");
    params.orderStatus = filters.orderStatus;
  }

  if (filters.paymentStatus) {
    conditions.push("o.payment_status = @paymentStatus");
    params.paymentStatus = filters.paymentStatus;
  }

  if (filters.customerId) {
    conditions.push("o.customer_id = @customerId");
    params.customerId = filters.customerId;
  }

  if (filters.orderNumber) {
    conditions.push("o.order_number like @orderNumber");
    params.orderNumber = `%${filters.orderNumber}%`;
  }

  if (filters.paymentMethod) {
    conditions.push("exists (select 1 from payments py where py.order_id = o.id and py.payment_method = @paymentMethod)");
    params.paymentMethod = filters.paymentMethod;
  }

  const orders = await query<OrderRow & { cashier_name: string | null }>(
    `
      select o.*, p.full_name as cashier_name
      from orders o
      left join profiles p on p.id = o.cashier_id
      ${conditions.length > 0 ? `where ${conditions.join(" and ")}` : ""}
      order by o.created_at desc
    `,
    params,
  );
  const orderIds = orders.map((order) => order.id);
  const paymentMap = await getOrderPayments(orderIds);

  return orders.map((order) => ({
    ...order,
    profiles: order.cashier_name ? { full_name: order.cashier_name } : null,
    payments: (paymentMap.get(order.id) ?? []).map((payment) => ({ payment_method: payment.payment_method })),
  })) as unknown as OrderListItem[];
}

export async function getActiveBaristaOrders() {
  const orders = await query<OrderRow>(
    `
      select *
      from orders
      where payment_status = 'paid'
        and status in ('pending', 'preparing', 'ready')
      order by created_at asc
    `,
  );
  const itemMap = await getOrderItems(orders.map((order) => order.id));

  return orders.map((order) => ({
    ...order,
    order_items: itemMap.get(order.id) ?? [],
  })) as unknown as BaristaOrder[];
}

export async function updateOrderStatus(orderId: string, status: Extract<OrderStatus, "preparing" | "ready" | "completed" | "cancelled">) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager", "barista"].includes(profile.role)) {
    throw new Error("You do not have permission to update this order");
  }

  const currentOrder = await queryOne<{ status: OrderStatus }>("select status from orders where id = @orderId", { orderId });

  if (!currentOrder) {
    throw new Error("Order not found");
  }

  if (!canUpdateOrderStatus(currentOrder.status, status)) {
    throw new Error("Invalid status transition");
  }

  await query("update orders set status = @status, updated_at = sysdatetimeoffset() where id = @orderId", {
    orderId,
    status,
  });
}

export async function cancelOrder(orderId: string, reason: string) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    throw new Error("You do not have permission to cancel this order");
  }

  const currentOrder = await queryOne<{ status: OrderStatus; note: string | null }>(
    "select status, note from orders where id = @orderId",
    { orderId },
  );

  if (!currentOrder) {
    throw new Error("Order not found");
  }

  if (!canUpdateOrderStatus(currentOrder.status, "cancelled")) {
    throw new Error("Invalid status transition");
  }

  const cancelNote = `Cancelled: ${reason}`;
  await query(
    `
      update orders
      set status = 'cancelled',
          note = @note,
          updated_at = sysdatetimeoffset()
      where id = @orderId
    `,
    {
      orderId,
      note: currentOrder.note ? `${currentOrder.note}\n${cancelNote}` : cancelNote,
    },
  );
}

export type ReceiptOrder = OrderRow & {
  profiles: {
    full_name: string;
  } | null;
  order_items: Array<OrderItemRow & { order_item_modifiers: OrderItemModifierRow[] }>;
  payments: PaymentRow[];
};

export type BaristaOrder = OrderRow & {
  status: ActiveOrderStatus;
  order_items: Array<OrderItemRow & { order_item_modifiers: OrderItemModifierRow[] }>;
};

export type OrderListItem = OrderRow & {
  profiles: {
    full_name: string;
  } | null;
  payments: Array<{
    payment_method: PaymentMethod;
  }>;
};

export type { CreateOrderInput };
