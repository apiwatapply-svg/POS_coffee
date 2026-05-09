import Link from "next/link";
import { Archive, Coffee, Pencil } from "lucide-react";
import { archiveProductAction } from "@backend/actions/products";
import type { ProductWithCategory } from "@backend/services/product-service";

type ProductTableProps = {
  products: ProductWithCategory[];
};

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
        No products found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-stone-100 text-xs uppercase text-stone-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-emerald-800">
                    {product.image_url ? (
                      <img alt="" className="size-full object-cover" src={product.image_url} />
                    ) : (
                      <Coffee aria-hidden="true" size={22} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-stone-950">{product.name}</div>
                    {product.description ? <div className="text-xs text-stone-500">{product.description}</div> : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-stone-600">{product.sku}</td>
              <td className="px-4 py-3 text-stone-600">{product.categories?.name ?? "-"}</td>
              <td className="px-4 py-3 text-right font-medium">THB {Number(product.price).toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">
                  {product.is_available ? "Available" : "Unavailable"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    aria-label={`Edit ${product.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                    href={`/products/${product.id}/edit`}
                    title="Edit"
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </Link>
                  <form action={archiveProductAction}>
                    <input name="id" type="hidden" value={product.id} />
                    <button
                      aria-label={`Archive ${product.name}`}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                      title="Archive"
                      type="submit"
                    >
                      <Archive aria-hidden="true" size={16} />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
