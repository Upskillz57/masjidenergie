import "server-only";

import { requireStaff } from "@/lib/auth";
import type { NotificationRow, NotifyCategory } from "@/lib/notifications";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Historique des notifications de la personne connectée et ses préférences.

export async function listNotifications() {
  const user = await requireStaff("/admin/notifications");
  if (!isSupabaseConfigured)
    return { user, missingTables: false, items: demoItems(), prefs: { email: true, muted: [] as NotifyCategory[] } };
  const db = createAdminClient();
  const [{ data, error }, { data: profile }] = await Promise.all([
    db
      .from("notifications")
      .select("id, kind, title, body, url, read_at, created_at, actor:profiles!notifications_actor_id_fkey(full_name, email)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(150),
    db.from("profiles").select("notify_email, notify_muted").eq("id", user.id).maybeSingle(),
  ]);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01" || error.code === "42703")
      return { user, missingTables: true, items: [], prefs: { email: true, muted: [] as NotifyCategory[] } };
    throw error;
  }
  return {
    user,
    missingTables: false,
    items: (data ?? []).map((n) => {
      const a = n.actor as unknown as { full_name: string | null; email: string } | null;
      return { ...n, actor: a ? a.full_name || a.email : null } as NotificationRow;
    }),
    prefs: {
      email: profile?.notify_email ?? true,
      muted: (profile?.notify_muted ?? []) as NotifyCategory[],
    },
  };
}

/** Pastille du menu : notifications non lues. */
export async function countUnreadNotifications(userId: string) {
  if (!isSupabaseConfigured) return 2;
  const { count, error } = await createAdminClient()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return error ? 0 : (count ?? 0);
}

function demoItems(): NotificationRow[] {
  const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
  return [
    {
      id: "00000000-0000-4000-b000-000000000001",
      kind: "task_comment",
      title: "Yacine B. · Relancer pour l’autorisation Enedis",
      body: "J’ai eu le trésorier au téléphone, il envoie le document ce soir.",
      url: "/admin/travail?tache=00000000-0000-4000-a000-000000000011",
      read_at: null,
      created_at: ago(12),
      actor: "Yacine B.",
    },
    {
      id: "00000000-0000-4000-b000-000000000002",
      kind: "request_new",
      title: "Nouvelle demande d’étude : Mosquée de la Fraternité",
      body: "n°108 · Mohamed Diallo · 06 10 45 67 80 · bornes de recharge",
      url: "/admin/demandes/00000000-0000-4000-9000-000000000001",
      read_at: null,
      created_at: ago(95),
      actor: null,
    },
    {
      id: "00000000-0000-4000-b000-000000000003",
      kind: "task_assigned",
      title: "Karim T. vous a confié : Rédiger la proposition financière",
      body: "Demande n°104 · Mosquée Assalam · pour le jeudi 19 novembre",
      url: "/admin/travail?tache=00000000-0000-4000-a000-000000000017",
      read_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      created_at: ago(60 * 26),
      actor: "Karim T.",
    },
  ];
}
