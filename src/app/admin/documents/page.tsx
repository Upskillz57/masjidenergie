import { deleteDocument } from "@/app/actions/documents";
import { ConfirmButton } from "@/components/admin/forms";
import { Card, EmptyState, Icon, PageHeader } from "@/components/dashboard/ui";
import { EditDocument, ShareDocument, UploadDocumentForm } from "@/components/documents/library-forms";
import { DOC_CATEGORIES, FORM_KINDS, type DocCategory } from "@/lib/documents";
import { getAdminDocuments } from "@/lib/documents-data";
import { formatDate, formatDateTime, formatSize } from "@/lib/workflow";

const linkCls =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft";

const typeLabel = (mime: string | null, name: string) =>
  mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")
    ? "PDF"
    : /word|\.docx?$/i.test(`${mime} ${name}`)
      ? "DOC"
      : mime?.startsWith("image/")
        ? "IMG"
        : "FICHIER";

export default async function AdminDocumentsPage() {
  const { documents, submissions } = await getAdminDocuments();
  const groups = Object.keys(DOC_CATEGORIES)
    .map((c) => ({ category: c as DocCategory, docs: documents.filter((d) => d.category === c) }))
    .filter((g) => g.docs.length);
  const hasLinky = documents.some((d) => d.form_kind === "linky");

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Documents utiles"
        description="Bibliothèque partagée : ajoutez, modifiez et transmettez vos documents. Ceux marqués « visibles » apparaissent dans l’espace des mosquées, les formulaires en ligne s’y remplissent et se signent."
      />

      <div className="grid gap-6">
        <Card title="Ajouter un document" icon="upload">
          <UploadDocumentForm />
          {!hasLinky && (
            <p className="mt-4 rounded-lg bg-gold/10 px-4 py-2.5 text-[13.5px] text-fg">
              Pour activer le remplissage en ligne de l’autorisation Linky, ajoutez le PDF SunLib en choisissant « Formulaire à
              remplir en ligne : Oui ».
            </p>
          )}
        </Card>

        {groups.length === 0 ? (
          <EmptyState icon="file" title="Aucun document pour l’instant">
            Ajoutez vos formulaires, contrats et fiches techniques : ils seront prêts à être partagés.
          </EmptyState>
        ) : (
          groups.map((g) => (
            <Card key={g.category} title={DOC_CATEGORIES[g.category]} icon="folder" className="[&>div]:p-0">
              <ul className="divide-y divide-line">
                {g.docs.map((d) => (
                  <li key={d.id} className="grid gap-3 px-5 py-4">
                    <div className="flex flex-wrap items-start gap-4">
                      <span className="flex size-11 flex-none items-center justify-center rounded-lg bg-red-50 text-[11px] font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                        {typeLabel(d.mime, d.file_name)}
                      </span>
                      <div className="grid min-w-[220px] flex-1 gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-heading">{d.title}</span>
                          {d.form_kind && (
                            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11.5px] font-semibold text-gold-dark">
                              Formulaire en ligne
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                              d.visible_to_mosques ? "bg-brand/10 text-brand-text" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300"
                            }`}
                          >
                            {d.visible_to_mosques ? "Visible par les mosquées" : "Interne"}
                          </span>
                        </span>
                        {d.description && <span className="text-[13.5px] text-muted">{d.description}</span>}
                        <span className="text-[12.5px] text-muted">
                          {d.file_name} · {formatSize(d.size)} · mis à jour le {formatDate(d.updated_at)}
                          {d.form_kind && ` · ${FORM_KINDS[d.form_kind]}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 pl-[60px]">
                      <a href={`/documents/${d.id}?voir=1`} target="_blank" rel="noreferrer" className={linkCls}>
                        <Icon name="external" className="size-4" /> Voir
                      </a>
                      <a href={`/documents/${d.id}`} className={linkCls}>
                        <Icon name="download" className="size-4" /> Télécharger
                      </a>
                      <ShareDocument id={d.id} title={d.title} />
                      <EditDocument doc={d} />
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={d.id} />
                        <ConfirmButton message={`Supprimer « ${d.title} » ?`} className={`${linkCls} cursor-pointer hover:text-red-600`}>
                          <Icon name="trash" className="size-4" /> Supprimer
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}

        <Card title={`Formulaires remplis en ligne (${submissions.length})`} icon="check" className="[&>div]:p-0">
          {submissions.length === 0 ? (
            <p className="px-5 py-4 text-[14px] text-muted">Les autorisations signées par les mosquées apparaîtront ici.</p>
          ) : (
            <ul className="divide-y divide-line">
              {submissions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="grid min-w-[220px] flex-1 leading-tight">
                    <span className="text-[14.5px] font-semibold text-heading">{s.data.tradeName ?? s.mosque?.name ?? "Mosquée"}</span>
                    <span className="text-[13px] text-muted">
                      {FORM_KINDS[s.form_kind]} · signé par {s.data.signerFirstName} {s.data.signerLastName}
                      {s.data.prm ? ` · PRM ${s.data.prm}` : ""} · {formatDateTime(s.created_at)}
                    </span>
                  </span>
                  <a href={`/documents/formulaires/${s.id}?voir=1`} target="_blank" rel="noreferrer" className={linkCls}>
                    <Icon name="external" className="size-4" /> Voir
                  </a>
                  <a href={`/documents/formulaires/${s.id}`} className={linkCls}>
                    <Icon name="download" className="size-4" /> PDF signé
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
