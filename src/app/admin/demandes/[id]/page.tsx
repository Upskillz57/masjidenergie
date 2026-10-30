import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addComment,
  assignRequest,
  deleteComment,
  deleteRequestFile,
  updateRequestStatus,
  uploadRequestFiles,
} from "@/app/actions/admin";
import { AutoSubmitSelect, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { DossierChecklist, ProjectContextForm } from "@/components/dossier/dossier";
import { Card, ghostButtonClass, Icon, inputClass, StatusBadge } from "@/components/dashboard/ui";
import { getRequest } from "@/lib/admin/data";
import { dossierPieces, FILE_KIND_LABEL, FILE_KINDS, missingPieces } from "@/lib/dossier";
import {
  formatDate,
  formatDateTime,
  formatSize,
  isRequestStatus,
  REQUEST_STATUSES,
  ROLE_LABEL,
  STATUS_META,
} from "@/lib/workflow";

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
    default:
      return type;
  }
}

const deleteIconClass =
  "flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRequest(id);
  if (!detail) notFound();
  const { request: r, files, comments, events, staff, user, linky } = detail;
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
  const images = files.filter((f) => f.mime?.startsWith("image/") && f.url);
  const others = files.filter((f) => !images.includes(f));

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
          <StatusBadge status={r.status} />
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

          <Card title={`Factures et documents (${files.length})`} icon="clip">
            {files.length === 0 && <p className="mb-4 text-[14px] text-muted">Aucun fichier envoyé avec la demande.</p>}

            {images.length > 0 && (
              <ul className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {images.map((f) => (
                  <li key={f.id} className="group overflow-hidden rounded-lg border border-line bg-bg-soft">
                    <a href={f.url!} target="_blank" rel="noreferrer" className="block overflow-hidden" title="Ouvrir en grand">
                      {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire du stockage privé */}
                      <img
                        src={f.url!}
                        alt={f.name}
                        className="aspect-[3/4] w-full object-cover object-top transition-transform group-hover:scale-[1.03]"
                      />
                    </a>
                    <div className="flex items-center justify-between gap-2 border-t border-line bg-card px-2.5 py-2">
                      <span className="grid min-w-0 text-[12px] leading-tight">
                        <span className="truncate font-medium text-fg">{f.name}</span>
                        <span className="text-muted">{FILE_KIND_LABEL[f.kind]} · {formatSize(f.size)}</span>
                      </span>
                      <form action={deleteRequestFile}>
                        <input type="hidden" name="id" value={f.id} />
                        <ConfirmButton message={`Supprimer « ${f.name} » ?`} className={deleteIconClass}>
                          <Icon name="trash" className="size-4" />
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {others.length > 0 && (
              <ul className="mb-4 grid gap-2">
                {others.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                    <span className="flex size-9 flex-none items-center justify-center rounded-md bg-red-50 text-[11px] font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                      {f.mime === "application/pdf" ? "PDF" : "DOC"}
                    </span>
                    <span className="grid min-w-0 flex-1 text-[13.5px] leading-tight">
                      <span className="truncate font-medium text-fg">{f.name}</span>
                      <span className="text-muted">
                        {FILE_KIND_LABEL[f.kind]} · {formatSize(f.size)}
                      </span>
                    </span>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer" className={`${ghostButtonClass} h-8 px-3 text-[13px]`}>
                        Ouvrir
                      </a>
                    )}
                    <form action={deleteRequestFile}>
                      <input type="hidden" name="id" value={f.id} />
                      <ConfirmButton message={`Supprimer « ${f.name} » ?`} className={deleteIconClass}>
                        <Icon name="trash" className="size-4" />
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

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
                    {k === "document" ? "Document (étude, devis, photo…)" : FILE_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <SubmitButton pendingLabel="Envoi…">Ajouter</SubmitButton>
            </form>
          </Card>

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
