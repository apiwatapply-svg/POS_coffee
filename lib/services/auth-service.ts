import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/constants/roles";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/domain";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<Profile | null> {
  return getSessionProfile();
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
