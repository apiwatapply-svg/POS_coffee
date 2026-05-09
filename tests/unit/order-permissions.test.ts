import { describe, expect, it } from "vitest";
import { canViewAllOrders } from "@/lib/services/order-service";

describe("order permissions", () => {
  it("allows admin and manager to view all orders", () => {
    expect(canViewAllOrders("admin")).toBe(true);
    expect(canViewAllOrders("manager")).toBe(true);
  });

  it("does not allow cashier or barista to view all orders", () => {
    expect(canViewAllOrders("cashier")).toBe(false);
    expect(canViewAllOrders("barista")).toBe(false);
  });
});
