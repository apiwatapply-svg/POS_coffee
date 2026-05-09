"use client";

import type { ReceiptOrder } from "@backend/services/order-service";
import type { Database } from "@shared/types/database";

type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];

type ReceiptViewProps = {
  order: ReceiptOrder;
  settings: StoreSettings;
};

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function ReceiptView({ order, settings }: ReceiptViewProps) {
  const payment = order.payments[0];
  const paperClass = settings.printer_paper_size === "58mm" ? "w-[219px]" : "w-[302px]";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <button className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <section className={`mx-auto bg-white p-4 text-stone-950 shadow-sm print:shadow-none ${paperClass}`}>
        <header className="space-y-1 text-center">
          <h1 className="text-base font-bold">{settings.store_name}</h1>
          {settings.address ? <p className="text-xs">{settings.address}</p> : null}
          {settings.phone ? <p className="text-xs">Tel: {settings.phone}</p> : null}
          {settings.tax_id ? <p className="text-xs">Tax ID: {settings.tax_id}</p> : null}
        </header>

        <div className="my-3 border-t border-dashed border-stone-400" />

        <section className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <span>Receipt</span>
            <span>{order.receipt_number}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Order</span>
            <span>{order.order_number}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Date</span>
            <span>{formatDate(order.created_at, settings.timezone)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Cashier</span>
            <span>{order.profiles?.full_name ?? "-"}</span>
          </div>
          {order.status === "cancelled" || order.status === "refunded" ? (
            <div className="mt-2 rounded border border-stone-400 py-1 text-center font-bold uppercase">{order.status}</div>
          ) : null}
        </section>

        <div className="my-3 border-t border-dashed border-stone-400" />

        <section className="space-y-3 text-xs">
          {order.order_items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between gap-2">
                <span>
                  {item.quantity} x {item.product_name}
                </span>
                <span>{Number(item.total_price).toFixed(2)}</span>
              </div>
              {item.order_item_modifiers.map((modifier) => (
                <div className="ml-3 flex justify-between gap-2 text-stone-600" key={modifier.id}>
                  <span>
                    {modifier.modifier_group_name}: {modifier.modifier_option_name}
                  </span>
                  <span>{Number(modifier.price_delta) > 0 ? `+${Number(modifier.price_delta).toFixed(2)}` : ""}</span>
                </div>
              ))}
              {item.note ? <p className="ml-3 text-stone-600">Note: {item.note}</p> : null}
            </div>
          ))}
        </section>

        <div className="my-3 border-t border-dashed border-stone-400" />

        <section className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>{Number(order.discount_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT</span>
            <span>{Number(order.vat_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service</span>
            <span>{Number(order.service_charge_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </section>

        {payment ? (
          <>
            <div className="my-3 border-t border-dashed border-stone-400" />
            <section className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Payment</span>
                <span>{payment.payment_method}</span>
              </div>
              {payment.received_amount !== null ? (
                <div className="flex justify-between">
                  <span>Received</span>
                  <span>{Number(payment.received_amount).toFixed(2)}</span>
                </div>
              ) : null}
              {payment.change_amount !== null ? (
                <div className="flex justify-between">
                  <span>Change</span>
                  <span>{Number(payment.change_amount).toFixed(2)}</span>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        <div className="my-3 border-t border-dashed border-stone-400" />

        <footer className="text-center text-xs">{settings.receipt_footer}</footer>
      </section>
    </div>
  );
}
