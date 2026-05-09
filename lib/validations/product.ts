import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.uuid(),
  description: z.string().optional(),
  price: z.number().positive("Selling price must be greater than 0"),
  cost: z.number().min(0, "Cost cannot be negative"),
  isAvailable: z.boolean(),
  trackStock: z.boolean(),
  sortOrder: z.number().int().min(0),
});

