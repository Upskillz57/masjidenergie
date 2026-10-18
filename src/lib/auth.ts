import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { DEMO_USER, isDemoMode } from "@/lib/admin/demo";
import { createAdminClient, createAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole, type Role, type StaffRole } from "@/lib/workflow";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  mosqueId: string | null;
};

/** Utilisateur connecté (vérifié via le JWT Supabase) et son profil, lu une fois par requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();
  if (!isSupabaseConfigured) return isDemoMode ? DEMO_USER : null;
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("id, email, full_name, role, mosque_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name || profile.email,
    role: profile.role,
    mosqueId: profile.mosque_id,
  };
});

export async function requireUser(next = "/espace") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireStaff(next = "/admin") {
  const user = await requireUser(next);
  if (!isStaffRole(user.role)) redirect("/espace");
  return user as CurrentUser & { role: StaffRole };
}

export async function requireAdmin(next = "/admin") {
  const user = await requireStaff(next);
  if (user.role !== "admin") redirect("/admin");
  return user as CurrentUser & { role: "admin" };
}

export const homeFor = (role: Role) => (isStaffRole(role) ? "/admin" : "/espace");
