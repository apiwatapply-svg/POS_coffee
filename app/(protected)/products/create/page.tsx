import { ProductForm } from "@/components/products/ProductForm";
import { requireRole } from "@/lib/services/auth-service";
import { getCategories } from "@/lib/services/product-service";

export default async function CreateProductPage() {
  await requireRole(["admin", "manager"]);
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Create product</h1>
        <p className="text-sm text-stone-600">Add a new sellable menu item.</p>
      </div>

      <ProductForm categories={categories} />
    </main>
  );
}

