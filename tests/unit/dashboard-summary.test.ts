import { describe, expect, it } from "vitest";
import { calculateAverageOrderValue } from "@/lib/services/report-service";

describe("dashboard summary calculations", () => {
  it("calculates average order value", () => {
    expect(calculateAverageOrderValue(1000, 4)).toBe(250);
  });

  it("returns zero average order value when there are no orders", () => {
    expect(calculateAverageOrderValue(1000, 0)).toBe(0);
  });
});
