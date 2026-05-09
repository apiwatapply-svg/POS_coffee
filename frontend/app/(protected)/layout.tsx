import { AppShell } from "@frontend/components/layout/AppShell";
import { getCurrentProfile } from "@backend/services/auth-service";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      {children}
    </AppShell>
  );
}

