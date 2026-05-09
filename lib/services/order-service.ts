import { calculateChange, calculateItemTotal, calculateOrderTotals } from "@/lib/calculations/pos";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrderSchema, validateCheckoutPayment, type CreateOrderInput } from "@/lib/validations/order";
import type { Database } from "@/types/database";
import type { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "@/types/domain";

type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
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

  const supabase = await createSupabaseServerClient();
  const orderNumber = createOrderNumber();
  const receiptNumber = createReceiptNumber();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      receipt_number: receiptNumber,
      cashier_id: profile.id,
      status: "pending",
      payment_status: "unpaid",
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      vat_amount: totals.vatAmount,
      service_charge_amount: totals.serviceChargeAmount,
      total_amount: totals.totalAmount,
      note: parsed.cart.note || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error("Unable to save order. Please check your internet connection and try again.");
  }

  const orderId = (order as { id: string }).id;
  const orderItems: OrderItemInsert[] = itemTotals.map(({ item, modifierTotal, unitPrice, totalPrice }) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    base_price: item.basePrice,
    modifier_total: modifierTotal,
    unit_price: unitPrice,
    total_price: totalPrice,
    note: item.note || null,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)
    .select("id");

  if (itemsError || !insertedItems) {
    throw new Error("Unable to save order items");
  }

  const modifierRows = itemTotals.flatMap(({ item }, index) =>
    item.modifiers.map((modifier) => ({
      order_item_id: (insertedItems as Array<{ id: string }>)[index].id,
      modifier_group_name: modifier.groupName,
      modifier_option_name: modifier.optionName,
      price_delta: modifier.priceDelta,
    })),
  );

  if (modifierRows.length > 0) {
    const { error: modifierError } = await supabase.from("order_item_modifiers").insert(modifierRows);
    if (modifierError) {
      throw new Error("Unable to save order modifiers");
    }
  }

  const receivedAmount = parsed.payment.receivedAmount ?? totals.totalAmount;
  const { error: paymentErrorResult } = await supabase.from("payments").insert({
    order_id: orderId,
    payment_method: parsed.payment.method,
    amount: totals.totalAmount,
    received_amount: receivedAmount,
    change_amount: parsed.payment.method === "cash" ? calculateChange({ totalAmount: totals.totalAmount, receivedAmount }) : 0,
    status: "paid",
    transaction_ref: parsed.payment.transactionRef || null,
    created_by: profile.id,
  });

  if (paymentErrorResult) {
    throw new Error("Payment confirmation failed. Order was not marked as paid.");
  }

  const { error: paidUpdateError } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId);

  if (paidUpdateError) {
    throw new Error("Payment confirmation failed. Order was not marked as paid.");
  }

  return {
    orderId,
    orderNumber,
    receiptNumber,
    redirectTo: `/receipt/${orderId}`,
  };
}

export async function getOrderById(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
        *,
        profiles!orders_cashier_id_fkey(full_name),
        order_items(
          *,
          order_item_modifiers(*)
        ),
        payments(*)
      `,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  const { data: settings, error: settingsError } = await supabase.from("store_settings").select("*").limit(1).single();

  if (settingsError || !settings) {
    throw new Error("Store settings not found");
  }

  return {
    order: order as unknown as ReceiptOrder,
    settings: settings as StoreSettings,
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

export async function getOrders(filters: OrderFilters = {}) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager", "cashier"].includes(profile.role)) {
    throw new Error("You do not have permission to view orders");
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("*, profiles!orders_cashier_id_fkey(full_name), payments(payment_method)")
    .order("created_at", { ascending: false });

  if (!canViewAllOrders(profile.role)) {
    query = query.eq("cashier_id", profile.id);
  } else if (filters.cashierId) {
    query = query.eq("cashier_id", filters.cashierId);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  if (filters.orderStatus) {
    query = query.eq("status", filters.orderStatus);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters.orderNumber) {
    query = query.ilike("order_number", `%${filters.orderNumber}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load orders");
  }

  let orders = data as unknown as OrderListItem[];

  if (filters.paymentMethod) {
    orders = orders.filter((order) => order.payments.some((payment) => payment.payment_method === filters.paymentMethod));
  }

  return orders;
}

export async function getActiveBaristaOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, order_item_modifiers(*))")
    .eq("payment_status", "paid")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load barista queue");
  }

  return data as unknown as BaristaOrder[];
}

export async function updateOrderStatus(orderId: string, status: Extract<OrderStatus, "preparing" | "ready" | "completed" | "cancelled">) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager", "barista"].includes(profile.role)) {
    throw new Error("You do not have permission to update this order");
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentOrder, error: loadError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (loadError || !currentOrder) {
    throw new Error("Order not found");
  }

  const currentStatus = (currentOrder as { status: OrderStatus }).status;

  if (!canUpdateOrderStatus(currentStatus, status)) {
    throw new Error("Invalid status transition");
  }

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

  if (error) {
    throw new Error("Unable to update order status");
  }
}

export async function cancelOrder(orderId: string, reason: string) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    throw new Error("You do not have permission to cancel this order");
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentOrder, error: loadError } = await supabase
    .from("orders")
    .select("status,note")
    .eq("id", orderId)
    .single();

  if (loadError || !currentOrder) {
    throw new Error("Order not found");
  }

  const status = (currentOrder as { status: OrderStatus; note: string | null }).status;
  if (!canUpdateOrderStatus(status, "cancelled")) {
    throw new Error("Invalid status transition");
  }

  const existingNote = (currentOrder as { status: OrderStatus; note: string | null }).note;
  const cancelNote = `Cancelled: ${reason}`;
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      note: existingNote ? `${existingNote}\n${cancelNote}` : cancelNote,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error("Unable to cancel order");
  }
}

export type ReceiptOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles: {
    full_name: string;
  } | null;
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      order_item_modifiers: Database["public"]["Tables"]["order_item_modifiers"]["Row"][];
    }
  >;
  payments: Database["public"]["Tables"]["payments"]["Row"][];
};

export type BaristaOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  status: ActiveOrderStatus;
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      order_item_modifiers: Database["public"]["Tables"]["order_item_modifiers"]["Row"][];
    }
  >;
};

export type OrderListItem = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles: {
    full_name: string;
  } | null;
  payments: Array<{
    payment_method: PaymentMethod;
  }>;
};

export type { CreateOrderInput };
