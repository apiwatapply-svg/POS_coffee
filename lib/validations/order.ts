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

export const createOrderSchema = z.object({
  cart: z.object({
    items: z.array(
      z.object({
        productId: z.uuid(),
        productName: z.string().min(1),
        quantity: z.number().int().positive(),
        basePrice: z.number().positive(),
        modifiers: z.array(
          z.object({
            groupName: z.string().min(1),
            optionName: z.string().min(1),
            priceDelta: z.number(),
          }),
        ),
        note: z.string().max(500).optional(),
      }),
    ).min(1, "Cart cannot be empty"),
    discount: z.object({
      type: z.enum(["fixed", "percentage"]),
      value: z.number().min(0),
    }),
    note: z.string().max(500).optional(),
  }),
  payment: z.object({
    method: z.enum(["cash", "promptpay_qr", "qr_payment", "credit_card", "e_wallet"]),
    receivedAmount: z.number().min(0).optional(),
    transactionRef: z.string().optional(),
    qrPaymentConfirmed: z.boolean().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const paymentMessages = {
  emptyCart: "Cart cannot be empty",
  cashNotEnough: "Cash received amount must be greater than or equal to grand total",
  qrNotConfirmed: "Please confirm that QR payment has been received",
  networkOffline: "Unable to save order. Please check your internet connection and try again.",
};

export function validateCheckoutPayment(input: {
  totalAmount: number;
  paymentMethod: CreateOrderInput["payment"]["method"];
  receivedAmount?: number;
  qrPaymentConfirmed?: boolean;
}) {
  if (input.paymentMethod === "cash" && (input.receivedAmount ?? 0) < input.totalAmount) {
    return paymentMessages.cashNotEnough;
  }

  if (
    (input.paymentMethod === "promptpay_qr" || input.paymentMethod === "qr_payment") &&
    !input.qrPaymentConfirmed
  ) {
    return paymentMessages.qrNotConfirmed;
  }

  return null;
}
