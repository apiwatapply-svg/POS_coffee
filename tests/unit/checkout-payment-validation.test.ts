import { describe, expect, it } from "vitest";
import { paymentMessages, validateCheckoutPayment } from "@/lib/validations/order";

describe("checkout payment validation", () => {
  it("rejects cash received below grand total", () => {
    expect(
      validateCheckoutPayment({
        totalAmount: 120,
        paymentMethod: "cash",
        receivedAmount: 100,
      }),
    ).toBe(paymentMessages.cashNotEnough);
  });

  it("requires QR payment confirmation", () => {
    expect(
      validateCheckoutPayment({
        totalAmount: 120,
        paymentMethod: "promptpay_qr",
        qrPaymentConfirmed: false,
      }),
    ).toBe(paymentMessages.qrNotConfirmed);
  });

  it("accepts valid cash payment", () => {
    expect(
      validateCheckoutPayment({
        totalAmount: 120,
        paymentMethod: "cash",
        receivedAmount: 200,
      }),
    ).toBeNull();
  });
});
