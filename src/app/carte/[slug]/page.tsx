import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { InstallButton, ShareButton } from "@/components/cards/card-actions";
import { CardFace } from "@/components/cards/card-face";
import { BRAND_META, cardIcon, cardPath, telHref, withProtocol } from "@/lib/cards";
import { cardQrSvgs, getPublicCard } from "@/lib/cards-data";

type Params = Promise<{ slug: string }>;

export const viewport: Viewport = { themeColor: "#0a3d2e" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) return { title: "Carte introuvable", robots: { index: false } };
  const title = `${card.full_name} · ${card.organization}`;
  return {
    title: { absolute: title },
    description: card.job_title ? `${card.job_title} · ${card.organization}` : card.organization,
    robots: { index: false, follow: false },
    manifest: `${cardPath(slug)}/manifest.webmanifest`,
    // Icône posée sur l'écran d'accueil de l'iPhone (Android la lit dans le manifeste).
    icons: { apple: [{ url: cardIcon(card.brand, 180), sizes: "180x180", type: "image/png" }] },
    appleWebApp: { capable: true, title: card.full_name, statusBarStyle: "black-translucent" },
    openGraph: { title, description: "Carte de visite numérique", type: "profile" },
  };
}

const icons: Record<string, ReactNode> = {
  mobile: <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2" />,
  mail: <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M3 7l9 6 9-6" />,
  web: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />,
  pin: <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />,
};

function Row({ icon, label, value, href, external }: { icon: string; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-bg-soft"
    >
      <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand/10 text-brand-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-[19px]" aria-hidden>
          {icons[icon]}
        </svg>
      </span>
      <span className="grid min-w-0 leading-tight">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="truncate text-[15px] font-medium text-fg">{value}</span>
      </span>
    </a>
  );
}

async function Card({ params }: { params: Params }) {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) notFound();
  const { contact, url } = await cardQrSvgs(card);
  const meta = BRAND_META[card.brand];

  return (
    <>
      <CardFace card={card} />

      <a
        href={`${cardPath(slug)}/vcf`}
        className="mt-5 flex h-14 items-center justify-center gap-2.5 rounded-xl text-[16px] font-bold shadow-[0_10px_24px_#0a3d2e33] hover:brightness-105"
        style={{ background: meta.accent, color: meta.themeColor }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" />
        </svg>
        Enregistrer le contact
      </a>

      <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {card.mobile && <Row icon="mobile" label="Mobile" value={card.mobile} href={telHref(card.mobile)} />}
        {card.phone && <Row icon="phone" label="Téléphone" value={card.phone} href={telHref(card.phone)} />}
        {card.email && <Row icon="mail" label="E-mail" value={card.email} href={`mailto:${card.email}`} />}
        {card.website && (
          <Row icon="web" label="Site internet" value={card.website.replace(/^https?:\/\//, "")} href={withProtocol(card.website)} external />
        )}
        {card.address && (
          <Row
            icon="pin"
            label="Adresse"
            value={card.address}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`}
            external
          />
        )}
      </div>

      {card.note && <p className="mt-5 px-1 text-center text-[14.5px] leading-relaxed text-muted">{card.note}</p>}

      <section className="mt-6 grid justify-items-center gap-3 rounded-2xl border border-line bg-card px-5 py-6 text-center">
        <h2 className="text-[16px] font-bold text-heading">Scannez pour enregistrer le contact</h2>
        <p className="max-w-[300px] text-[13.5px] text-muted">
          Avec l’appareil photo d’un iPhone ou d’un Android, le contact s’enregistre directement.
        </p>
        <div className="w-[min(260px,100%)] rounded-xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: contact }} />
      </section>

      <div className="mt-5 grid gap-3">
        <ShareButton url={url} title={`${card.full_name} · ${card.organization}`} />
        <InstallButton />
      </div>
    </>
  );
}

export default function CardPage({ params }: { params: Params }) {
  return (
    <main className="min-h-dvh bg-bg-soft px-4 pb-10 pt-[max(24px,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[440px]">
        <Suspense fallback={<div className="h-[230px] animate-pulse rounded-[22px] bg-placeholder" />}>
          <Card params={params} />
        </Suspense>
        <p className="mt-8 text-center text-[12.5px] text-muted">
          Carte de visite numérique ·{" "}
          <Link href="/" className="font-semibold text-brand-text hover:underline">
            Masjid Energie
          </Link>
        </p>
      </div>
    </main>
  );
}
