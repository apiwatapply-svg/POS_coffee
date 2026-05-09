import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto flex max-w-4xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Coffee POS</p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-normal">Coffee shop point of sale</h1>
          <p className="max-w-2xl text-lg text-stone-600">
            A tablet-friendly POS foundation for cashier checkout, barista queues, product management, and sales reporting.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white"
            href="/login"
          >
            Go to login
          </Link>
          <Link
            className="rounded-md border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900"
            href="/pos"
          >
            Open POS
          </Link>
        </div>
      </section>
    </main>
  );
}
