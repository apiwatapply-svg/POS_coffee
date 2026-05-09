import { OrdersTable } from "@frontend/components/orders/OrdersTable";
import { requireRole } from "@backend/services/auth-service";
import { getOrders, type OrderFilters } from "@backend/services/order-service";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requireRole(["admin", "manager", "cashier"]);
  const params = await searchParams;
  const filters: OrderFilters = {
    startDate: firstParam(params.startDate),
    endDate: firstParam(params.endDate),
    orderNumber: firstParam(params.orderNumber),
    orderStatus: firstParam(params.orderStatus) as OrderFilters["orderStatus"],
    paymentStatus: firstParam(params.paymentStatus) as OrderFilters["paymentStatus"],
    paymentMethod: firstParam(params.paymentMethod) as OrderFilters["paymentMethod"],
  };
  const orders = await getOrders(filters);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-stone-600">Search and review order history.</p>
      </div>

      <form className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 md:grid-cols-5">
        <input
          className="h-11 rounded-md border border-stone-300 px-3 text-sm"
          defaultValue={filters.orderNumber}
          name="orderNumber"
          placeholder="Order number"
        />
        <input className="h-11 rounded-md border border-stone-300 px-3 text-sm" name="startDate" type="date" />
        <input className="h-11 rounded-md border border-stone-300 px-3 text-sm" name="endDate" type="date" />
        <select className="h-11 rounded-md border border-stone-300 px-3 text-sm" name="orderStatus" defaultValue="">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <button className="h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white" type="submit">
          Filter
        </button>
      </form>

      <OrdersTable orders={orders} />
    </main>
  );
}
