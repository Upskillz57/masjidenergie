import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import QRCode from "qrcode";
import { isDemoMode } from "@/lib/admin/demo";
import { requireStaff, requireUser } from "@/lib/auth";
import { cardPath, toVCard, type BusinessCard, type CardBrand } from "@/lib/cards";
import { site } from "@/lib/site";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

const COLUMNS =
  "id, slug, brand, full_name, job_title, organization, phone, mobile, email, website, address, note, published, scans, updated_at";

export const cardTag = (slug: string) => `carte:${slug}`;

// Cartes fictives pour le mode démo local (Supabase non configuré).
const DEMO_CARDS: BusinessCard[] = [
  {
    id: "00000000-0000-4000-b000-000000000001",
    slug: "aboubacar-barry",
    brand: "masjid",
    full_name: site.contact.person,
    job_title: "Responsable des projets solaires",
    organization: "Masjid Energie",
    phone: null,
    mobile: site.contact.phone,
    email: site.contact.email,
    website: "masjidenergie.fr",
    address: null,
    note: "L’énergie solaire au service des mosquées de France. Sans crédit, sans emprunt, sans endettement.",
    published: true,
    scans: 42,
    updated_at: "2026-10-17T10:00:00Z",
  },
  {
    id: "00000000-0000-4000-b000-000000000003",
    slug: "mosquee-errahma-strasbourg",
    brand: "mosquee",
    full_name: "Mosquée Errahma",
    job_title: "Association cultuelle",
    organization: "Mosquée Errahma",
    phone: "03 88 00 00 00",
    mobile: null,
    email: "contact@mosquee-errahma.fr",
    website: null,
    address: "1 place du Marché, 67000 Strasbourg",
    note: "Mosquée équipée de panneaux solaires avec Masjid Energie.",
    published: true,
    scans: 15,
    updated_at: "2026-10-15T10:00:00Z",
  },
];

/** Carte publiée, mise en cache et invalidée à chaque enregistrement (tag `carte:<slug>`). */
export async function getPublicCard(slug: string): Promise<BusinessCard | null> {
  "use cache";
  cacheTag(cardTag(slug));
  cacheLife("hours");
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  if (!isSupabaseConfigured) return isDemoMode ? (DEMO_CARDS.find((c) => c.slug === slug) ?? null) : null;
  const { data } = await createAdminClient()
    .from("business_cards")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as BusinessCard | null) ?? null;
}

export async function listCards(brand?: CardBrand) {
  await requireStaff("/admin/cartes");
  if (!isSupabaseConfigured) return DEMO_CARDS.filter((c) => !brand || c.brand === brand);
  let query = createAdminClient().from("business_cards").select(COLUMNS).order("updated_at", { ascending: false });
  if (brand) query = query.eq("brand", brand);
  const { data, error } = await query.returns<BusinessCard[]>();
  if (error) throw error;
  return data ?? [];
}

export async function getCardById(id: string) {
  await requireStaff(`/admin/cartes/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!isSupabaseConfigured) return DEMO_CARDS.find((c) => c.id === id) ?? null;
  const { data } = await createAdminClient().from("business_cards").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as BusinessCard | null) ?? null;
}

/** Carte de la mosquée connectée (l'équipe voit un exemple en aperçu). */
export async function getMyMosqueCard() {
  const user = await requireUser("/espace/carte");
  if (!isSupabaseConfigured || (isStaffRole(user.role) && !user.mosqueId)) {
    return { user, card: DEMO_CARDS[1], mosque: { name: "Mosquée Errahma", address: DEMO_CARDS[1].address }, preview: true };
  }
  if (!user.mosqueId) return { user, card: null, mosque: null, preview: false };
  const db = createAdminClient();
  const [{ data: card }, { data: mosque }] = await Promise.all([
    db.from("business_cards").select(COLUMNS).eq("mosque_id", user.mosqueId).maybeSingle(),
    db.from("mosques").select("name, address").eq("id", user.mosqueId).maybeSingle(),
  ]);
  return { user, card: (card as BusinessCard | null) ?? null, mosque, preview: false };
}

export const cardUrl = (slug: string) => `${site.url}${cardPath(slug)}`;

/** QR codes de la carte : « contact » enregistre directement la fiche, « lien » ouvre la carte en ligne. */
export async function cardQrSvgs(card: BusinessCard) {
  const url = cardUrl(card.slug);
  // Marge blanche de 2 modules (le cadre blanc autour complète la zone de silence) ;
  // correction « L » pour le contact : code moins dense, plus facile à lire sur un écran.
  const opts = { type: "svg" as const, margin: 2, color: { dark: "#0a2e23", light: "#ffffff" } };
  const [contact, link] = await Promise.all([
    QRCode.toString(toVCard(card, { compact: true }), { ...opts, errorCorrectionLevel: "L" }),
    QRCode.toString(url, { ...opts, errorCorrectionLevel: "M" }),
  ]);
  return { contact, link, url };
}
