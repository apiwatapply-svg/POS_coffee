"use client";

import { useMemo, useState } from "react";
import { Coffee, Search } from "lucide-react";
import { ModifierDialog } from "@frontend/components/pos/ModifierDialog";
import type { PosModifierGroup, PosProduct } from "@backend/services/product-service";
import { usePosCartStore, type CartModifier } from "@frontend/stores/pos-cart-store";

type ProductGridProps = {
  products: PosProduct[];
};

function modifierGroupsForProduct(product: PosProduct): PosModifierGroup[] {
  return product.product_modifier_groups
    .map((link) => link.modifier_groups)
    .filter((group): group is PosModifierGroup => Boolean(group))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function ProductGrid({ products }: ProductGridProps) {
  const addItem = usePosCartStore((state) => state.addItem);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      if (product.categories) {
        map.set(product.categories.id, product.categories.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryId === "all" || product.category_id === categoryId;
    return matchesSearch && matchesCategory;
  });

  function addProduct(product: PosProduct, modifiers: CartModifier[] = [], note = "") {
    addItem({
      clientId: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      basePrice: Number(product.price),
      quantity: 1,
      modifiers,
      note: note || undefined,
    });
    setSelectedProduct(null);
  }

  function selectProduct(product: PosProduct) {
    if (!product.is_available) {
      return;
    }

    const groups = modifierGroupsForProduct(product);
    if (groups.length > 0) {
      setSelectedProduct(product);
      return;
    }

    addProduct(product);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white pl-10 pr-3 outline-none focus:border-emerald-700"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or SKU"
            value={search}
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          <button
            className={`h-12 rounded-md px-4 text-sm font-semibold ${
              categoryId === "all" ? "bg-stone-950 text-white" : "border border-stone-300 bg-white text-stone-700"
            }`}
            onClick={() => setCategoryId("all")}
            type="button"
          >
            All
          </button>
          {categories.map((category) => (
            <button
              className={`h-12 rounded-md px-4 text-sm font-semibold ${
                categoryId === category.id
                  ? "bg-stone-950 text-white"
                  : "border border-stone-300 bg-white text-stone-700"
              }`}
              key={category.id}
              onClick={() => setCategoryId(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2 md:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <button
            className="min-h-44 rounded-md border border-stone-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!product.is_available}
            key={product.id}
            onClick={() => selectProduct(product)}
            type="button"
          >
            <div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-emerald-800">
              {product.image_url ? (
                <img alt="" className="size-full object-cover" src={product.image_url} />
              ) : (
                <Coffee aria-hidden="true" size={32} />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-stone-950">{product.name}</p>
              <p className="text-xs text-stone-500">{product.categories?.name ?? "Uncategorized"}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">THB {Number(product.price).toFixed(2)}</p>
                {!product.is_available ? (
                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">Sold out</span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedProduct ? (
        <ModifierDialog
          groups={modifierGroupsForProduct(selectedProduct)}
          onAdd={(modifiers, note) => addProduct(selectedProduct, modifiers, note)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      ) : null}
    </section>
  );
}
