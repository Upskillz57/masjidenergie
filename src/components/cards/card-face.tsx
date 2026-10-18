import { BRAND_META, initials, type CardFields } from "@/lib/cards";

/** Recto de la carte (logo de la marque, initiales, nom, fonction). Sans état : sert à la page publique et à l'aperçu. */
export function CardFace({ card, compact = false }: { card: CardFields; compact?: boolean }) {
  const meta = BRAND_META[card.brand];
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] text-white shadow-[0_24px_60px_#0a3d2e40] ${meta.theme} ${
        compact ? "px-6 pb-6 pt-5" : "px-7 pb-8 pt-6"
      }`}
    >
      {/* Motif solaire discret en filigrane */}
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-14 -top-14 size-[220px] opacity-[0.09]">
        <circle cx="100" cy="100" r="38" fill={meta.accent} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="97" y="18" width="6" height="34" rx="3" fill={meta.accent} transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </svg>

      <div className="relative flex items-center justify-between gap-3">
        <BrandMark card={card} />
        <span className="text-[10.5px] font-semibold tracking-[0.22em]" style={{ color: meta.accent }}>
          CARTE DE VISITE
        </span>
      </div>

      <div className={`relative flex items-center gap-4 ${compact ? "mt-6" : "mt-9"}`}>
        <span
          className="flex size-[68px] flex-none items-center justify-center rounded-full text-[24px] font-extrabold"
          style={{ background: meta.accent, color: meta.themeColor }}
        >
          {card.brand === "mosquee" ? <MosqueGlyph color={meta.themeColor} /> : initials(card.full_name) || "?"}
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate text-[23px] font-extrabold leading-tight tracking-[-0.01em]">
            {card.full_name || "Votre nom"}
          </span>
          {card.job_title && <span className="truncate text-[14.5px] text-white/80">{card.job_title}</span>}
          <span className="truncate text-[14px] font-semibold" style={{ color: meta.accent }}>
            {card.organization || meta.label}
          </span>
        </span>
      </div>
    </div>
  );
}

function BrandMark({ card }: { card: CardFields }) {
  const meta = BRAND_META[card.brand];
  if (card.brand === "ygb") {
    return (
      <span className="flex items-center gap-2.5">
        <span
          className="flex h-9 items-center rounded-md border px-2 font-display text-[15px] font-bold tracking-[0.12em]"
          style={{ borderColor: meta.accent, color: meta.accent }}
        >
          YGB
        </span>
        <span className="font-display text-[13px] font-semibold tracking-[0.18em] text-white/90">DÉVELOPPEMENT</span>
      </span>
    );
  }
  if (card.brand === "mosquee") {
    return (
      <span className="flex items-center gap-2 text-[12.5px] font-semibold text-white/85">
        <span className="size-1.5 rounded-full" style={{ background: meta.accent }} />
        Mosquée partenaire Masjid Energie
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG statique, aussi rendu dans l'aperçu client */}
      <img src="/images/logo-gold.svg" alt="" width={44} height={30} />
      <span className="font-display text-[17px] leading-none">
        <span className="font-bold">Masjid</span> Energie
      </span>
    </span>
  );
}

function MosqueGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill={color} aria-hidden>
      <path d="M12 2.5a1.2 1.2 0 1 0 1.3 1.6 1 1 0 0 1-1.3-1.6M12 5c-.4 1.6-2 2.6-4 3.8C6 10 5 11.2 5 13v1h14v-1c0-1.8-1-3-3-4.2-2-1.2-3.6-2.2-4-3.8M4 15h16v2H4zM5 18h3v3H5zm5.5 0h3v3h-3zM16 18h3v3h-3z" />
    </svg>
  );
}
