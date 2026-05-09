import { ReceiptView } from "@frontend/components/receipt/ReceiptView";
import { requireRole } from "@backend/services/auth-service";
import { getOrderById } from "@backend/services/order-service";

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

