import { OrderQueueBoard } from "@/components/barista/OrderQueueBoard";
import { requireRole } from "@/lib/services/auth-service";
import { getActiveBaristaOrders } from "@/lib/services/order-service";

export default async function BaristaPage() {
  await requireRole(["admin", "manager", "barista"]);
  const orders = await getActiveBaristaOrders();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Barista Display</h1>
        <p className="text-sm text-stone-600">Active paid orders update in realtime.</p>
      </div>

      <OrderQueueBoard orders={orders} />
    </main>
  );
}
