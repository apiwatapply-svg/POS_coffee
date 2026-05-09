import { describe, expect, it } from "vitest";
import { protectedRouteRoles, roleHomePath } from "@/lib/constants/roles";

describe("role route rules", () => {
  it("redirects each role to the correct home page", () => {
    expect(roleHomePath).toEqual({
      admin: "/dashboard",
      manager: "/dashboard",
      cashier: "/pos",
      barista: "/barista",
    });
  });

  it("allows only authorized roles for protected pages", () => {
    expect(protectedRouteRoles["/dashboard"]).toEqual(["admin", "manager"]);
    expect(protectedRouteRoles["/pos"]).toEqual(["admin", "manager", "cashier"]);
    expect(protectedRouteRoles["/barista"]).toEqual(["admin", "manager", "barista"]);
    expect(protectedRouteRoles["/products"]).toEqual(["admin", "manager"]);
    expect(protectedRouteRoles["/orders"]).toEqual(["admin", "manager", "cashier"]);
  });
});

