import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 text-stone-950">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Reset password</h1>
          <p className="text-sm text-stone-600">Enter your email and we will send reset instructions.</p>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
          <ForgotPasswordForm />
          <div className="mt-5 text-center">
            <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/login">
              Back to login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

