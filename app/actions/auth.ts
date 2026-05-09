"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/constants/roles";
import { forgotPasswordSchema, loginSchema } from "@/lib/validations/auth";
import type { UserRole } from "@/types/domain";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login details" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password" };
  }

  const { data: userResult } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("auth_user_id", userResult.user?.id ?? "")
    .single();
  const profile = data as { role: UserRole; is_active: boolean } | null;

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "Your account has been disabled. Please contact Admin" };
  }

  redirect(roleHomePath[profile.role as UserRole]);
}

export async function sendPasswordResetAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email must be valid" };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  });

  return { success: "If this email exists, a reset link has been sent" };
}
