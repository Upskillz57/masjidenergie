import Link from "next/link";
import { rejectAccountRequest } from "@/app/actions/admin";
import { ApproveAccountForm, ConfirmButton } from "@/components/admin/forms";
import { EmptyState, ghostButtonClass, Icon, PageHeader } from "@/components/dashboard/ui";
import { listAccountRequests } from "@/lib/admin/data";
import { ACCOUNT_STATUS_META, formatDate, formatDateTime } from "@/lib/workflow";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const tabs = [
  { value: "en_attente", label: "À valider" },
  { value: "approuvee", label: "Approuvées" },
  { value: "refusee", label: "Refusées" },
  { value: "toutes", label: "Toutes" },
] as const;

export default async function AccountRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).statut;
  const current = tabs.find((t) => t.value === raw)?.value ?? "en_attente";
  const rows = await listAccountRequests(current === "toutes" ? undefined : current);

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Comptes mosquées"
        description="Les mosquées demandent l’ouverture de leur espace depuis le site. En validant, la mosquée est créée et son responsable reçoit un e-mail pour choisir son mot de passe."
      />

      <nav aria-label="Filtrer" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const on = t.value === current;
          return (
            <Link
              key={t.value}
              href={`/admin/comptes?statut=${t.value}`}
              aria-current={on ? "page" : undefined}
              className={`flex-none rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold ${
                on ? "border-brand bg-brand text-white" : "border-line bg-card text-fg hover:border-brand-text/40"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState icon="userPlus" title={current === "en_attente" ? "Aucune demande à valider" : "Aucune demande"}>
          Les demandes envoyées depuis la page « Créer un compte » du site apparaîtront ici.
        </EmptyState>
      ) : (
        <ul className="grid gap-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="grid gap-5 rounded-xl border border-line bg-card p-5 shadow-[0_4px_14px_#0000000a] lg:grid-cols-[minmax(0,1fr)_280px]"
            >
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[17px] font-bold text-heading">{r.mosque_name}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${ACCOUNT_STATUS_META[r.status].badge}`}>
                    {ACCOUNT_STATUS_META[r.status].label}
                  </span>
                  <span className="text-[13px] text-muted">
                    n°{r.number} · reçue le {formatDateTime(r.created_at)}
                  </span>
                </div>
                <div className="grid gap-x-8 gap-y-1.5 text-[14px] text-fg sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <Icon name="pin" className="size-4 text-muted" /> {r.mosque_address || "Adresse non précisée"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon name="users" className="size-4 text-muted" /> {r.first_name} {r.last_name}
                    {r.role_in_mosque && <span className="text-muted">· {r.role_in_mosque}</span>}
                  </span>
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-brand-text">
                    <Icon name="phone" className="size-4 text-muted" /> {r.phone}
                  </a>
                  <a href={`mailto:${r.email}`} className="flex items-center gap-2 break-all hover:text-brand-text">
                    <Icon name="mail" className="size-4 flex-none text-muted" /> {r.email}
                  </a>
                </div>
                {r.message && <p className="rounded-lg bg-bg-soft px-4 py-2.5 text-[14px] text-fg">{r.message}</p>}
                <Link
                  href={`/admin/demandes?q=${encodeURIComponent(r.email)}`}
                  className="justify-self-start text-[13.5px] font-medium text-brand-text hover:underline"
                >
                  Voir ses demandes d’étude →
                </Link>
              </div>

              <div className="grid content-start gap-2 lg:border-l lg:border-line lg:pl-5">
                {r.status === "en_attente" ? (
                  <>
                    <ApproveAccountForm id={r.id} />
                    <form action={rejectAccountRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmButton message={`Refuser la demande de ${r.mosque_name} ?`} className={`${ghostButtonClass} w-full`}>
                        Refuser
                      </ConfirmButton>
                    </form>
                  </>
                ) : (
                  <p className="text-[13.5px] text-muted">
                    {r.status === "approuvee" ? "Validée" : "Refusée"}
                    {r.reviewed_at && ` le ${formatDate(r.reviewed_at)}`}
                    {r.reviewer && ` par ${r.reviewer.full_name || r.reviewer.email}`}.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
