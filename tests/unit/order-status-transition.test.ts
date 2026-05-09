import { describe, expect, it } from "vitest";
import { canUpdateOrderStatus } from "@/lib/services/order-service";

describe("order status transitions", () => {
  it("allows the barista preparation flow", () => {
    expect(canUpdateOrderStatus("pending", "preparing")).toBe(true);
    expect(canUpdateOrderStatus("preparing", "ready")).toBe(true);
    expect(canUpdateOrderStatus("ready", "completed")).toBe(true);
  });

  it("rejects skipped or terminal transitions", () => {
    expect(canUpdateOrderStatus("pending", "ready")).toBe(false);
    expect(canUpdateOrderStatus("completed", "ready")).toBe(false);
    expect(canUpdateOrderStatus("cancelled", "preparing")).toBe(false);
  });
});
