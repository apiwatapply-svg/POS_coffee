import { z } from "zod";

const idSchema = z.string().min(1);

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: idSchema,
  description: z.string().optional(),
  imageUrl: z.string().max(1000).optional(),
  price: z.number().positive("Selling price must be greater than 0"),
  cost: z.number().min(0, "Cost cannot be negative"),
  isAvailable: z.boolean(),
  trackStock: z.boolean(),
  sortOrder: z.number().int().min(0),
});
