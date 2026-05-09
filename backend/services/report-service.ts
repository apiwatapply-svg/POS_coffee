import { query } from "@backend/mssql/client";
import type { PaymentMethod } from "@shared/types/domain";

type DashboardOrder = {
  id: string;
  order_number: string;
  receipt_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  profiles: {
    full_name: string;
  } | null;
  payments: Array<{
    payment_method: PaymentMethod;
    amount: number;
  }>;
  order_items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    total_price: number;
  }>;
};

export type DashboardSummary = {
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
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    receiptNumber: string;
    createdAt: string;
    cashierName: string;
    totalAmount: number;
    paymentMethod?: PaymentMethod;
    status: string;
    paymentStatus: string;
  }>;
};

export function calculateAverageOrderValue(totalSales: number, totalOrders: number) {
  if (totalOrders === 0) {
    return 0;
  }

  return Math.round((totalSales / totalOrders) * 100) / 100;
}

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getDashboardSummary(date: string): Promise<DashboardSummary> {
  const { start, end } = dayRange(date);
  const orderRows = await query<
    Omit<DashboardOrder, "profiles" | "payments" | "order_items"> & {
      cashier_name: string | null;
    }
  >(
    `
      select o.*, p.full_name as cashier_name
      from orders o
      left join profiles p on p.id = o.cashier_id
      where o.payment_status = 'paid'
        and o.created_at >= @start
        and o.created_at < @end
      order by o.created_at desc
    `,
    { start, end },
  );
  const orderIds = orderRows.map((order) => order.id);
  const idList = orderIds.map((_, index) => `@id${index}`).join(",");
  const idParams = Object.fromEntries(orderIds.map((id, index) => [`id${index}`, id]));
  const payments =
    orderIds.length > 0
      ? await query<{ order_id: string; payment_method: PaymentMethod; amount: number }>(
          `select order_id, payment_method, amount from payments where order_id in (${idList})`,
          idParams,
        )
      : [];
  const orderItems =
    orderIds.length > 0
      ? await query<{ order_id: string; product_id: string; product_name: string; quantity: number; total_price: number }>(
          `select order_id, product_id, product_name, quantity, total_price from order_items where order_id in (${idList})`,
          idParams,
        )
      : [];
  const orders = orderRows.map((order) => ({
    ...order,
    profiles: order.cashier_name ? { full_name: order.cashier_name } : null,
    payments: payments.filter((payment) => payment.order_id === order.id),
    order_items: orderItems.filter((item) => item.order_id === order.id),
  })) as DashboardOrder[];
  const totalSalesToday = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrdersToday = orders.length;
  const averageOrderValue = calculateAverageOrderValue(totalSalesToday, totalOrdersToday);
  const salesByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour: hour.toString().padStart(2, "0"),
    totalSales: 0,
  }));
  const productQuantities = new Map<string, { productId: string; productName: string; quantity: number }>();
  const paymentSummary = new Map<PaymentMethod, { paymentMethod: PaymentMethod; totalAmount: number; orderCount: number }>();

  orders.forEach((order) => {
    const hour = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(new Date(order.created_at));
    const hourBucket = salesByHour.find((bucket) => bucket.hour === hour);
    if (hourBucket) {
      hourBucket.totalSales += Number(order.total_amount);
    }

    order.order_items.forEach((item) => {
      const current = productQuantities.get(item.product_id) ?? {
        productId: item.product_id,
        productName: item.product_name,
        quantity: 0,
      };
      current.quantity += Number(item.quantity);
      productQuantities.set(item.product_id, current);
    });

    const paymentMethod = order.payments[0]?.payment_method;
    if (paymentMethod) {
      const current = paymentSummary.get(paymentMethod) ?? {
        paymentMethod,
        totalAmount: 0,
        orderCount: 0,
      };
      current.totalAmount += Number(order.total_amount);
      current.orderCount += 1;
      paymentSummary.set(paymentMethod, current);
    }
  });

  const bestSellingProductToday = Array.from(productQuantities.values()).sort((a, b) => b.quantity - a.quantity)[0];
  const totalCupsSoldToday = Array.from(productQuantities.values()).reduce((sum, product) => sum + product.quantity, 0);

  return {
    totalSalesToday,
    totalOrdersToday,
    totalCupsSoldToday,
    averageOrderValue,
    bestSellingProductToday,
    salesByHour,
    paymentMethodSummary: Array.from(paymentSummary.values()),
    recentOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      receiptNumber: order.receipt_number,
      createdAt: order.created_at,
      cashierName: order.profiles?.full_name ?? "-",
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payments[0]?.payment_method,
      status: order.status,
      paymentStatus: order.payment_status,
    })),
  };
}
