import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validations/order";

describe("checkout validation", () => {
  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({
      items: [],
      paymentMethod: "cash",
      receivedAmount: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Cart cannot be empty");
  });

  it("rejects zero quantity", () => {
    const result = checkoutSchema.safeParse({
      items: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          quantity: 0,
          basePrice: 85,
          modifierTotal: 0,
        },
      ],
      paymentMethod: "cash",
      receivedAmount: 100,
    });

    expect(result.success).toBe(false);
  });
});

