import { ReceiptView } from "@/components/receipt/ReceiptView";
import { requireRole } from "@/lib/services/auth-service";
import { getOrderById } from "@/lib/services/order-service";

type ReceiptPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  await requireRole(["admin", "manager", "cashier"]);
  const { orderId } = await params;
  const { order, settings } = await getOrderById(orderId);

  return <ReceiptView order={order} settings={settings} />;
}

