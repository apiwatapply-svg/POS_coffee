import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductTable } from "@/components/products/ProductTable";
import { requireRole } from "@/lib/services/auth-service";
import { getProducts } from "@/lib/services/product-service";

export default async function ProductsPage() {
  await requireRole(["admin", "manager"]);
  const products = await getProducts();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-stone-600">Manage menu items shown in the POS catalog.</p>
        </div>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          href="/products/create"
        >
          <Plus aria-hidden="true" size={16} />
          Add product
        </Link>
      </div>

      <ProductTable products={products} />
    </main>
  );
}

