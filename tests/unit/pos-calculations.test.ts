import { describe, expect, it } from "vitest";
import { calculateChange, calculateItemTotal, calculateOrderTotals } from "@backend/calculations/pos";

describe("POS calculations", () => {
  it("calculates item total from base price, modifiers, and quantity", () => {
    expect(calculateItemTotal({ basePrice: 85, modifierTotal: 20, quantity: 2 })).toBe(210);
  });

  it("calculates fixed discount, VAT, service charge, and grand total", () => {
    expect(
      calculateOrderTotals({
        items: [{ totalPrice: 210 }, { totalPrice: 70 }],
        discount: { type: "fixed", value: 30 },
        vatRate: 7,
        serviceChargeRate: 10,
      }),
    ).toEqual({
      subtotal: 280,
      discountAmount: 30,
      taxableBase: 250,
      vatAmount: 17.5,
      serviceChargeAmount: 25,
      totalAmount: 292.5,
    });
  });

  it("calculates percentage discount", () => {
    expect(
      calculateOrderTotals({
        items: [{ totalPrice: 200 }],
        discount: { type: "percentage", value: 10 },
        vatRate: 7,
        serviceChargeRate: 0,
      }),
    ).toMatchObject({
      subtotal: 200,
      discountAmount: 20,
      taxableBase: 180,
      vatAmount: 12.6,
      totalAmount: 192.6,
    });
  });

  it("calculates change for cash payment", () => {
    expect(calculateChange({ totalAmount: 292.5, receivedAmount: 300 })).toBe(7.5);
  });
});

