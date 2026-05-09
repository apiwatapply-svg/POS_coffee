import Link from "next/link";
import { Coffee } from "lucide-react";
import { LoginForm } from "@frontend/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 text-stone-950">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Coffee aria-hidden="true" size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Coffee POS</h1>
            <p className="text-sm text-stone-600">Sign in to continue</p>
          </div>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
          <LoginForm />
          <div className="mt-5 text-center">
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

