"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archiveProduct, createProduct, updateProduct } from "@/lib/services/product-service";

export type ProductActionState = {
  error?: string;
};

function productInputFromFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: Number(formData.get("price") ?? 0),
    cost: Number(formData.get("cost") ?? 0),
    isAvailable: formData.get("isAvailable") === "on",
    trackStock: formData.get("trackStock") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };
}

export async function createProductAction(_: ProductActionState, formData: FormData): Promise<ProductActionState> {
  try {
    await createProduct(productInputFromFormData(formData));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create product" };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(_: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const id = String(formData.get("id") ?? "");

  try {
    await updateProduct(id, productInputFromFormData(formData));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update product" };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}/edit`);
  redirect("/products");
}

export async function archiveProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await archiveProduct(id);
  revalidatePath("/products");
}

