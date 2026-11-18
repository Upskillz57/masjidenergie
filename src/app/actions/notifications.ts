"use server";

import { refresh } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { isNotifyCategory } from "@/lib/notifications";
import { notify } from "@/lib/notify";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Notifications : lecture, abonnement push de l'appareil, préférences.

export async function markAllNotificationsRead() {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  await createAdminClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  refresh();
}

type Sub = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

/** Enregistre l'abonnement push de cet appareil (un par navigateur ou application installée). */
export async function savePushSubscription(sub: Sub, userAgent: string): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return { ok: true };
  const endpoint = typeof sub?.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub?.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub?.keys?.auth === "string" ? sub.keys.auth : "";
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) return { ok: false };
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth, user_agent: String(userAgent ?? "").slice(0, 300) },
      { onConflict: "endpoint" },
    );
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireStaff();
  if (!isSupabaseConfigured || typeof endpoint !== "string") return;
  await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
}

/** Notification d'essai, envoyée à soi-même sur tous ses appareils. */
export async function sendTestNotification() {
  const user = await requireStaff();
  notify([user.id], {
    kind: "task_assigned",
    title: "Les notifications fonctionnent",
    body: "Vous serez prévenu ici des tâches, messages et demandes qui vous concernent.",
    url: "/admin/notifications",
  });
}

export async function updateNotifyPrefs(prefs: { email: boolean; muted: string[] }) {
  const user = await requireStaff();
  if (!isSupabaseConfigured) return;
  await createAdminClient()
    .from("profiles")
    .update({ notify_email: Boolean(prefs.email), notify_muted: (prefs.muted ?? []).filter(isNotifyCategory) })
    .eq("id", user.id);
  refresh();
}
