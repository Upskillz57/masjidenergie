import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCard } from "@/app/actions/cards";
import { ConfirmButton } from "@/components/admin/forms";
import { CardForm } from "@/components/cards/card-form";
import { QrPanel } from "@/components/cards/qr-panel";
import { Card, ghostButtonClass, Icon, PageHeader } from "@/components/dashboard/ui";
import { getCardById } from "@/lib/cards-data";
import { formatDateTime } from "@/lib/workflow";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) notFound();

  return (
    <>
      <Link href="/admin/cartes" className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-text hover:underline">
        <Icon name="back" className="size-4" /> Toutes les cartes
      </Link>
      <PageHeader
        eyebrow="CARTE DE VISITE"
        title={card.full_name}
        description={`${card.scans} contact${card.scans > 1 ? "s" : ""} enregistré${card.scans > 1 ? "s" : ""} depuis la carte · modifiée le ${formatDateTime(card.updated_at)}`}
        actions={
          <form action={deleteCard}>
            <input type="hidden" name="id" value={card.id} />
            <ConfirmButton message={`Supprimer la carte de ${card.full_name} ? Les QR codes imprimés ne fonctionneront plus.`} className={ghostButtonClass}>
              <Icon name="trash" className="size-4" /> Supprimer
            </ConfirmButton>
          </form>
        }
      />
      <div className="grid gap-6">
        <Card title="QR codes et lien" icon="card">
          <QrPanel card={card} canPublish />
        </Card>
        <Card title="Contenu de la carte" icon="file">
          <CardForm mode="staff" initial={card} />
        </Card>
      </div>
    </>
  );
}
