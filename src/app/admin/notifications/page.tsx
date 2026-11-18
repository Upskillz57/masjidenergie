import Link from "next/link";
import { DeviceSettings, MarkAllReadButton, NotifyPrefs } from "@/components/admin/notifications/push";
import { Card, EmptyState, Icon, PageHeader, type IconName } from "@/components/dashboard/ui";
import { listNotifications } from "@/lib/admin/notifications-data";
import { NOTIFY_KINDS } from "@/lib/notifications";
import { formatDateTime } from "@/lib/workflow";

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(iso));

function groupLabel(key: string, today: string, yesterday: string) {
  if (key === today) return "Aujourd’hui";
  if (key === yesterday) return "Hier";
  return dayFmt.format(new Date(`${key}T12:00:00Z`)).replace(/^./, (c) => c.toUpperCase());
}

export default async function NotificationsPage() {
  const { items, prefs, missingTables } = await listNotifications();
  const unread = items.filter((n) => !n.read_at).length;

  const now = new Date();
  const today = dayKey(now.toISOString());
  const yesterday = dayKey(new Date(now.getTime() - 86400000).toISOString());
  const groups = new Map<string, typeof items>();
  for (const n of items) {
    const k = dayKey(n.created_at);
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Notifications"
        description="Ce qui vous concerne dans l’équipe : tâches confiées, messages, nouvelles demandes, documents reçus. Activez-les sur votre téléphone pour être prévenu en direct."
      />

      {missingTables ? (
        <EmptyState icon="clock" title="Les notifications ne sont pas encore activées">
          Exécutez le fichier <code>supabase/migrations/0006_notifications.sql</code> dans Supabase → SQL Editor, puis
          rechargez cette page.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card
            title={unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}
            icon="inbox"
            actions={unread ? <MarkAllReadButton /> : undefined}
            className="overflow-hidden [&>div]:p-0"
          >
            {items.length === 0 ? (
              <p className="px-5 py-12 text-center text-[14px] text-muted">
                Aucune notification pour l’instant. Elles apparaîtront ici dès qu’on vous confiera une tâche ou qu’on vous
                écrira.
              </p>
            ) : (
              [...groups].map(([key, list]) => (
                <section key={key}>
                  <h3 className="border-b border-line bg-bg-soft px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {groupLabel(key, today, yesterday)}
                  </h3>
                  <ul className="divide-y divide-line border-b border-line">
                    {list.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={`/admin/notifications/${n.id}`}
                          prefetch={false}
                          className={`flex items-start gap-3.5 px-5 py-3.5 hover:bg-bg-soft ${n.read_at ? "" : "bg-brand/[0.04]"}`}
                        >
                          <span
                            className={`mt-0.5 flex size-9 flex-none items-center justify-center rounded-full ${
                              n.read_at ? "bg-bg-soft text-muted" : "bg-brand/10 text-brand-text"
                            }`}
                          >
                            <Icon name={(NOTIFY_KINDS[n.kind]?.icon ?? "inbox") as IconName} className="size-[18px]" />
                          </span>
                          <span className="grid min-w-0 flex-1 gap-0.5">
                            <span className={`text-[14px] leading-snug ${n.read_at ? "text-fg" : "font-semibold text-heading"}`}>
                              {n.title}
                            </span>
                            {n.body && <span className="line-clamp-2 text-[13px] text-muted">{n.body}</span>}
                            <span className="text-[12px] text-muted">{formatDateTime(n.created_at)}</span>
                          </span>
                          {!n.read_at && <span className="mt-2 size-2.5 flex-none rounded-full bg-sky-500" aria-label="Non lue" />}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </Card>

          <div id="reglages" className="grid scroll-mt-24 gap-6 xl:sticky xl:top-6">
            <Card title="Sur cet appareil" icon="phone">
              <DeviceSettings />
            </Card>
            <Card title="Me prévenir pour" icon="check">
              <NotifyPrefs email={prefs.email} muted={prefs.muted} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
