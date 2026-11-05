import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addComment,
  assignRequest,
  deleteComment,
  updateRequestStatus,
  uploadRequestFiles,
} from "@/app/actions/admin";
import { AutoSubmitSelect, ConfirmButton, CopyLinkButton, InviteAccountForm, SubmitButton } from "@/components/admin/forms";
import { RequestFiles } from "@/components/admin/request-files";
import { ShareButton } from "@/components/admin/share-dialog";
import { StudyUploadForm } from "@/components/admin/study-upload-form";
import { DossierChecklist, ProjectContextForm } from "@/components/dossier/dossier";
import { AccountBadge, buttonClass, Card, ghostButtonClass, Icon, inputClass, StatusBadge } from "@/components/dashboard/ui";
import { getRequest } from "@/lib/admin/data";
import { dossierPieces, FILE_KIND_LABEL, FILE_KINDS, missingPieces } from "@/lib/dossier";
import { createStudyToken, studyUploadUrl } from "@/lib/study-link";
import {
  formatDate,
  formatDateTime,
  isRequestStatus,
  REQUEST_STATUSES,
  ROLE_LABEL,
  STATUS_META,
} from "@/lib/workflow";

const pj = (n: unknown) =>
  Number(n) ? ` (${n} pièce${Number(n) > 1 ? "s" : ""} jointe${Number(n) > 1 ? "s" : ""})` : "";

const personName = (p: { full_name: string | null; email: string } | null) => (p ? p.full_name || p.email : "Système");

