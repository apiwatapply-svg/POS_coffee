"use server";

import { redirect } from "next/navigation";
import { createOrder } from "@/lib/services/order-service";

export type OrderActionState = {
  error?: string;
};

export async function createOrderAction(_: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const payload = String(formData.get("payload") ?? "");

  try {
    const result = await createOrder(JSON.parse(payload));
    redirect(result.redirectTo);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save order" };
  }
}

