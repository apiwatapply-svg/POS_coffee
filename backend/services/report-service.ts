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
    totalSales: number;
  };
  worstSellingProductToday?: {
    productId: string;
    productName: string;
    quantity: number;
    totalSales: number;
  };
  categorySalesToday: Array<{
    categoryId: string;
    categoryName: string;
    quantity: number;
    totalSales: number;
  }>;
  productSalesToday: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    quantity: number;
    totalSales: number;
  }>;
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
  const activeProducts = await query<{
    product_id: string;
    product_name: string;
    category_id: string;
    category_name: string;
  }>(`
    select p.id as product_id, p.name as product_name, c.id as category_id, c.name as category_name
    from products p
    join categories c on c.id = p.category_id
    where p.is_archived = 0
      and c.is_active = 1
    order by c.sort_order, p.sort_order, p.name
  `);
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
  const categorySales = new Map<string, { categoryId: string; categoryName: string; quantity: number; totalSales: number }>();
  const productSales = new Map<
    string,
    { productId: string; productName: string; categoryName: string; quantity: number; totalSales: number }
  >();
  const paymentSummary = new Map<PaymentMethod, { paymentMethod: PaymentMethod; totalAmount: number; orderCount: number }>();
  const activeProductsById = new Map(activeProducts.map((product) => [product.product_id, product]));

  activeProducts.forEach((product) => {
    if (!categorySales.has(product.category_id)) {
      categorySales.set(product.category_id, {
        categoryId: product.category_id,
        categoryName: product.category_name,
        quantity: 0,
        totalSales: 0,
      });
    }

    productSales.set(product.product_id, {
      productId: product.product_id,
      productName: product.product_name,
      categoryName: product.category_name,
      quantity: 0,
      totalSales: 0,
    });
  });

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
      const current = productSales.get(item.product_id) ?? {
        productId: item.product_id,
        productName: item.product_name,
        categoryName: "Uncategorized",
        quantity: 0,
        totalSales: 0,
      };
      current.quantity += Number(item.quantity);
      current.totalSales += Number(item.total_price);
      productSales.set(item.product_id, current);

      const activeProduct = activeProductsById.get(item.product_id);
      if (activeProduct) {
        const category = categorySales.get(activeProduct.category_id) ?? {
          categoryId: activeProduct.category_id,
          categoryName: activeProduct.category_name,
          quantity: 0,
          totalSales: 0,
        };
        category.quantity += Number(item.quantity);
        category.totalSales += Number(item.total_price);
        categorySales.set(activeProduct.category_id, category);
      }
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

  const productSalesToday = Array.from(productSales.values()).sort(
    (a, b) => b.quantity - a.quantity || b.totalSales - a.totalSales || a.productName.localeCompare(b.productName),
  );
  const bestSellingProductToday = productSalesToday.find((product) => product.quantity > 0);
  const worstSellingProductToday = productSalesToday.length
    ? [...productSalesToday].sort(
        (a, b) => a.quantity - b.quantity || a.totalSales - b.totalSales || a.productName.localeCompare(b.productName),
      )[0]
    : undefined;
  const totalCupsSoldToday = productSalesToday.reduce((sum, product) => sum + product.quantity, 0);

  return {
    totalSalesToday,
    totalOrdersToday,
    totalCupsSoldToday,
    averageOrderValue,
    bestSellingProductToday,
    worstSellingProductToday,
    categorySalesToday: Array.from(categorySales.values()),
    productSalesToday,
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