function eventLabel(type: string, data: Record<string, string | number | null | undefined>) {
  const status = (v: unknown) => (isRequestStatus(v) ? STATUS_META[v].label : String(v));
  switch (type) {
    case "created":
      return `Demande reçue depuis le site${data.bills ? ` avec ${data.bills} facture${Number(data.bills) > 1 ? "s" : ""}` : ""}`;
    case "status":
      return `Statut : ${status(data.from)} → ${status(data.to)}`;
    case "assign":
      return data.to ? `Assignée à ${data.to}` : "Assignation retirée";
    case "files":
      return `Documents ajoutés : ${data.names}`;
    case "context":
      return "Contexte du projet mis à jour";
    case "file_deleted":
      return `Document supprimé : ${data.name}`;
    case "shared":
      return `Partagée par e-mail à ${data.to}${pj(data.files)}`;
    case "study_shared":
      return `Étude envoyée par e-mail à ${data.to}${pj(data.files)}`;
    case "study_uploaded":
      return `Étude déposée par ${data.by}${data.company ? ` (${data.company})` : ""}${Number(data.files) ? ` : ${data.names}` : ""}`;
    case "account_invite":
      return `Invitation à créer un compte envoyée à ${data.to}`;
    default:
      return type;
  }
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRequest(id);
  if (!detail) notFound();
  const { request: r, files, comments, events, staff, user, linky, account } = detail;
  const requestFiles = files.filter((f) => !f.study);
  const studyFiles = files.filter((f) => f.study);
  type Deposit = { id: string; created_at: string; data: Record<string, string | number | null | undefined> };
  const studyDeposits = events.filter((e) => e.type === "study_uploaded") as Deposit[];
  const lastInvite = events.find((e) => e.type === "account_invite");
  const pieces = dossierPieces({
    bills: files.filter((f) => f.kind === "facture").length,
    enedisFiles: files.filter((f) => f.kind === "enedis").length,
    roofFiles: files.filter((f) => f.kind === "toiture").length,
    linkySigned: Boolean(linky),
    motivations: r.project_motivations,
    context: r.project_context,
  });
  const missing = missingPieces(pieces);
  const reminder = `mailto:${r.email}?subject=${encodeURIComponent(`Votre dossier d’étude n°${r.number} : pièces à compléter`)}&body=${encodeURIComponent(
    `Assalamou alaykoum ${r.first_name},\n\nPour réaliser l’étude de ${r.mosque_name}, il nous manque encore :\n${missing.map((p) => `- ${p.label}${p.detail ? ` (reçues : ${p.detail})` : ""}`).join("\n")}\n\nBien à vous,\nL’équipe Masjid Energie`,
  )}`;

  const mapQuery = encodeURIComponent(`${r.mosque_name} ${r.mosque_address ?? ""}`);

  return (
    <>
      <Link
        href="/admin/demandes"
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-text hover:underline"
      >
        <Icon name="back" className="size-4" /> Toutes les demandes
      </Link>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <span className="text-[12px] font-semibold tracking-[0.22em] text-gold">DEMANDE N°{r.number}</span>
          <h1 className="text-[clamp(24px,2.2vw,30px)] font-extrabold leading-tight tracking-[-0.02em] text-heading">
            {r.mosque_name}
          </h1>
          <p className="text-[14.5px] text-muted">
            Reçue le {formatDateTime(r.created_at)} · mise à jour le {formatDate(r.updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {r.chargers && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[12.5px] font-semibold text-gold-dark">
              <Icon name="plug" className="size-3.5" /> Bornes de recharge souhaitées
            </span>
          )}
          {account !== "compte" && <AccountBadge state={account} />}
          <StatusBadge status={r.status} />
          <ShareButton requestId={r.id} className={`${ghostButtonClass} h-9 px-3 text-[13.5px]`}>
            <Icon name="share" className="size-4" /> Partager
          </ShareButton>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-6">
          <Card title="Mosquée et contact" icon="pin">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid content-start gap-2 text-[14.5px]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Mosquée</span>
                <span className="font-semibold text-heading">{r.mosque_name}</span>
                <span className="text-fg">{r.mosque_address || "Adresse non précisée"}</span>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
                  >
                    Voir sur la carte <Icon name="external" className="size-3.5" />
                  </a>
                  {r.mosque_osm && (
                    <a
                      href={`https://www.openstreetmap.org/${r.mosque_osm}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
                    >
                      Fiche OpenStreetMap <Icon name="external" className="size-3.5" />
                    </a>
                  )}
                </span>
              </div>
              <div className="grid content-start gap-2 text-[14.5px]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Contact</span>
                <span className="font-semibold text-heading">
                  {r.first_name} {r.last_name}
                </span>
                <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-fg hover:text-brand-text">
                  <Icon name="phone" className="size-4 text-muted" /> {r.phone}
                </a>
                <a href={`mailto:${r.email}`} className="inline-flex items-center gap-2 break-all text-fg hover:text-brand-text">
                  <Icon name="mail" className="size-4 flex-none text-muted" /> {r.email}
                </a>
              </div>
            </div>
            {r.message && (
              <div className="mt-5 rounded-lg bg-bg-soft px-4 py-3 text-[14.5px] leading-relaxed text-fg">
                <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Message</span>
                <p className="whitespace-pre-line">{r.message}</p>
              </div>
            )}
            {account !== "compte" && (
              <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-400/25 dark:bg-amber-400/10">
                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                  <Icon name="userPlus" className="size-[18px]" />
                </span>
                <div className="grid min-w-[200px] flex-1 gap-0.5 text-[13.5px]">
                  <span className="font-semibold text-heading">
                    {account === "demande"
                      ? "Demande de compte en attente de validation"
                      : "Cette mosquée n’a pas encore de compte Masjid Energie"}
                  </span>
                  <span className="text-muted">
                    {account === "demande" ? (
                      <>
                        Validez-la dans{" "}
                        <Link href="/admin/comptes" className="font-medium text-brand-text hover:underline">
                          Comptes mosquées
                        </Link>{" "}
                        pour ouvrir son espace en ligne.
                      </>
                    ) : lastInvite ? (
                      `Invitation envoyée le ${formatDateTime(lastInvite.created_at)}.`
                    ) : (
                      "Invitez le demandeur à créer l’espace en ligne de sa mosquée pour suivre sa demande."
                    )}
                  </span>
                </div>
                {account === "aucun" && <InviteAccountForm id={r.id} again={Boolean(lastInvite)} />}
              </div>
            )}
          </Card>

          <Card
            title="Dossier de la mosquée"
            icon="folder"
            actions={
              missing.length > 0 && (
                <a href={reminder} className={`${ghostButtonClass} h-8 px-3 text-[13px]`}>
                  <Icon name="mail" className="size-4" /> Réclamer les pièces
                </a>
              )
            }
          >
            <DossierChecklist pieces={pieces} />
            {linky && (
              <a
                href={`/documents/formulaires/${linky.id}?voir=1`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-brand-text hover:underline"
              >
                Voir l’autorisation signée en ligne <Icon name="external" className="size-3.5" />
              </a>
            )}
            <div className="mt-5 border-t border-line pt-5">
              <ProjectContextForm requestId={r.id} motivations={r.project_motivations} context={r.project_context} />
            </div>
          </Card>

          <div className="grid items-start gap-6 2xl:grid-cols-2">
          <Card title={`La demande : factures et documents (${requestFiles.length})`} icon="clip">
            <RequestFiles requestId={r.id} files={requestFiles} />

            <form
              action={uploadRequestFiles}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-line px-4 py-3"
            >
              <input type="hidden" name="id" value={r.id} />
              <Icon name="upload" className="size-5 text-brand-text" />
              <input
                type="file"
                name="files"
                multiple
                required
                aria-label="Fichiers à ajouter"
                className="min-w-0 flex-1 text-[13.5px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-brand-text"
              />
              <select name="kind" defaultValue="document" aria-label="Type de document" className={`${inputClass} w-auto cursor-pointer`}>
                {FILE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k === "document" ? "Document (devis, photo…)" : FILE_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <SubmitButton pendingLabel="Envoi…">Ajouter</SubmitButton>
            </form>
          </Card>

          <Card
            title={`L’étude réalisée${studyFiles.length ? ` (${studyFiles.length})` : ""}`}
            icon="sun"
            actions={
              studyFiles.length > 0 && (
                <ShareButton mode="study" requestId={r.id} className={`${buttonClass} h-8 px-3 text-[13px]`}>
                  <Icon name="mail" className="size-4" /> Envoyer à la mosquée
                </ShareButton>
              )
            }
          >
            {studyFiles.length === 0 ? (
              <div className="mb-5 grid justify-items-start gap-3 rounded-lg bg-bg-soft px-4 py-4 text-[14px] text-muted">
                <p>
                  En attente de l’étude. Partagez la demande au bureau d’études : l’e-mail contient un bouton pour déposer
                  l’étude, qui arrivera directement ici.
                </p>
                <ShareButton requestId={r.id} className={`${ghostButtonClass} h-9 px-3 text-[13.5px]`}>
                  <Icon name="share" className="size-4" /> Partager la demande
                </ShareButton>
              </div>
            ) : (
              <RequestFiles requestId={r.id} files={studyFiles} mode="study" />
            )}

            {studyDeposits.length > 0 && (
              <ul className="mb-5 grid gap-3">
                {studyDeposits.map((e) => (
                  <li key={e.id} className="rounded-lg border border-line px-4 py-3 text-[13.5px]">
                    <p className="text-muted">
                      Déposée par <span className="font-semibold text-heading">{String(e.data.by ?? "")}</span>
                      {e.data.company ? ` (${e.data.company})` : ""} · {formatDateTime(e.created_at)}
                    </p>
                    {e.data.note && <p className="mt-1.5 whitespace-pre-line leading-relaxed text-fg">{String(e.data.note)}</p>}
                  </li>
                ))}
              </ul>
            )}

            <details className="group rounded-lg border border-dashed border-line">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[14px] font-semibold text-brand-text">
                <Icon name="upload" className="size-4" /> Ajouter l’étude vous-même
              </summary>
              <div className="border-t border-line p-4">
                <StudyUploadForm token={createStudyToken(r.id)} staff />
              </div>
            </details>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
              <span>Lien de dépôt pour le bureau d’études, valable 90 jours :</span>
              <CopyLinkButton value={studyUploadUrl(r.id)} />
            </div>
          </Card>
          </div>

          <Card title={`Commentaires internes (${comments.length})`} icon="message">
            {comments.length === 0 ? (
              <p className="mb-4 text-[14px] text-muted">
                Aucun commentaire. Notez ici les échanges avec la mosquée, les constats techniques, les prochaines étapes…
              </p>
            ) : (
              <ul className="mb-5 grid gap-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand/10 text-[12.5px] font-bold text-brand-text">
                      {personName(c.author).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg bg-bg-soft px-4 py-3">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[13.5px] font-semibold text-heading">{personName(c.author)}</span>
                        <span className="flex items-center gap-2 text-[12px] text-muted">
                          {formatDateTime(c.created_at)}
                          {(c.author_id === user.id || user.role === "admin") && (
                            <form action={deleteComment}>
                              <input type="hidden" name="id" value={c.id} />
                              <ConfirmButton
                                message="Supprimer ce commentaire ?"
                                className="cursor-pointer font-medium text-muted hover:text-red-600"
                              >
                                Supprimer
                              </ConfirmButton>
                            </form>
                          )}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-fg">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form action={addComment} className="grid gap-3">
              <input type="hidden" name="id" value={r.id} />
              <textarea
                name="body"
                required
                rows={3}
                maxLength={5000}
                placeholder="Ajouter un commentaire pour l’équipe…"
                aria-label="Nouveau commentaire"
                className={`${inputClass} h-auto py-2.5`}
              />
              <div className="flex justify-end">
                <SubmitButton pendingLabel="Publication…">Publier le commentaire</SubmitButton>
              </div>
            </form>
          </Card>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card title="Suivi" icon="clock">
            <div className="grid gap-5">
              <form action={updateRequestStatus} className="grid gap-1.5">
                <input type="hidden" name="id" value={r.id} />
                <span className="text-[13px] font-semibold text-fg">Statut</span>
                <AutoSubmitSelect name="status" defaultValue={r.status} label="Statut de la demande">
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </AutoSubmitSelect>
                <span className="text-[12.5px] text-muted">{STATUS_META[r.status].hint}</span>
              </form>

              <form action={assignRequest} className="grid gap-1.5">
                <input type="hidden" name="id" value={r.id} />
                <span className="text-[13px] font-semibold text-fg">Assignée à</span>
                <AutoSubmitSelect name="assignee" defaultValue={r.assigned_to ?? ""} label="Personne assignée">
                  <option value="">Personne</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.email} · {ROLE_LABEL[s.role]}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </form>

              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={ghostButtonClass}>
                  <Icon name="phone" className="size-4" /> Appeler
                </a>
                <a
                  href={`mailto:${r.email}?subject=${encodeURIComponent(`Votre demande d’étude n°${r.number}`)}`}
                  className={ghostButtonClass}
                >
                  <Icon name="mail" className="size-4" /> E-mail
                </a>
              </div>
            </div>
          </Card>

          <Card title="Historique" icon="clock">
            <ol className="relative grid gap-4 border-l border-line pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-card bg-brand-text" />
                  <p className="text-[13.5px] leading-snug text-fg">{eventLabel(e.type, e.data)}</p>
                  <p className="text-[12px] text-muted">
                    {formatDateTime(e.created_at)} · {personName(e.actor)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
