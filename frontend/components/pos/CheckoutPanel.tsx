"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { createOrderAction, type OrderActionState } from "@backend/actions/orders";
import { calculateChange } from "@backend/calculations/pos";
import { paymentMessages } from "@backend/validations/order";
import { usePosCartStore } from "@frontend/stores/pos-cart-store";
import type { PaymentMethod } from "@shared/types/domain";

type CheckoutPanelProps = {
  onClose: () => void;
};

const initialState: OrderActionState = {};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-12 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Saving..." : "Confirm payment"}
    </button>
  );
}

export function CheckoutPanel({ onClose }: CheckoutPanelProps) {
  const [state, formAction] = useActionState(createOrderAction, initialState);
  const items = usePosCartStore((store) => store.items);
  const totals = usePosCartStore((store) => store.totals());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState(totals.totalAmount);
  const [qrPaymentConfirmed, setQrPaymentConfirmed] = useState(false);

  const change = paymentMethod === "cash" ? calculateChange({ totalAmount: totals.totalAmount, receivedAmount }) : 0;
  const clientError =
    items.length === 0
      ? paymentMessages.emptyCart
      : paymentMethod === "cash" && receivedAmount < totals.totalAmount
        ? paymentMessages.cashNotEnough
        : (paymentMethod === "promptpay_qr" || paymentMethod === "qr_payment") && !qrPaymentConfirmed
          ? paymentMessages.qrNotConfirmed
          : null;

  const payload = useMemo(
    () =>
      JSON.stringify({
        cart: {
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            basePrice: item.basePrice,
            modifiers: item.modifiers,
            note: item.note,
          })),
          discount: { type: "fixed", value: 0 },
        },
        payment: {
          method: paymentMethod,
          receivedAmount,
          qrPaymentConfirmed,
        },
      }),
    [items, paymentMethod, qrPaymentConfirmed, receivedAmount],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="w-full max-w-xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold">Checkout</h2>
            <p className="text-sm text-stone-600">Confirm payment and create the order.</p>
          </div>
          <button
            aria-label="Close checkout"
            className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form action={formAction} className="space-y-5 p-5">
          <input name="payload" type="hidden" value={payload} />

          <div className="space-y-2 rounded-md bg-stone-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>THB {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT</span>
              <span>THB {totals.vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Grand total</span>
              <span>THB {totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-stone-700">Payment method</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["cash", "Cash"],
                ["promptpay_qr", "PromptPay QR"],
                ["qr_payment", "QR Payment"],
                ["credit_card", "Credit card"],
                ["e_wallet", "E-wallet"],
              ].map(([value, label]) => (
                <label className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 px-3" key={value}>
                  <input
                    checked={paymentMethod === value}
                    name="paymentMethod"
                    onChange={() => setPaymentMethod(value as PaymentMethod)}
                    type="radio"
                    value={value}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {paymentMethod === "cash" ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Cash received</span>
              <input
                className="h-11 w-full rounded-md border border-stone-300 px-3"
                min="0"
                onChange={(event) => setReceivedAmount(Number(event.target.value))}
                step="0.01"
                type="number"
                value={receivedAmount}
              />
              <span className="block text-sm text-stone-600">Change: THB {Math.max(change, 0).toFixed(2)}</span>
            </label>
          ) : null}

          {paymentMethod === "promptpay_qr" || paymentMethod === "qr_payment" ? (
            <label className="flex items-center gap-2 rounded-md bg-stone-50 p-3 text-sm font-medium text-stone-700">
              <input
                checked={qrPaymentConfirmed}
                onChange={(event) => setQrPaymentConfirmed(event.target.checked)}
                type="checkbox"
              />
              Payment has been received
            </label>
          ) : null}

          {clientError || state.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {clientError ?? state.error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button className="h-12 rounded-md border border-stone-300 text-sm font-semibold" onClick={onClose} type="button">
              Cancel
            </button>
            <SubmitButton disabled={Boolean(clientError)} />
          </div>
        </form>
      </section>
    </div>
  );
}

