"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CheckoutPanel } from "@/components/pos/CheckoutPanel";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePosCartStore } from "@/stores/pos-cart-store";

export function CartPanel() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const isOnline = useNetworkStatus();
  const items = usePosCartStore((state) => state.items);
  const updateQuantity = usePosCartStore((state) => state.updateQuantity);
  const removeItem = usePosCartStore((state) => state.removeItem);
  const clearCart = usePosCartStore((state) => state.clearCart);
  const totals = usePosCartStore((state) => state.totals());

  return (
    <aside className="flex w-full flex-col rounded-md border border-stone-200 bg-white md:w-[380px]">
      <div className="border-b border-stone-200 p-4">
        <h2 className="text-lg font-semibold">Current order</h2>
        <p className="text-sm text-stone-500">{items.length} item types</p>
      </div>

      {!isOnline ? (
        <p className="m-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to connect. Payment confirmation is disabled until the connection is restored.
        </p>
      ) : null}

      <div className="min-h-64 flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-md border border-dashed border-stone-300 text-sm text-stone-500">
            Cart is empty
          </div>
        ) : null}

        {items.map((item) => (
          <div className="rounded-md border border-stone-200 p-3" key={item.clientId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.productName}</p>
                {item.modifiers.length > 0 ? (
                  <p className="mt-1 text-xs text-stone-500">
                    {item.modifiers.map((modifier) => modifier.optionName).join(", ")}
                  </p>
                ) : null}
                {item.note ? <p className="mt-1 text-xs text-stone-500">{item.note}</p> : null}
              </div>
              <button
                aria-label={`Remove ${item.productName}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
                onClick={() => removeItem(item.clientId)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center rounded-md border border-stone-300">
                <button
                  aria-label={`Decrease ${item.productName}`}
                  className="inline-flex size-9 items-center justify-center"
                  onClick={() => updateQuantity(item.clientId, item.quantity - 1)}
                  type="button"
                >
                  <Minus aria-hidden="true" size={15} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  aria-label={`Increase ${item.productName}`}
                  className="inline-flex size-9 items-center justify-center"
                  onClick={() => updateQuantity(item.clientId, item.quantity + 1)}
                  type="button"
                >
                  <Plus aria-hidden="true" size={15} />
                </button>
              </div>
              <p className="text-sm font-semibold">
                THB {((item.basePrice + item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0)) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-stone-200 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span>THB {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">VAT</span>
            <span>THB {totals.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>THB {totals.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-11 rounded-md border border-stone-300 text-sm font-semibold text-stone-700 disabled:opacity-50"
            disabled={items.length === 0}
            onClick={clearCart}
            type="button"
          >
            Clear
          </button>
          <button
            className="h-11 rounded-md bg-emerald-700 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={items.length === 0 || !isOnline}
            onClick={() => setCheckoutOpen(true)}
            type="button"
          >
            Checkout
          </button>
        </div>
      </div>

      {checkoutOpen ? <CheckoutPanel onClose={() => setCheckoutOpen(false)} /> : null}
    </aside>
  );
}
