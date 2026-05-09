import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/mssql/client";
import type { Database } from "@/types/database";

const SESSION_COOKIE = "pos_session";
const SESSION_DAYS = 7;

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function createSession(profileId: string) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `
      insert into staff_sessions (id, profile_id, expires_at)
      values (@sessionId, @profileId, @expiresAt)
    `,
    { sessionId, profileId, expiresAt },
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await query("delete from staff_sessions where id = @sessionId", { sessionId });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionProfile() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const profile = await queryOne<Profile>(
    `
      select
        p.id,
        p.auth_user_id,
        p.full_name,
        p.email,
        p.phone,
        p.role,
        p.is_active,
        p.created_at,
        p.updated_at
      from staff_sessions s
      inner join profiles p on p.id = s.profile_id
      where s.id = @sessionId
        and s.expires_at > sysdatetimeoffset()
    `,
    { sessionId },
  );

  if (!profile) {
    cookieStore.delete(SESSION_COOKIE);
  }

  return profile;
}
