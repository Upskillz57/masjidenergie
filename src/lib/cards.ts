// Cartes de visite numériques : modèle, thèmes et format vCard (partagé serveur / navigateur).

export const CARD_BRANDS = ["masjid", "ygb", "mosquee"] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export type BusinessCard = {
  id: string;
  slug: string;
  brand: CardBrand;
  full_name: string;
  job_title: string | null;
  organization: string;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  note: string | null;
  published: boolean;
  scans: number;
  updated_at: string;
};

export type CardFields = Pick<
  BusinessCard,
  "brand" | "full_name" | "job_title" | "organization" | "phone" | "mobile" | "email" | "website" | "address" | "note"
>;

export const BRAND_META: Record<
  CardBrand,
  { label: string; organization: string; website: string; theme: string; accent: string; themeColor: string }
> = {
  masjid: {
    label: "Masjid Energie",
    organization: "Masjid Energie",
    website: "https://masjidenergie.fr",
    theme: "bg-[linear-gradient(160deg,#0e5c47_0%,#0a3d2e_70%)]",
    accent: "#c8a24c",
    themeColor: "#0a3d2e",
  },
  ygb: {
    label: "YGB Développement",
    organization: "YGB Développement",
    website: "",
    theme: "bg-[linear-gradient(160deg,#2b3445_0%,#151a24_75%)]",
    accent: "#c8a24c",
    themeColor: "#151a24",
  },
  mosquee: {
    label: "Mosquée",
    organization: "",
    website: "",
    theme: "bg-[linear-gradient(160deg,#126a52_0%,#0e5c47_45%,#0a3d2e_100%)]",
    accent: "#e3c97a",
    themeColor: "#0e5c47",
  },
};

export const isCardBrand = (v: unknown): v is CardBrand =>
  typeof v === "string" && (CARD_BRANDS as readonly string[]).includes(v);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** Échappement vCard 3.0 (RFC 2426) : antislash, virgule, point-virgule, retours à la ligne. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

/**
 * Fiche contact au format vCard 3.0, reconnue par iPhone (Contacts) et Android (Contacts Google).
 * `compact` retire la note pour garder un QR code lisible.
 */
export function toVCard(card: CardFields, opts: { cardUrl?: string; compact?: boolean } = {}) {
  const isCompany = card.brand === "mosquee";
  const [first, ...rest] = card.full_name.trim().split(/\s+/);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    isCompany ? "N:;;;;" : `N:${esc(rest.join(" "))};${esc(first ?? "")};;;`,
    `FN:${esc(card.full_name)}`,
    `ORG:${esc(card.organization)}`,
  ];
  if (isCompany) lines.push("X-ABShowAs:COMPANY");
  if (card.job_title) lines.push(`TITLE:${esc(card.job_title)}`);
  if (card.mobile) lines.push(`TEL;TYPE=CELL:${esc(card.mobile)}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${esc(card.email)}`);
  if (card.website) lines.push(`URL:${esc(withProtocol(card.website))}`);
  else if (opts.cardUrl) lines.push(`URL:${esc(opts.cardUrl)}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${esc(card.address)};;;;`);
  if (card.note && !opts.compact) lines.push(`NOTE:${esc(card.note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

export const cardPath = (slug: string) => `/carte/${slug}`;
