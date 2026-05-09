import { query, queryOne } from "@backend/mssql/client";
import { productSchema } from "@backend/validations/product";
import type { Database } from "@shared/types/database";

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

type PosCatalogRow = Product & {
  category_name: string | null;
  modifier_group_id: string | null;
  modifier_group_name: string | null;
  is_required: boolean | null;
  min_select: number | null;
  max_select: number | null;
  modifier_group_sort_order: number | null;
  modifier_option_id: string | null;
  modifier_option_name: string | null;
  price_delta: number | null;
  modifier_option_sort_order: number | null;
};

export async function getCategories() {
  return query<Category>(
    `
      select *
      from categories
      where is_active = 1
      order by sort_order
    `,
  );
}

export async function getProducts() {
  const rows = await query<Product & { category_name: string | null }>(
    `
      select p.*, c.name as category_name
      from products p
      left join categories c on c.id = p.category_id
      where p.is_archived = 0
      order by p.sort_order
    `,
  );

  return rows.map((row) => ({
    ...row,
    categories: row.category_name ? { name: row.category_name } : null,
  })) as ProductWithCategory[];
}

export async function getPosCatalog() {
  const rows = await query<PosCatalogRow>(
    `
      select
        p.*,
        c.name as category_name,
        mg.id as modifier_group_id,
        mg.name as modifier_group_name,
        mg.is_required,
        mg.min_select,
        mg.max_select,
        mg.sort_order as modifier_group_sort_order,
        mo.id as modifier_option_id,
        mo.name as modifier_option_name,
        mo.price_delta,
        mo.sort_order as modifier_option_sort_order
      from products p
      left join categories c on c.id = p.category_id
      left join product_modifier_groups pmg on pmg.product_id = p.id
      left join modifier_groups mg on mg.id = pmg.modifier_group_id and mg.is_active = 1
      left join modifier_options mo on mo.modifier_group_id = mg.id and mo.is_active = 1
      where p.is_archived = 0
      order by p.sort_order, mg.sort_order, mo.sort_order
    `,
  );

  const products = new Map<string, PosProduct>();
  const modifierGroups = new Map<string, Map<string, PosModifierGroup>>();

  rows.forEach((row) => {
    const product =
      products.get(row.id) ??
      ({
        ...row,
        categories: row.category_id ? { id: row.category_id, name: row.category_name ?? "" } : null,
        product_modifier_groups: [],
      } as PosProduct);

    products.set(row.id, product);

    if (!row.modifier_group_id || !row.modifier_group_name) {
      return;
    }

    const productGroups = modifierGroups.get(row.id) ?? new Map<string, PosModifierGroup>();
    modifierGroups.set(row.id, productGroups);

    const group =
      productGroups.get(row.modifier_group_id) ??
      ({
        id: row.modifier_group_id,
        name: row.modifier_group_name,
        is_required: Boolean(row.is_required),
        min_select: Number(row.min_select ?? 0),
        max_select: Number(row.max_select ?? 1),
        sort_order: Number(row.modifier_group_sort_order ?? 0),
        modifier_options: [],
      } satisfies PosModifierGroup);

    productGroups.set(row.modifier_group_id, group);

    if (row.modifier_option_id && !group.modifier_options.some((option) => option.id === row.modifier_option_id)) {
      group.modifier_options.push({
        id: row.modifier_option_id,
        name: row.modifier_option_name ?? "",
        price_delta: Number(row.price_delta ?? 0),
        sort_order: Number(row.modifier_option_sort_order ?? 0),
      });
    }

    product.product_modifier_groups = Array.from(productGroups.values()).map((modifierGroup) => ({
      modifier_groups: modifierGroup,
    }));
  });

  return Array.from(products.values());
}

export async function getProductById(id: string) {
  const product = await queryOne<Product>("select * from products where id = @id", { id });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function createProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  const id = crypto.randomUUID();

  try {
    await query(
      `
        insert into products (
          id, category_id, sku, name, description, price, cost,
          is_available, track_stock, sort_order
        )
        values (
          @id, @categoryId, @sku, @name, @description, @price, @cost,
          @isAvailable, @trackStock, @sortOrder
        )
      `,
      {
        id,
        categoryId: parsed.categoryId,
        sku: parsed.sku,
        name: parsed.name,
        description: parsed.description || null,
        price: parsed.price,
        cost: parsed.cost,
        isAvailable: parsed.isAvailable,
        trackStock: parsed.trackStock,
        sortOrder: parsed.sortOrder,
      },
    );
  } catch (error) {
    throw new Error(error instanceof Error && error.message.includes("UQ_products_sku") ? "SKU must be unique" : "Unable to create product");
  }

  return { id };
}

export async function updateProduct(id: string, input: unknown) {
  const parsed = productSchema.parse(input);

  try {
    await query(
      `
        update products
        set
          category_id = @categoryId,
          sku = @sku,
          name = @name,
          description = @description,
          price = @price,
          cost = @cost,
          is_available = @isAvailable,
          track_stock = @trackStock,
          sort_order = @sortOrder,
          updated_at = sysdatetimeoffset()
        where id = @id
      `,
      {
        id,
        categoryId: parsed.categoryId,
        sku: parsed.sku,
        name: parsed.name,
        description: parsed.description || null,
        price: parsed.price,
        cost: parsed.cost,
        isAvailable: parsed.isAvailable,
        trackStock: parsed.trackStock,
        sortOrder: parsed.sortOrder,
      },
    );
  } catch (error) {
    throw new Error(error instanceof Error && error.message.includes("UQ_products_sku") ? "SKU must be unique" : "Unable to update product");
  }
}

export async function archiveProduct(id: string) {
  await query(
    `
      update products
      set is_archived = 1, updated_at = sysdatetimeoffset()
      where id = @id
    `,
    { id },
  );
}
