"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireUser } from "@/lib/auth";
import { cardTag } from "@/lib/cards-data";
import { isCardBrand, slugify, type CardBrand } from "@/lib/cards";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type CardFormState = {
  ok?: boolean;
  message: string;
  errors?: Partial<Record<"full_name" | "organization" | "contact" | "slug" | "website" | "email", string>>;
} | null;

const text = (fd: FormData, key: string, max = 160) => {
  const v = String(fd.get(key) ?? "").trim().slice(0, max);
  return v || null;
};

function readFields(fd: FormData, brand: CardBrand) {
  const fields = {
    brand,
    full_name: text(fd, "full_name", 100) ?? "",
    job_title: text(fd, "job_title", 100),
    organization: text(fd, "organization", 100) ?? "",
    phone: text(fd, "phone", 30),
    mobile: text(fd, "mobile", 30),
    email: text(fd, "email", 120)?.toLowerCase() ?? null,
    website: text(fd, "website", 200),
    address: text(fd, "address", 200),
    note: text(fd, "note", 300),
    // Case à cocher précédée d'un champ caché « off » : « on » présent = carte en ligne.
    published: fd.has("published") ? fd.getAll("published").includes("on") : true,
  };
  const errors: NonNullable<CardFormState>["errors"] = {};
  if (!fields.full_name) errors.full_name = "Nom requis.";
  if (!fields.organization) errors.organization = "Organisation requise.";
  if (!fields.phone && !fields.mobile && !fields.email) errors.contact = "Indiquez au moins un téléphone ou un e-mail.";
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = "Adresse e-mail invalide.";
  if (fields.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(fields.website))
    errors.website = "Adresse de site invalide.";
  return { fields, errors };
}

/** Adresse publique libre : base demandée, sinon nom ; suffixe numéroté si déjà prise. */
async function freeSlug(base: string, exceptId?: string) {
  const db = createAdminClient();
  const root = slugify(base).slice(0, 52).padEnd(3, "0") || "carte";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await db.from("business_cards").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === exceptId) return slug;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

const demo: CardFormState = { message: "Mode démo : configurez Supabase pour enregistrer la carte." };

export async function saveCard(_: CardFormState, fd: FormData): Promise<CardFormState> {
  const user = await requireStaff("/admin/cartes");
  const brand = fd.get("brand");
  if (!isCardBrand(brand)) return { message: "Choisissez un modèle de carte." };
  const { fields, errors } = readFields(fd, brand);
  if (Object.keys(errors).length) return { message: "Merci de vérifier la carte.", errors };
  if (!isSupabaseConfigured) return demo;

  const db = createAdminClient();
  const id = text(fd, "id", 36);
  const wantedSlug = text(fd, "slug", 60);

  if (id) {
    const { data: before } = await db.from("business_cards").select("slug").eq("id", id).maybeSingle();
    if (!before) return { message: "Carte introuvable." };
    const slug = wantedSlug && slugify(wantedSlug) !== before.slug ? await freeSlug(wantedSlug, id) : before.slug;
    const { error } = await db.from("business_cards").update({ ...fields, slug }).eq("id", id);
    if (error) return { message: "Enregistrement impossible." };
    updateTag(cardTag(before.slug));
    if (slug !== before.slug) updateTag(cardTag(slug));
    return { ok: true, message: "Carte enregistrée." };
  }

  const slug = await freeSlug(wantedSlug || `${fields.full_name}${brand === "ygb" ? " ygb" : ""}`);
  const { data, error } = await db
    .from("business_cards")
    .insert({ ...fields, slug, owner_id: user.id })
    .select("id")
    .single();
  if (error) return { message: "Création impossible." };
  updateTag(cardTag(slug));
  redirect(`/admin/cartes/${data.id}`);
}

/** Remet en ligne (ou retire) une carte en un clic, depuis l'admin. */
export async function setCardPublished(fd: FormData) {
  await requireStaff("/admin/cartes");
  const id = text(fd, "id", 36);
  if (!id || !isSupabaseConfigured) return;
  const { data } = await createAdminClient()
    .from("business_cards")
    .update({ published: fd.get("published") === "on" })
    .eq("id", id)
    .select("slug")
    .maybeSingle();
  if (data) updateTag(cardTag(data.slug));
  refresh();
}

export async function deleteCard(fd: FormData) {
  await requireStaff("/admin/cartes");
  const id = text(fd, "id", 36);
  if (!id || !isSupabaseConfigured) return;
  const db = createAdminClient();
  const { data } = await db.from("business_cards").delete().eq("id", id).select("slug").maybeSingle();
  if (data) updateTag(cardTag(data.slug));
  redirect("/admin/cartes");
}

/** Carte de la mosquée connectée : une par mosquée, créée au premier enregistrement. */
export async function saveMosqueCard(_: CardFormState, fd: FormData): Promise<CardFormState> {
  const user = await requireUser("/espace/carte");
  const { fields, errors } = readFields(fd, "mosquee");
  if (Object.keys(errors).length) return { message: "Merci de vérifier la carte.", errors };
  if (!isSupabaseConfigured || !user.mosqueId) {
    return user.mosqueId ? demo : { message: "Aperçu : seul un compte mosquée peut enregistrer sa carte." };
  }

  const db = createAdminClient();
  const { data: existing } = await db
    .from("business_cards")
    .select("id, slug")
    .eq("mosque_id", user.mosqueId)
    .maybeSingle();
  if (existing) {
    const { error } = await db.from("business_cards").update(fields).eq("id", existing.id);
    if (error) return { message: "Enregistrement impossible." };
    updateTag(cardTag(existing.slug));
  } else {
    const slug = await freeSlug(fields.organization);
    const { error } = await db
      .from("business_cards")
      .insert({ ...fields, slug, owner_id: user.id, mosque_id: user.mosqueId });
    if (error) return { message: "Création impossible." };
    updateTag(cardTag(slug));
  }
  return { ok: true, message: "Carte enregistrée." };
}
