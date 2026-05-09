"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession } from "@backend/auth/session";
import { verifyPassword } from "@backend/auth/password";
import { roleHomePath } from "@shared/constants/roles";
import { queryOne } from "@backend/mssql/client";
import { forgotPasswordSchema, loginSchema } from "@backend/validations/auth";
import type { UserRole } from "@shared/types/domain";

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

  const profile = await queryOne<{
    id: string;
    role: UserRole;
    is_active: boolean;
    password_hash: string;
  }>(
    `
      select id, role, is_active, password_hash
      from profiles
      where email = @email
    `,
    { email: parsed.data.email },
  );

  if (!profile || !verifyPassword(parsed.data.password, profile.password_hash)) {
    return { error: "Invalid email or password" };
  }

  if (!profile.is_active) {
    await clearSession();
    return { error: "Your account has been disabled. Please contact Admin" };
  }

  await createSession(profile.id);
  redirect(roleHomePath[profile.role]);
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

  await queryOne<{ id: string }>("select id from profiles where email = @email", { email: parsed.data.email });

  return { success: "If this email exists, contact an administrator to reset the password" };
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
