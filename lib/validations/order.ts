import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  basePrice: z.number().positive(),
  modifierTotal: z.number().min(0),
  note: z.string().max(500).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
  paymentMethod: z.enum(["cash", "promptpay_qr", "qr_payment", "credit_card", "e_wallet"]),
  receivedAmount: z.number().min(0).optional(),
  paymentConfirmed: z.boolean().optional(),
});

