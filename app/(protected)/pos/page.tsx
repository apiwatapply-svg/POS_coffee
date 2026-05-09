import { CartPanel } from "@/components/pos/CartPanel";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { requireRole } from "@/lib/services/auth-service";
import { getPosCatalog } from "@/lib/services/product-service";

export default async function PosPage() {
  await requireRole(["admin", "manager", "cashier"]);
  const products = await getPosCatalog();

  return (
    <main className="flex h-[calc(100vh-137px)] flex-col gap-4 px-6 py-6 md:flex-row">
      <ProductGrid products={products} />
      <CartPanel />
    </main>
  );
}

