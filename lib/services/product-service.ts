import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/product";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithCategory = Product & {
  categories: Pick<Category, "name"> | null;
};

export type PosModifierOption = {
  id: string;
  name: string;
  price_delta: number;
  sort_order: number;
};

export type PosModifierGroup = {
  id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  modifier_options: PosModifierOption[];
};

export type PosProduct = Product & {
  categories: Pick<Category, "id" | "name"> | null;
  product_modifier_groups: Array<{
    modifier_groups: PosModifierGroup | null;
  }>;
};

export async function getCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error("Unable to load categories");
  }

  return data as Category[];
}

export async function getProducts() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("is_archived", false)
    .order("sort_order");

  if (error) {
    throw new Error("Unable to load products");
  }

  return data as ProductWithCategory[];
}

export async function getPosCatalog() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        *,
        categories(id,name),
        product_modifier_groups(
          modifier_groups(
            id,
            name,
            is_required,
            min_select,
            max_select,
            sort_order,
            modifier_options(id,name,price_delta,sort_order)
          )
        )
      `,
    )
    .eq("is_archived", false)
    .order("sort_order");

  if (error) {
    throw new Error("Unable to load POS catalog");
  }

  return data as PosProduct[];
}

export async function getProductById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

  if (error || !data) {
    throw new Error("Product not found");
  }

  return data as Product;
}

export async function createProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: parsed.categoryId,
      sku: parsed.sku,
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      cost: parsed.cost,
      is_available: parsed.isAvailable,
      track_stock: parsed.trackStock,
      sort_order: parsed.sortOrder,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.code === "23505" ? "SKU must be unique" : "Unable to create product");
  }

  return data as { id: string };
}

export async function updateProduct(id: string, input: unknown) {
  const parsed = productSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.categoryId,
      sku: parsed.sku,
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      cost: parsed.cost,
      is_available: parsed.isAvailable,
      track_stock: parsed.trackStock,
      sort_order: parsed.sortOrder,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.code === "23505" ? "SKU must be unique" : "Unable to update product");
  }
}

export async function archiveProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update({ is_archived: true }).eq("id", id);

  if (error) {
    throw new Error("Unable to archive product");
  }
}
