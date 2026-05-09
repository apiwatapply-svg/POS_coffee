"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOrder, updateOrderStatus } from "@/lib/services/order-service";
import type { OrderStatus } from "@/types/domain";

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

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as Extract<
    OrderStatus,
    "preparing" | "ready" | "completed" | "cancelled"
  >;

  await updateOrderStatus(orderId, status);
  revalidatePath("/barista");
}
