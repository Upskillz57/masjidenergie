import { CardForm } from "@/components/cards/card-form";
import { QrPanel } from "@/components/cards/qr-panel";
import { Card, EmptyState, PageHeader } from "@/components/dashboard/ui";
import { getMyMosqueCard } from "@/lib/cards-data";

export default async function MosqueCardPage() {
  const { user, card, mosque, preview } = await getMyMosqueCard();

  return (
    <>
      <PageHeader
        eyebrow="CARTE DE VISITE"
        title="La carte de visite de votre mosquée"
        description="Affichez le QR code à l’entrée, sur vos tracts ou vos réseaux : un scan suffit pour enregistrer les coordonnées de la mosquée dans le téléphone."
      />
      {!mosque ? (
        <EmptyState icon="card" title="Votre compte n’est pas encore rattaché à une mosquée">
          Contactez l’équipe Masjid Energie pour finaliser l’ouverture de votre espace.
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          {preview && (
            <p className="rounded-lg bg-gold/10 px-4 py-2.5 text-[13.5px] text-fg">
              Aperçu avec une mosquée d’exemple : chaque mosquée connectée gère ici sa propre carte.
            </p>
          )}
          {card && (
            <Card title="QR codes et lien" icon="card">
              <QrPanel card={card} />
            </Card>
          )}
          <Card title={card ? "Contenu de la carte" : "Créer la carte"} icon="file">
            <CardForm
              mode="mosque"
              initial={
                card ?? {
                  brand: "mosquee",
                  full_name: mosque.name,
                  job_title: null,
                  organization: mosque.name,
                  phone: null,
                  mobile: null,
                  email: user.email,
                  website: null,
                  address: mosque.address,
                  note: null,
                }
              }
            />
          </Card>
        </div>
      )}
    </>
  );
}
