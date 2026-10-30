import Link from "next/link";
import { Card, EmptyState, Icon, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { DossierChecklist, ProjectContextForm } from "@/components/dossier/dossier";
import { PieceUpload } from "@/components/dossier/piece-upload";
import { dossierPieces, REQUIRED_BILLS } from "@/lib/dossier";
import { getMyDossier, getMyRequests } from "@/lib/espace/data";
import { site } from "@/lib/site";
import { formatDate, type RequestStatus } from "@/lib/workflow";

const steps: { title: string; text: string; reached: RequestStatus[] }[] = [
  { title: "Demande reçue", text: "Votre demande et vos factures sont entre nos mains.", reached: ["nouvelle", "en_attente", "en_cours", "etude_envoyee", "signee", "installee"] },
  { title: "Étude en cours", text: "Analyse de votre consommation et du potentiel de votre toiture.", reached: ["en_attente", "en_cours", "etude_envoyee", "signee", "installee"] },
  { title: "Étude envoyée", text: "Vous recevez la proposition détaillée et les économies prévues.", reached: ["etude_envoyee", "signee", "installee"] },
  { title: "Projet signé", text: "Sans crédit, sans emprunt, sans endettement. L’installation est planifiée.", reached: ["signee", "installee"] },
  { title: "Centrale en service", text: "Vos panneaux produisent : suivez vos économies dans votre espace.", reached: ["installee"] },
];

export default async function ProjectPage() {
  const { requests } = await getMyRequests();
  const current = requests[0];
  const dossier = current ? await getMyDossier(current) : null;
  const count = (kind: string) => dossier?.files.filter((f) => f.kind === kind).length ?? 0;
  const pieces =
    current &&
    dossierPieces({
      bills: count("facture"),
      enedisFiles: count("enedis"),
      roofFiles: count("toiture"),
      linkySigned: Boolean(dossier?.linkySigned),
      motivations: current.project_motivations,
      context: current.project_context,
    });

  return (
    <>
      <PageHeader eyebrow="MON PROJET SOLAIRE" title="Le suivi de votre projet" description="Chaque étape, de la demande d’étude à la mise en service de vos panneaux." />

      {!current ? (
        <EmptyState icon="sun" title="Aucune demande d’étude pour l’instant">
          <p className="mb-4">Faites votre demande d’étude gratuite : elle apparaîtra ici et vous pourrez suivre chaque étape.</p>
          <Link href="/#etude" className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover">
            Demander une étude
          </Link>
        </EmptyState>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 gap-6">
          <Card title={`${current.mosque_name} · demande n°${current.number}`} icon="sun" actions={<StatusBadge status={current.status} />}>
            {current.status === "sans_suite" ? (
              <p className="text-[14.5px] text-fg">Ce projet n’a pas été poursuivi. Contactez-nous si votre situation a changé.</p>
            ) : (
              <ol className="grid gap-0">
                {steps.map((s, i) => {
                  const done = s.reached.includes(current.status);
                  const isCurrent = done && !steps[i + 1]?.reached.includes(current.status);
                  return (
                    <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < steps.length - 1 && (
                        <span className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${done && steps[i + 1].reached.includes(current.status) ? "bg-brand-text" : "bg-line"}`} />
                      )}
                      <span
                        className={`relative flex size-8 flex-none items-center justify-center rounded-full border-2 ${
                          done ? "border-brand-text bg-brand-text text-white dark:text-brand-deep" : "border-line bg-card text-muted"
                        } ${isCurrent ? "ring-4 ring-brand-text/20" : ""}`}
                      >
                        {done ? <Icon name="check" className="size-4" /> : <span className="text-[13px] font-bold">{i + 1}</span>}
                      </span>
                      <span className="grid gap-0.5 pt-1">
                        <span className={`text-[15px] font-semibold ${done ? "text-heading" : "text-muted"}`}>
                          {s.title}
                          {isCurrent && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[11.5px] font-semibold text-gold-dark">Étape actuelle</span>}
                        </span>
                        <span className="text-[13.5px] text-muted">{s.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {pieces && (
            <Card title="Votre dossier" icon="folder">
              <DossierChecklist pieces={pieces} />
              <div className="mt-5 grid gap-3 border-t border-line pt-5">
                {!dossier?.linkySigned && (
                  <Link href="/espace/documents/linky" className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover">
                    Signer l’autorisation Enedis en ligne
                  </Link>
                )}
                <PieceUpload requestId={current.id} kind="facture" label={`Ajouter des factures (${count("facture")} / ${REQUIRED_BILLS})`} />
                <PieceUpload requestId={current.id} kind="enedis" label="Joindre une autorisation Enedis déjà signée" />
                <PieceUpload requestId={current.id} kind="toiture" label="Ajouter une vue aérienne de la toiture" />
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <ProjectContextForm requestId={current.id} motivations={current.project_motivations} context={current.project_context} />
              </div>
            </Card>
          )}
          </div>

          <div className="grid gap-6">
            <Card title="Votre demande" icon="file">
              <dl className="grid gap-2.5 text-[14px]">
                <div className="flex justify-between gap-3"><dt className="text-muted">Envoyée le</dt><dd className="font-medium text-fg">{formatDate(current.created_at)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Numéro</dt><dd className="font-medium text-fg">n°{current.number}</dd></div>
              </dl>
            </Card>
            <Card title="Une question ?" icon="phone">
              <p className="mb-3 text-[14px] text-muted">Notre équipe vous répond pour toute question sur votre projet.</p>
              <a href={site.contact.phoneHref} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-semibold text-white hover:bg-brand-hover">
                <Icon name="phone" className="size-4" /> {site.contact.phone}
              </a>
            </Card>
            {requests.length > 1 && (
              <Card title="Demandes précédentes" icon="clock">
                <ul className="grid gap-2 text-[14px]">
                  {requests.slice(1).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="text-fg">n°{r.number} · {formatDate(r.created_at)}</span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
