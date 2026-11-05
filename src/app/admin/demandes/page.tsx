import Link from "next/link";
import { AssigneeSelect, StatusSelect } from "@/components/admin/forms";
import { ShareButton } from "@/components/admin/share-dialog";
import { AccountBadge, Card, EmptyState, Icon, inputClass, PageHeader, Stat } from "@/components/dashboard/ui";
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
  const { rows, counts, total, staff } = await listRequests({ status, q, mine, chargers });

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
        description="Toutes les demandes envoyées depuis le site, avec leurs factures. Changez le statut directement sur la ligne, envoyez une demande par e-mail avec ses pièces jointes, ou cliquez dessus pour la traiter."
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
        <div className="relative basis-full sm:min-w-[240px] sm:flex-1 sm:basis-auto">
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
          <span className="sm:hidden">Avec bornes</span>
          <span className="hidden sm:inline">Avec bornes de recharge</span>
        </label>
        <button
          type="submit"
          className="ml-auto h-10 cursor-pointer sm:ml-0 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover"
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
                <th className="px-3 py-3">Reçue le</th>
                <th className="px-3 py-3">Assignée à</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 leading-tight">Partager la demande</th>
                <th className="px-5 py-3 leading-tight">Partager l’étude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const files = (r.request_files[0]?.count ?? 0) - r.studyFiles;
                return (
                  <tr
                    key={r.id}
                    className="relative flex flex-wrap items-center gap-x-2 gap-y-2.5 px-4 py-4 hover:bg-bg-soft sm:px-5 md:table-row md:p-0"
                  >
                    <td className="w-full md:w-auto md:px-5 md:py-3.5">
                      <Link href={`/admin/demandes/${r.id}`} className="grid after:absolute after:inset-0">
                        <span className="font-semibold text-heading">
                          {r.mosque_name}
                          {r.status === "nouvelle" && (
                            <span className="ml-2 inline-block size-2 rounded-full bg-sky-500 align-middle" />
                          )}
                          {r.account !== "compte" && (
                            <span className="ml-2 inline-block align-middle">
                              <AccountBadge state={r.account} compact />
                            </span>
                          )}
                        </span>
                        <span className="text-[13px] text-muted">
                          n°{r.number} · {city(r.mosque_address) || "Adresse non précisée"}
                        </span>
                      </Link>
                    </td>
                    <td className="min-w-0 flex-1 text-[13.5px] md:flex-none md:px-3 md:py-3.5">
                      <span className="flex flex-wrap gap-x-2 md:grid">
                        <span className="text-fg">
                          {r.first_name} {r.last_name}
                        </span>
                        <span className="text-muted">{r.phone}</span>
                      </span>
                    </td>
                    <td className="order-1 w-full md:order-none md:ml-0 md:w-auto md:flex-none md:px-3 md:py-3.5">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
                        <span className="flex items-center gap-1" title={`${files} facture(s)`}>
                          <Icon name="clip" className="size-4" /> {files}
                        </span>
                        {r.chargers && (
                          <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold-dark">
                            <Icon name="plug" className="size-3.5" /> Bornes
                          </span>
                        )}
                        {r.studyFiles > 0 && (
                          <span
                            title={`${r.studyFiles} document${r.studyFiles > 1 ? "s" : ""} d’étude reçu${r.studyFiles > 1 ? "s" : ""}`}
                            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                          >
                            <Icon name="check" className="size-3.5" /> Étude reçue
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="ml-auto self-start whitespace-nowrap text-[13px] text-muted md:ml-0 md:self-auto md:px-3 md:py-3.5 md:text-[13.5px]">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="order-2 md:order-none md:ml-0 md:w-auto md:flex-none md:px-3 md:py-3.5">
                      <AssigneeSelect id={r.id} assignee={r.assigned_to} staff={staff} />
                    </td>
                    <td className="order-2 md:order-none md:ml-0 md:w-auto md:flex-none md:px-3 md:py-3.5">
                      <StatusSelect id={r.id} status={r.status} />
                    </td>
                    <td className="order-3 md:order-none md:ml-0 md:w-auto md:flex-none md:px-3 md:py-3.5">
                      <span className="relative z-10 inline-flex">
                        <ShareButton
                          requestId={r.id}
                          label={`Partager la demande de ${r.mosque_name} par e-mail`}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-card px-2.5 text-[13px] font-semibold text-fg hover:border-brand-text/40 hover:text-brand-text"
                        >
                          <Icon name="share" className="size-4" /> Demande
                        </ShareButton>
                      </span>
                    </td>
                    <td className={`order-3 md:order-none md:ml-0 md:w-auto md:flex-none md:table-cell md:px-5 md:py-3.5 ${r.studyFiles > 0 ? "" : "hidden"}`}>
                      {r.studyFiles > 0 ? (
                        <span className="relative z-10 inline-flex">
                          <ShareButton
                            mode="study"
                            requestId={r.id}
                            label={`Envoyer l’étude à ${r.mosque_name} par e-mail`}
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-100 px-2.5 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25"
                          >
                            <Icon name="mail" className="size-4" /> Étude
                          </ShareButton>
                        </span>
                      ) : (
                        <span className="text-[13px] italic text-muted">En attente</span>
                      )}
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
