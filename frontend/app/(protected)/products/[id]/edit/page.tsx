import { ProductForm } from "@frontend/components/products/ProductForm";
import { requireRole } from "@backend/services/auth-service";
import { getCategories, getProductById } from "@backend/services/product-service";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireRole(["admin", "manager"]);
  const { id } = await params;
  const [categories, product] = await Promise.all([getCategories(), getProductById(id)]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <p className="text-sm text-stone-600">Update product details and POS availability.</p>
      </div>

      <ProductForm categories={categories} product={product} />
    </main>
  );
}

