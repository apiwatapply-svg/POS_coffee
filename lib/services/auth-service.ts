import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/constants/roles";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/domain";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userResult.user.id)
    .single();

  return profile as Profile | null;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(roleHomePath[profile.role]);
  }

  return profile;
}
