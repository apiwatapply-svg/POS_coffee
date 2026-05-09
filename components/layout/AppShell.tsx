import Link from "next/link";
import { Coffee } from "lucide-react";
import type { UserRole } from "@/types/domain";

type AppShellProps = {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
};

type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "manager"] },
  { href: "/pos", label: "POS", roles: ["admin", "manager", "cashier"] },
  { href: "/barista", label: "Barista", roles: ["admin", "manager", "barista"] },
  { href: "/products", label: "Products", roles: ["admin", "manager"] },
  { href: "/orders", label: "Orders", roles: ["admin", "manager", "cashier"] },
];

export function AppShell({ children, role, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link className="flex items-center gap-2 font-semibold" href="/pos">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Coffee aria-hidden="true" size={20} />
            </span>
            Coffee POS
          </Link>
          <div className="text-right text-sm">
            <p className="font-medium">{userName}</p>
            <p className="capitalize text-stone-500">{role}</p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-4">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
