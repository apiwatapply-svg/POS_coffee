"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { createProductAction, updateProductAction, type ProductActionState } from "@/app/actions/products";
import { productSchema } from "@/lib/validations/product";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductFormValues = {
  name: string;
  sku: string;
  categoryId: string;
  description?: string;
  price: number;
  cost: number;
  isAvailable: boolean;
  trackStock: boolean;
  sortOrder: number;
};

type ProductFormProps = {
  categories: Category[];
  product?: Product;
};

const initialState: ProductActionState = {};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      <Save aria-hidden="true" size={16} />
      {pending ? "Saving..." : isEditing ? "Save product" : "Create product"}
    </button>
  );
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const isEditing = Boolean(product);
  const action = isEditing ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState(action, initialState);
  const {
    register,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      categoryId: product?.category_id ?? categories[0]?.id ?? "",
      description: product?.description ?? "",
      price: Number(product?.price ?? 0),
      cost: Number(product?.cost ?? 0),
      isAvailable: product?.is_available ?? true,
      trackStock: product?.track_stock ?? false,
      sortOrder: product?.sort_order ?? 0,
    },
  });

  return (
    <form action={formAction} className="space-y-6 rounded-md border border-stone-200 bg-white p-6">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Product name</span>
          <input className="h-11 w-full rounded-md border border-stone-300 px-3" {...register("name")} name="name" />
          {errors.name ? <span className="text-xs text-red-600">{errors.name.message}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">SKU</span>
          <input className="h-11 w-full rounded-md border border-stone-300 px-3" {...register("sku")} name="sku" />
          {errors.sku ? <span className="text-xs text-red-600">{errors.sku.message}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Category</span>
          <select
            className="h-11 w-full rounded-md border border-stone-300 px-3"
            {...register("categoryId")}
            name="categoryId"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <span className="text-xs text-red-600">{errors.categoryId.message}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Sort order</span>
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-3"
            min="0"
            step="1"
            type="number"
            {...register("sortOrder", { valueAsNumber: true })}
            name="sortOrder"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Selling price</span>
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-3"
            min="0"
            step="0.01"
            type="number"
            {...register("price", { valueAsNumber: true })}
            name="price"
          />
          {errors.price ? <span className="text-xs text-red-600">{errors.price.message}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Cost price</span>
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-3"
            min="0"
            step="0.01"
            type="number"
            {...register("cost", { valueAsNumber: true })}
            name="cost"
          />
          {errors.cost ? <span className="text-xs text-red-600">{errors.cost.message}</span> : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-700">Description</span>
        <textarea
          className="min-h-24 w-full rounded-md border border-stone-300 px-3 py-2"
          {...register("description")}
          name="description"
        />
      </label>

      <div className="flex flex-wrap gap-5">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
          <input className="size-4" type="checkbox" {...register("isAvailable")} name="isAvailable" />
          Available on POS
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
          <input className="size-4" type="checkbox" {...register("trackStock")} name="trackStock" />
          Track stock
        </label>
      </div>

      <SubmitButton isEditing={isEditing} />
    </form>
  );
}

