import { beforeEach, describe, expect, it } from "vitest";
import { usePosCartStore } from "@/stores/pos-cart-store";

describe("POS cart store", () => {
  beforeEach(() => {
    usePosCartStore.getState().clearCart();
  });

  it("adds an item and calculates totals", () => {
    usePosCartStore.getState().addItem({
      clientId: "item-1",
      productId: "product-1",
      productName: "Latte",
      basePrice: 85,
      quantity: 2,
      modifiers: [{ groupName: "Cup Size", optionName: "Medium", priceDelta: 10 }],
    });

    expect(usePosCartStore.getState().items).toHaveLength(1);
    expect(usePosCartStore.getState().totals()).toMatchObject({
      subtotal: 190,
      vatAmount: 13.3,
      totalAmount: 203.3,
    });
  });

  it("updates quantity and removes items", () => {
    usePosCartStore.getState().addItem({
      clientId: "item-1",
      productId: "product-1",
      productName: "Latte",
      basePrice: 85,
      quantity: 1,
      modifiers: [],
    });

    usePosCartStore.getState().updateQuantity("item-1", 3);
    expect(usePosCartStore.getState().items[0]?.quantity).toBe(3);

    usePosCartStore.getState().removeItem("item-1");
    expect(usePosCartStore.getState().items).toHaveLength(0);
  });
});

