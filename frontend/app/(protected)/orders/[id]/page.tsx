import { OrderDetail } from "@frontend/components/orders/OrderDetail";
import { requireRole } from "@backend/services/auth-service";
import { getCurrentProfile } from "@backend/services/auth-service";
import { getOrderById } from "@backend/services/order-service";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await requireRole(["admin", "manager", "cashier"]);
  const profile = await getCurrentProfile();
  const { id } = await params;
  const { order } = await getOrderById(id);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Order detail</h1>
        <p className="text-sm text-stone-600">Full order lifecycle, payment details, and receipt actions.</p>
      </div>

      <OrderDetail order={order} canCancel={profile?.role === "admin" || profile?.role === "manager"} />
    </main>
  );
}
