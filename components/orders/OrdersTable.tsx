import Link from "next/link";
import { Eye, Printer } from "lucide-react";
import type { OrderListItem } from "@/lib/services/order-service";

type OrdersTableProps = {
  orders: OrderListItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-stone-100 text-xs uppercase text-stone-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Cashier</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-medium">{order.order_number}</td>
              <td className="px-4 py-3 text-stone-600">{order.receipt_number}</td>
              <td className="px-4 py-3 text-stone-600">{formatDate(order.created_at)}</td>
              <td className="px-4 py-3 text-stone-600">{order.profiles?.full_name ?? "-"}</td>
              <td className="px-4 py-3 text-stone-600">{order.payments[0]?.payment_method ?? "-"}</td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <span className="block rounded-md bg-stone-100 px-2 py-1 text-xs font-medium capitalize text-stone-700">
                    {order.status}
                  </span>
                  <span className="block text-xs capitalize text-stone-500">{order.payment_status}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold">THB {Number(order.total_amount).toFixed(2)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    aria-label={`View ${order.order_number}`}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                    href={`/orders/${order.id}`}
                    title="View detail"
                  >
                    <Eye aria-hidden="true" size={16} />
                  </Link>
                  <Link
                    aria-label={`Print ${order.receipt_number}`}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                    href={`/receipt/${order.id}`}
                    title="Reprint receipt"
                  >
                    <Printer aria-hidden="true" size={16} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
