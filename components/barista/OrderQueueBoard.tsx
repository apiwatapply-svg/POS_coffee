"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import type { BaristaOrder } from "@/lib/services/order-service";

type OrderQueueBoardProps = {
  orders: BaristaOrder[];
};

function elapsedMinutes(createdAt: string) {
  return Math.max(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000), 0);
}

function nextActions(status: BaristaOrder["status"]) {
  if (status === "pending") return [{ label: "Start", value: "preparing" }];
  if (status === "preparing") return [{ label: "Ready", value: "ready" }];
  if (status === "ready") return [{ label: "Complete", value: "completed" }];
  return [];
}

export function OrderQueueBoard({ orders }: OrderQueueBoardProps) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  const { isConnected } = useRealtimeOrders(refresh);

  return (
    <section className="space-y-4">
      {!isConnected ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Realtime connection lost. Refreshing manually may be required.
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          No active drink orders.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order, index) => {
          const age = elapsedMinutes(order.created_at);
          const isLongWaiting = age >= 10;
          return (
            <article
              className={`rounded-md border bg-white p-4 shadow-sm ${
                isLongWaiting ? "border-amber-400" : "border-stone-200"
              }`}
              key={order.id}
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">Queue #{index + 1}</p>
                  <h2 className="text-xl font-semibold">{order.order_number}</h2>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold capitalize">{order.status}</p>
                  <p className={isLongWaiting ? "text-amber-700" : "text-stone-500"}>{age} min</p>
                </div>
              </header>

              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div className="rounded-md bg-stone-50 p-3" key={item.id}>
                    <div className="flex justify-between gap-2 font-semibold">
                      <span>{item.product_name}</span>
                      <span>x{item.quantity}</span>
                    </div>
                    {item.order_item_modifiers.length > 0 ? (
                      <p className="mt-1 text-sm text-stone-600">
                        {item.order_item_modifiers.map((modifier) => modifier.modifier_option_name).join(", ")}
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-sm text-stone-600">Note: {item.note}</p> : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {nextActions(order.status).map((action) => (
                  <form action={updateOrderStatusAction} key={action.value}>
                    <input name="orderId" type="hidden" value={order.id} />
                    <input name="status" type="hidden" value={action.value} />
                    <button className="h-12 w-full rounded-md bg-emerald-700 text-sm font-semibold text-white" type="submit">
                      {action.label}
                    </button>
                  </form>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

