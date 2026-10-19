import Link from "next/link";
import { Card, EmptyState, Icon, PageHeader } from "@/components/dashboard/ui";
import { DOC_CATEGORIES } from "@/lib/documents";
import { getMosqueDocuments } from "@/lib/documents-data";
import { formatDateTime, formatSize } from "@/lib/workflow";

const linkCls =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft";

export default async function MosqueDocumentsPage() {
  const { documents, submissions } = await getMosqueDocuments();
  const linky = documents.find((d) => d.form_kind === "linky");
  const others = documents.filter((d) => d !== linky);
  const signed = submissions.filter((s) => s.form_kind === "linky");

  return (
    <>
      <PageHeader
        eyebrow="DOCUMENTS"
        title="Vos documents"
        description="Les documents utiles à votre projet, et les formulaires à remplir et signer directement en ligne."
      />

      <div className="grid gap-6">
        {linky && (
          <section className="grid gap-5 rounded-2xl bg-brand px-6 py-6 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="grid gap-2">
              <span className="text-[11.5px] font-semibold tracking-[0.2em] text-gold">
                {signed.length ? "AUTORISATION SIGNÉE" : "À REMPLIR EN PRIORITÉ"}
              </span>
              <h2 className="text-[20px] font-extrabold leading-tight">Autorisation d’accès aux données de votre compteur Linky</h2>
              <p className="max-w-[640px] text-[14.5px] leading-relaxed text-on-brand">
                Elle permet à SunLib et Masjid Energie de récupérer auprès d’Enedis la consommation réelle de la mosquée, pour
                dimensionner l’installation au plus juste. Comptez 3 minutes : munissez-vous du SIRET de l’association et d’une
                facture d’électricité (numéro PRM).
              </p>
            </div>
            <div className="grid gap-2">
              <Link
                href="/espace/documents/linky"
                className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#d6a94e,#b08431)] px-6 text-[15px] font-bold text-brand-deep hover:brightness-105"
              >
                {signed.length ? "Signer une nouvelle autorisation" : "Remplir et signer en ligne"}
              </Link>
              <a href={`/documents/${linky.id}`} className="text-center text-[13px] font-medium text-on-brand underline underline-offset-2">
                ou télécharger le formulaire vierge
              </a>
            </div>
          </section>
        )}

        {signed.length > 0 && (
          <Card title="Vos formulaires signés" icon="check" className="[&>div]:p-0">
            <ul className="divide-y divide-line">
              {signed.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="grid min-w-[200px] flex-1 leading-tight">
                    <span className="text-[14.5px] font-semibold text-heading">Autorisation Linky</span>
                    <span className="text-[13px] text-muted">
                      Signée le {formatDateTime(s.created_at)} par {s.data.signerFirstName} {s.data.signerLastName}
                    </span>
                  </span>
                  <a href={`/documents/formulaires/${s.id}?voir=1`} target="_blank" rel="noreferrer" className={linkCls}>
                    <Icon name="external" className="size-4" /> Voir
                  </a>
                  <a href={`/documents/formulaires/${s.id}`} className={linkCls}>
                    <Icon name="download" className="size-4" /> PDF
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {others.length > 0 ? (
          <Card title="Documents utiles" icon="folder" className="[&>div]:p-0">
            <ul className="divide-y divide-line">
              {others.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="grid min-w-[200px] flex-1 leading-tight">
                    <span className="text-[14.5px] font-semibold text-heading">{d.title}</span>
                    <span className="text-[13px] text-muted">
                      {DOC_CATEGORIES[d.category]} · {formatSize(d.size)}
                      {d.description ? ` · ${d.description}` : ""}
                    </span>
                  </span>
                  <a href={`/documents/${d.id}?voir=1`} target="_blank" rel="noreferrer" className={linkCls}>
                    <Icon name="external" className="size-4" /> Voir
                  </a>
                  <a href={`/documents/${d.id}`} className={linkCls}>
                    <Icon name="download" className="size-4" /> Télécharger
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          !linky && (
            <EmptyState icon="file" title="Aucun document pour l’instant">
              L’équipe Masjid Energie partagera ici les documents utiles à votre projet.
            </EmptyState>
          )
        )}
      </div>
    </>
  );
}
