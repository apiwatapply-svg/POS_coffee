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

function money(value: number) {
  return `THB ${value.toFixed(2)}`;
}

export default async function DashboardPage() {
  await requireRole(["admin", "manager"]);
  const summary = await getDashboardSummary(todayBangkokDate());

  const cards = [
    { label: "Total sales today", value: money(summary.totalSalesToday) },
    { label: "Total orders today", value: summary.totalOrdersToday.toString() },
    { label: "Total cups sold", value: summary.totalCupsSoldToday.toString() },
    { label: "Average order value", value: money(summary.averageOrderValue) },
  ];
  const topProducts = summary.productSalesToday.filter((product) => product.quantity > 0).slice(0, 8);
  const slowProducts = [...summary.productSalesToday]
    .sort((a, b) => a.quantity - b.quantity || a.totalSales - b.totalSales || a.productName.localeCompare(b.productName))
    .slice(0, 8);

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

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-stone-200 bg-white p-5">
          <p className="text-sm font-medium text-emerald-700">Best-selling product today</p>
          <h2 className="mt-2 text-xl font-semibold">
            {summary.bestSellingProductToday?.productName ?? "No product sales today"}
          </h2>
          {summary.bestSellingProductToday ? (
            <p className="mt-2 text-sm text-stone-600">
              {summary.bestSellingProductToday.quantity} sold - {money(summary.bestSellingProductToday.totalSales)}
            </p>
          ) : null}
        </article>
        <article className="rounded-md border border-stone-200 bg-white p-5">
          <p className="text-sm font-medium text-red-700">Slowest-selling product today</p>
          <h2 className="mt-2 text-xl font-semibold">
            {summary.worstSellingProductToday?.productName ?? "No product data"}
          </h2>
          {summary.worstSellingProductToday ? (
            <p className="mt-2 text-sm text-stone-600">
              {summary.worstSellingProductToday.quantity} sold - {money(summary.worstSellingProductToday.totalSales)}
            </p>
          ) : null}
        </article>
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold">Sales by category today</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-stone-200 text-left text-stone-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="px-4 py-2 text-right font-medium">Qty sold</th>
                <th className="px-4 py-2 text-right font-medium">Sales</th>
                <th className="py-2 pl-4 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {summary.categorySalesToday.map((category) => (
                <tr key={category.categoryId}>
                  <td className="py-3 pr-4 font-medium text-stone-950">{category.categoryName}</td>
                  <td className="px-4 py-3 text-right">{category.quantity}</td>
                  <td className="px-4 py-3 text-right font-semibold">{money(category.totalSales)}</td>
                  <td className="py-3 pl-4 text-right text-stone-600">
                    {summary.totalSalesToday > 0
                      ? `${((category.totalSales / summary.totalSalesToday) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DashboardCharts summary={summary} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold">Top products today</h2>
          <div className="mt-4 space-y-2">
            {topProducts.length === 0 ? <p className="text-sm text-stone-500">No product sales today.</p> : null}
            {topProducts.map((product, index) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm" key={product.productId}>
                <span>
                  <span className="font-semibold">{index + 1}. {product.productName}</span>
                  <span className="ml-2 text-stone-500">{product.categoryName}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{money(product.totalSales)}</span>
                  <span className="text-xs text-stone-500">{product.quantity} sold</span>
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-md border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold">Slow products today</h2>
          <div className="mt-4 space-y-2">
            {slowProducts.map((product, index) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm" key={product.productId}>
                <span>
                  <span className="font-semibold">{index + 1}. {product.productName}</span>
                  <span className="ml-2 text-stone-500">{product.categoryName}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{money(product.totalSales)}</span>
                  <span className="text-xs text-stone-500">{product.quantity} sold</span>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

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
