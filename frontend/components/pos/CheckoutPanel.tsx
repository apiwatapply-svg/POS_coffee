"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { createOrderAction, type OrderActionState } from "@backend/actions/orders";
import { calculateChange, calculateItemTotal, calculateOrderTotals } from "@backend/calculations/pos";
import { paymentMessages } from "@backend/validations/order";
import { usePosCartStore } from "@frontend/stores/pos-cart-store";
import type { PaymentMethod } from "@shared/types/domain";

type CheckoutPanelProps = {
  onClose: () => void;
};

const initialState: OrderActionState = {};
const promptPayTarget = "0925853800";
const cashTenderOptions = [20, 50, 100, 500, 1000];

function SubmitButton({ disabled, onOpenConfirm }: { disabled: boolean; onOpenConfirm: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-12 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={disabled || pending}
      onClick={onOpenConfirm}
      type="button"
    >
      {pending ? "Saving..." : "Confirm payment"}
    </button>
  );
}

function ConfirmOrderButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creating order..." : "Create order"}
    </button>
  );
}

export function CheckoutPanel({ onClose }: CheckoutPanelProps) {
  const [state, formAction] = useActionState(createOrderAction, initialState);
  const items = usePosCartStore((store) => store.items);
  const totals = useMemo(
    () =>
      calculateOrderTotals({
        items: items.map((item) => ({
          totalPrice: calculateItemTotal({
            basePrice: item.basePrice,
            modifierTotal: item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0),
            quantity: item.quantity,
          }),
        })),
        discount: { type: "fixed", value: 0 },
        vatRate: 7,
        serviceChargeRate: 0,
      }),
    [items],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState(totals.totalAmount);
  const [qrPaymentConfirmed, setQrPaymentConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const change = paymentMethod === "cash" ? calculateChange({ totalAmount: totals.totalAmount, receivedAmount }) : 0;
  const isQrPayment = paymentMethod === "promptpay_qr" || paymentMethod === "qr_payment";
  const clientError =
    items.length === 0
      ? paymentMessages.emptyCart
      : paymentMethod === "cash" && receivedAmount < totals.totalAmount
        ? paymentMessages.cashNotEnough
        : isQrPayment && !qrPaymentConfirmed
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
            <section className="space-y-3 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="min-w-48 flex-1 space-y-2">
                  <span className="text-sm font-medium text-stone-700">Cash received</span>
                  <input
                    className="h-11 w-full rounded-md border border-stone-300 bg-white px-3"
                    min="0"
                    onChange={(event) => setReceivedAmount(Number(event.target.value))}
                    step="0.01"
                    type="number"
                    value={receivedAmount}
                  />
                </label>
                <div className="rounded-md bg-white px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Change</p>
                  <p className="text-2xl font-semibold text-emerald-700">THB {Math.max(change, 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <button
                  className="h-10 rounded-md border border-stone-300 bg-white text-sm font-semibold"
                  onClick={() => setReceivedAmount(totals.totalAmount)}
                  type="button"
                >
                  Exact
                </button>
                {cashTenderOptions.map((amount) => (
                  <button
                    className="h-10 rounded-md border border-stone-300 bg-white text-sm font-semibold disabled:opacity-40"
                    disabled={amount < totals.totalAmount}
                    key={amount}
                    onClick={() => setReceivedAmount(amount)}
                    type="button"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500">
                Select the banknote received or enter a custom amount to prevent wrong change.
              </p>
            </section>
          ) : null}

          {isQrPayment ? (
            <section className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">PromptPay receiver</p>
                  <p className="mt-1 text-2xl font-bold tracking-wide text-emerald-900">{promptPayTarget}</p>
                </div>
                <div className="rounded-md bg-white px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Amount</p>
                  <p className="text-2xl font-semibold text-emerald-700">THB {totals.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-md bg-white p-3 text-sm font-medium text-stone-700">
                <input
                  checked={qrPaymentConfirmed}
                  onChange={(event) => setQrPaymentConfirmed(event.target.checked)}
                  type="checkbox"
                />
                Payment has been received to {promptPayTarget}
              </label>
            </section>
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
            <SubmitButton disabled={Boolean(clientError)} onOpenConfirm={() => setConfirmOpen(true)} />
          </div>

          {confirmOpen ? (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
              style={{ zIndex: 60 }}
            >
              <section className="w-full max-w-md rounded-md bg-white shadow-xl">
                <div className="border-b border-stone-200 px-5 py-4">
                  <h3 className="text-lg font-semibold">Confirm order</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Please confirm before creating this order.
                  </p>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Items</span>
                    <span className="font-medium">{items.length} item types</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Payment</span>
                    <span className="font-medium">{paymentMethod.replaceAll("_", " ")}</span>
                  </div>
                  {paymentMethod === "cash" ? (
                    <div className="flex justify-between">
                      <span className="text-stone-600">Change</span>
                      <span className="font-medium">THB {Math.max(change, 0).toFixed(2)}</span>
                    </div>
                  ) : null}
                  {isQrPayment ? (
                    <div className="flex justify-between">
                      <span className="text-stone-600">Receiver</span>
                      <span className="font-medium">{promptPayTarget}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>THB {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-stone-200 p-5">
                  <button
                    className="h-11 rounded-md border border-stone-300 text-sm font-semibold"
                    onClick={() => setConfirmOpen(false)}
                    type="button"
                  >
                    Back
                  </button>
                  <ConfirmOrderButton />
                </div>
              </section>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
