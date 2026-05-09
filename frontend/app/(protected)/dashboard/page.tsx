import Link from "next/link";
import { DashboardCharts } from "@frontend/components/dashboard/DashboardCharts";
import { requireRole } from "@backend/services/auth-service";
import { getDashboardSummary } from "@backend/services/report-service";

function todayBangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function DashboardPage() {
  await requireRole(["admin", "manager"]);
  const summary = await getDashboardSummary(todayBangkokDate());

  const cards = [
    { label: "Total sales today", value: `THB ${summary.totalSalesToday.toFixed(2)}` },
    { label: "Total orders today", value: summary.totalOrdersToday.toString() },
    { label: "Total cups sold", value: summary.totalCupsSoldToday.toString() },
    { label: "Average order value", value: `THB ${summary.averageOrderValue.toFixed(2)}` },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-600">Today&apos;s sales and operational snapshot.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article className="rounded-md border border-stone-200 bg-white p-5" key={card.label}>
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold">Best-selling product today</h2>
        <p className="mt-2 text-sm text-stone-600">
          {summary.bestSellingProductToday
            ? `${summary.bestSellingProductToday.productName} (${summary.bestSellingProductToday.quantity} sold)`
            : "No product sales today."}
        </p>
      </section>

      <DashboardCharts summary={summary} />

      <section className="rounded-md border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Recent orders</h2>
          <Link className="text-sm font-semibold text-emerald-700" href="/orders">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {summary.recentOrders.length === 0 ? <p className="text-sm text-stone-500">No recent orders.</p> : null}
          {summary.recentOrders.map((order) => (
            <Link
              className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm hover:bg-stone-100"
              href={`/orders/${order.id}`}
              key={order.id}
            >
              <span>
                <span className="font-medium">{order.orderNumber}</span>
                <span className="ml-2 text-stone-500">{order.cashierName}</span>
              </span>
              <span className="font-semibold">THB {order.totalAmount.toFixed(2)}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
