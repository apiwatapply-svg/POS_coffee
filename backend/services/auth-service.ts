import { redirect } from "next/navigation";
import { getSessionProfile } from "@backend/auth/session";
import { roleHomePath } from "@shared/constants/roles";
import type { Database } from "@shared/types/database";
import type { UserRole } from "@shared/types/domain";

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
