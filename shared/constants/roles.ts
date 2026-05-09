import type { UserRole } from "@shared/types/domain";

export const roleHomePath: Record<UserRole, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  cashier: "/pos",
  barista: "/barista",
};

export const protectedRouteRoles: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "manager"],
  "/pos": ["admin", "manager", "cashier"],
  "/barista": ["admin", "manager", "barista"],
  "/products": ["admin", "manager"],
  "/orders": ["admin", "manager", "cashier"],
};

