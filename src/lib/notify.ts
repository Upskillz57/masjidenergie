import "server-only";

import { after } from "next/server";
import webpush from "web-push";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { NOTIFY_CATEGORIES, NOTIFY_KINDS, type NotifyKind } from "@/lib/notifications";
import { site } from "@/lib/site";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

// Notifications de l'équipe : une ligne dans l'historique de chaque destinataire, une notification push
// sur ses appareils, et un e-mail pour ce qui le concerne directement.
// L'envoi a lieu après la réponse : une action n'est jamais ralentie ni bloquée par une notification.

export type Notice = {
  kind: NotifyKind;
  title: string;
  body?: string | null;
  /** Page à ouvrir, relative au site (« /admin/travail?tache=… »). */
  url: string;
  /** Auteur de l'action : il n'est jamais notifié de ce qu'il fait lui-même. */
  actorId?: string | null;
  /** Envoyer aussi un e-mail (réservé à ce qui s'adresse directement à la personne). */
  email?: boolean;
  /** Texte du bouton de l'e-mail. */
  cta?: string;
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
let vapidReady = false;
function pushEnabled() {
  if (!publicKey || !privateKey) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || `mailto:${site.contact.email}`, publicKey, privateKey);
    vapidReady = true;
  }
  return true;
}

const schedule = (job: () => Promise<void>) => {
  const run = () => job().catch((e) => console.error("[notifications]", e));
  try {
    after(run);
  } catch {
    void run();
  }
};

/** Notifie des membres de l'équipe précis. */
export function notify(userIds: (string | null | undefined)[], notice: Notice) {
  if (!isSupabaseConfigured) return;
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id) && id !== notice.actorId))];
  if (ids.length) schedule(() => deliver(ids, notice));
}

/** Notifie toute l'équipe (nouvelle demande, demande de compte…). */
export function notifyStaff(notice: Notice) {
  if (!isSupabaseConfigured) return;
  schedule(async () => {
    const { data } = await createAdminClient().from("profiles").select("id").in("role", ["admin", "equipe", "technique"]);
    const ids = (data ?? []).map((p) => p.id).filter((id) => id !== notice.actorId);
    if (ids.length) await deliver(ids, notice);
  });
}

/** Personne assignée à une demande, ou toute l'équipe si personne ne s'en occupe encore. */
export async function notifyRequestOwner(requestId: string, notice: Notice) {
  if (!isSupabaseConfigured) return;
  const { data } = await createAdminClient().from("study_requests").select("assigned_to").eq("id", requestId).maybeSingle();
  if (data?.assigned_to) notify([data.assigned_to], notice);
  else notifyStaff(notice);
}

type Recipient = { id: string; email: string; role: string; notify_email: boolean; notify_muted: string[] };

async function deliver(ids: string[], n: Notice) {
  const db = createAdminClient();
  const category = NOTIFY_KINDS[n.kind].category;
  const { data: people } = await db
    .from("profiles")
    .select("id, email, role, notify_email, notify_muted")
    .in("id", ids)
    .returns<Recipient[]>();
  const recipients = (people ?? []).filter((p) => isStaffRole(p.role) && !(p.notify_muted ?? []).includes(category));
  if (!recipients.length) return;

  const { data: rows, error } = await db
    .from("notifications")
    .insert(
      recipients.map((p) => ({
        user_id: p.id,
        kind: n.kind,
        title: n.title.slice(0, 200),
        body: n.body?.slice(0, 500) || null,
        url: n.url,
        actor_id: n.actorId ?? null,
      })),
    )
    .select("id, user_id");
  if (error) throw error;
  const rowFor = new Map((rows ?? []).map((r) => [r.user_id, r.id]));

  await Promise.all([sendPush(db, recipients, n, rowFor), sendEmails(recipients, n)]);
}

async function sendPush(
  db: ReturnType<typeof createAdminClient>,
  recipients: Recipient[],
  n: Notice,
  rowFor: Map<string, string>,
) {
  if (!pushEnabled()) return;
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in(
      "user_id",
      recipients.map((r) => r.id),
    );
  const stale: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      // Ouvrir la notification passe par l'historique : elle est marquée comme lue au passage.
      const row = rowFor.get(s.user_id);
      const payload = JSON.stringify({
        title: n.title,
        body: n.body ?? "",
        url: row ? `/admin/notifications/${row}` : n.url,
        tag: `${n.kind}:${n.url}`,
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
        });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
        else console.error("[push] envoi impossible", status ?? e);
      }
    }),
  );
  if (stale.length) await db.from("push_subscriptions").delete().in("id", stale);
}

async function sendEmails(recipients: Recipient[], n: Notice) {
  if (!n.email) return;
  const to = recipients.filter((r) => r.notify_email !== false);
  const category = NOTIFY_CATEGORIES[NOTIFY_KINDS[n.kind].category].label;
  const body = n.body
    ? `<p style="margin:0 0 14px;padding:12px 16px;border-left:3px solid #c8a24c;background:#f7f4ec;white-space:pre-wrap">${escapeHtml(n.body)}</p>`
    : "";
  const html = emailLayout(
    n.title,
    `${body}<p style="margin:0;color:#6b7280;font-size:13px">Vous recevez cet e-mail car cela vous concerne dans l’espace Masjid Energie. Les e-mails se désactivent dans Notifications → Réglages.</p>`,
    { label: n.cta ?? "Ouvrir dans l’espace admin", href: `${site.url}${n.url}` },
    { eyebrow: category, preheader: n.body ?? n.title },
  );
  await Promise.all(to.map((r) => sendEmail({ to: [r.email], subject: n.title, html })));
}
