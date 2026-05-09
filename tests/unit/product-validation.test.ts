import { describe, expect, it } from "vitest";
import { productSchema } from "@backend/validations/product";

describe("product validation", () => {
  it("accepts a valid product", () => {
    const result = productSchema.safeParse({
      name: "Latte",
      sku: "LATTE",
      categoryId: "11111111-1111-4111-8111-111111111111",
      description: "Espresso with milk",
      price: 85,
      cost: 35,
      isAvailable: true,
      trackStock: false,
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-positive selling price", () => {
    const result = productSchema.safeParse({
      name: "Latte",
      sku: "LATTE",
      categoryId: "11111111-1111-4111-8111-111111111111",
      price: 0,
      cost: 35,
      isAvailable: true,
      trackStock: false,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative cost", () => {
    const result = productSchema.safeParse({
      name: "Latte",
      sku: "LATTE",
      categoryId: "11111111-1111-4111-8111-111111111111",
      price: 85,
      cost: -1,
      isAvailable: true,
      trackStock: false,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });
});

