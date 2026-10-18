import Link from "next/link";
import { Card, EmptyState, Icon, inputClass, PageHeader, Stat, StatusBadge } from "@/components/dashboard/ui";
import { listRequests } from "@/lib/admin/data";
import { formatDate, isRequestStatus, REQUEST_STATUSES, STATUS_META } from "@/lib/workflow";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const city = (address: string | null) => address?.match(/\b\d{5}\s+(.+)$/)?.[1] ?? address ?? "";

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = isRequestStatus(one(sp.statut)) ? one(sp.statut) : "";
  const q = one(sp.q);
  const mine = one(sp.moi) === "1";
  const chargers = one(sp.bornes) === "1";
  const { rows, counts, total } = await listRequests({ status, q, mine, chargers });

  const href = (next: Record<string, string>) => {
    const all: Record<string, string> = { statut: status, q, moi: mine ? "1" : "", bornes: chargers ? "1" : "", ...next };
    const params = new URLSearchParams(Object.entries(all).filter(([, v]) => v));
    const s = params.toString();
    return `/admin/demandes${s ? `?${s}` : ""}`;
  };

  const tabs = [
    { value: "", label: "Toutes", count: total, dot: "" },
    ...REQUEST_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, count: counts[s], dot: STATUS_META[s].dot })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Demandes d’étude"
        description="Toutes les demandes envoyées depuis le site, avec leurs factures. Cliquez sur une demande pour la traiter."
      />

      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Nouvelles" value={counts.nouvelle} sub="À traiter en priorité" icon="inbox" tone="brand" />
        <Stat label="En attente / en cours" value={counts.en_attente + counts.en_cours} sub="Études en cours" icon="clock" />
        <Stat label="Études envoyées" value={counts.etude_envoyee} sub="En attente de décision" icon="file" />
        <Stat
          label="Signées / installées"
          value={counts.signee + counts.installee}
          sub={`sur ${total} demande${total > 1 ? "s" : ""}`}
          icon="sun"
          tone="gold"
        />
      </div>

      <nav aria-label="Filtrer par statut" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const on = t.value === status;
          return (
            <Link
              key={t.value || "all"}
              href={href({ statut: t.value })}
              aria-current={on ? "page" : undefined}
              className={`flex flex-none items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold ${
                on ? "border-brand bg-brand text-white" : "border-line bg-card text-fg hover:border-brand-text/40"
              }`}
            >
              {t.dot && <span className={`size-2 rounded-full ${t.dot}`} />}
              {t.label}
              <span className={`text-[12px] ${on ? "text-white/80" : "text-muted"}`}>{t.count}</span>
            </Link>
          );
        })}
      </nav>

      <form className="mb-5 flex flex-wrap items-center gap-3" role="search">
        {status && <input type="hidden" name="statut" value={status} />}
        <div className="relative min-w-[240px] flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une mosquée, une ville, un contact…"
            aria-label="Rechercher"
            className={`${inputClass} pl-9`}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-fg">
          <input type="checkbox" name="moi" value="1" defaultChecked={mine} className="size-4 accent-brand" />
          Assignées à moi
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-fg">
          <input type="checkbox" name="bornes" value="1" defaultChecked={chargers} className="size-4 accent-brand" />
          Avec bornes de recharge
        </label>
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover"
        >
          Filtrer
        </button>
        {(q || mine || chargers) && (
          <Link
            href={href({ q: "", moi: "", bornes: "" })}
            className="text-[13.5px] font-medium text-brand-text underline underline-offset-2"
          >
            Effacer
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState icon="inbox" title="Aucune demande">
          {q || mine || chargers || status
            ? "Aucune demande ne correspond à ces filtres."
            : "Les demandes envoyées depuis le site apparaîtront ici."}
        </EmptyState>
      ) : (
        <Card className="overflow-hidden [&>div]:p-0">
          <table className="w-full text-left text-[14px]">
            <thead className="hidden border-b border-line bg-bg-soft text-[12px] font-semibold uppercase tracking-[0.06em] text-muted md:table-header-group">
              <tr>
                <th className="px-5 py-3">Mosquée</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Infos</th>
                <th className="px-3 py-3">Assignée à</th>
                <th className="px-3 py-3">Reçue le</th>
                <th className="px-5 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const files = r.request_files[0]?.count ?? 0;
                return (
                  <tr key={r.id} className="relative grid gap-1.5 px-5 py-4 hover:bg-bg-soft md:table-row md:p-0">
                    <td className="md:px-5 md:py-3.5">
                      <Link href={`/admin/demandes/${r.id}`} className="grid after:absolute after:inset-0">
                        <span className="font-semibold text-heading">
                          {r.mosque_name}
                          {r.status === "nouvelle" && (
                            <span className="ml-2 inline-block size-2 rounded-full bg-sky-500 align-middle" />
                          )}
                        </span>
                        <span className="text-[13px] text-muted">
                          n°{r.number} · {city(r.mosque_address) || "Adresse non précisée"}
                        </span>
                      </Link>
                    </td>
                    <td className="text-[13.5px] md:px-3 md:py-3.5">
                      <span className="grid">
                        <span className="text-fg">
                          {r.first_name} {r.last_name}
                        </span>
                        <span className="text-muted">{r.phone}</span>
                      </span>
                    </td>
                    <td className="md:px-3 md:py-3.5">
                      <span className="flex items-center gap-3 text-[13px] text-muted">
                        <span className="flex items-center gap-1" title={`${files} facture(s)`}>
                          <Icon name="clip" className="size-4" /> {files}
                        </span>
                        {r.chargers && (
                          <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold-dark">
                            <Icon name="plug" className="size-3.5" /> Bornes
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-[13.5px] text-muted md:px-3 md:py-3.5">
                      {r.assignee ? r.assignee.full_name || r.assignee.email : <span className="italic">Non assignée</span>}
                    </td>
                    <td className="whitespace-nowrap text-[13.5px] text-muted md:px-3 md:py-3.5">{formatDate(r.created_at)}</td>
                    <td className="md:px-5 md:py-3.5 md:text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
