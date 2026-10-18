import Link from "next/link";
import { CardFace } from "@/components/cards/card-face";
import { buttonClass, EmptyState, Icon, PageHeader } from "@/components/dashboard/ui";
import { BRAND_META, cardPath, isCardBrand } from "@/lib/cards";
import { listCards } from "@/lib/cards-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const tabs = [
  { value: "", label: "Toutes" },
  { value: "masjid", label: "Masjid Energie" },
  { value: "mosquee", label: "Mosquées" },
];

export default async function CardsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).modele;
  const brand = isCardBrand(raw) ? raw : undefined;
  const cards = await listCards(brand);

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Cartes de visite numériques"
        description="Une carte par personne : un QR code à scanner enregistre le contact dans le téléphone (iPhone et Android), et la carte peut s’installer sur l’écran d’accueil."
        actions={
          <Link href={`/admin/cartes/nouvelle${brand ? `?modele=${brand}` : ""}`} className={buttonClass}>
            + Nouvelle carte
          </Link>
        }
      />

      <nav aria-label="Filtrer par modèle" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const on = (brand ?? "") === t.value;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `/admin/cartes?modele=${t.value}` : "/admin/cartes"}
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

      {cards.length === 0 ? (
        <EmptyState icon="card" title="Aucune carte pour l’instant">
          Créez la carte de chaque membre de l’équipe, en version Masjid Energie.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((c) => (
            <li key={c.id} className="grid gap-3">
              <Link href={`/admin/cartes/${c.id}`} className="block transition-transform hover:-translate-y-0.5">
                <CardFace card={c} compact />
              </Link>
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[13px]">
                <span className="flex items-center gap-2 text-muted">
                  <span className={`size-2 rounded-full ${c.published ? "bg-brand-text" : "bg-gold"}`} />
                  {c.published ? "En ligne" : <strong className="font-bold text-gold-dark">Hors ligne</strong>} · {BRAND_META[c.brand].label} · {c.scans} contact
                  {c.scans > 1 ? "s" : ""} enregistré{c.scans > 1 ? "s" : ""}
                </span>
                <span className="flex gap-3 font-semibold">
                  <a href={cardPath(c.slug)} target="_blank" rel="noreferrer" className="text-brand-text hover:underline">
                    Voir
                  </a>
                  <Link href={`/admin/cartes/${c.id}`} className="inline-flex items-center gap-1 text-brand-text hover:underline">
                    Modifier <Icon name="back" className="size-3.5 rotate-180" />
                  </Link>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
