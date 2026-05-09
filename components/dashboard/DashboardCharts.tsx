"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardSummary } from "@/lib/services/report-service";

type DashboardChartsProps = {
  summary: DashboardSummary;
};

export function DashboardCharts({ summary }: DashboardChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-md border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold">Sales by hour</h2>
        <div className="h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={summary.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="totalSales" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-md border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold">Payment methods</h2>
        <div className="space-y-3">
          {summary.paymentMethodSummary.length === 0 ? (
            <p className="text-sm text-stone-500">No payments today.</p>
          ) : null}
          {summary.paymentMethodSummary.map((payment) => (
            <div className="rounded-md bg-stone-50 p-3" key={payment.paymentMethod}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">{payment.paymentMethod}</span>
                <span>{payment.orderCount} orders</span>
              </div>
              <p className="mt-1 text-lg font-semibold">THB {payment.totalAmount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
