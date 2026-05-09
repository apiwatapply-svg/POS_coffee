import Link from "next/link";
import { Printer } from "lucide-react";
import { cancelOrderAction } from "@backend/actions/orders";
import type { ReceiptOrder } from "@backend/services/order-service";

type OrderDetailProps = {
  order: ReceiptOrder;
  canCancel: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function OrderDetail({ order, canCancel }: OrderDetailProps) {
  const payment = order.payments[0];
  const canShowCancel = canCancel && !["completed", "cancelled", "refunded"].includes(order.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4 rounded-md border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{order.order_number}</h2>
            <p className="text-sm text-stone-600">{formatDate(order.created_at)}</p>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold"
            href={`/receipt/${order.id}`}
          >
            <Printer aria-hidden="true" size={16} />
            Reprint
          </Link>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-stone-500">Receipt</p>
            <p className="font-semibold">{order.receipt_number}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-stone-500">Cashier</p>
            <p className="font-semibold">{order.profiles?.full_name ?? "-"}</p>
          </div>
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-stone-500">Status</p>
            <p className="font-semibold capitalize">
              {order.status} / {order.payment_status}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {order.order_items.map((item) => (
            <article className="rounded-md border border-stone-200 p-4" key={item.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-sm text-stone-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold">THB {Number(item.total_price).toFixed(2)}</p>
              </div>
              {item.order_item_modifiers.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-stone-600">
                  {item.order_item_modifiers.map((modifier) => (
                    <li key={modifier.id}>
                      {modifier.modifier_group_name}: {modifier.modifier_option_name}
                      {Number(modifier.price_delta) > 0 ? ` (+${Number(modifier.price_delta).toFixed(2)})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.note ? <p className="mt-2 text-sm text-stone-600">Note: {item.note}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-md border border-stone-200 bg-white p-5 text-sm">
          <h3 className="text-base font-semibold">Payment</h3>
          <div className="flex justify-between">
            <span className="text-stone-600">Method</span>
            <span>{payment?.payment_method ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span>THB {Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Discount</span>
            <span>THB {Number(order.discount_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">VAT</span>
            <span>THB {Number(order.vat_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>THB {Number(order.total_amount).toFixed(2)}</span>
          </div>
        </section>

        {order.note ? (
          <section className="rounded-md border border-stone-200 bg-white p-5">
            <h3 className="mb-2 text-base font-semibold">Order note</h3>
            <p className="whitespace-pre-wrap text-sm text-stone-600">{order.note}</p>
          </section>
        ) : null}

        {canShowCancel ? (
          <form action={cancelOrderAction} className="space-y-3 rounded-md border border-stone-200 bg-white p-5">
            <input name="orderId" type="hidden" value={order.id} />
            <label className="space-y-2">
              <span className="text-sm font-semibold">Cancel reason</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                name="reason"
                required
              />
            </label>
            <button className="h-11 w-full rounded-md bg-red-700 text-sm font-semibold text-white" type="submit">
              Cancel order
            </button>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
