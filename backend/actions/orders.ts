"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelOrder, createOrder, updateOrderStatus } from "@backend/services/order-service";
import type { OrderStatus } from "@shared/types/domain";

export type OrderActionState = {
  error?: string;
};

export async function createOrderAction(_: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const payload = String(formData.get("payload") ?? "");
  let redirectTo: string;

  try {
    const result = await createOrder(JSON.parse(payload));
    redirectTo = result.redirectTo;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save order" };
  }

  redirect(redirectTo);
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

export async function cancelOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  await cancelOrder(orderId, reason || "No reason provided");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/barista");
}
