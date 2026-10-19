"use server";

import { refresh } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { isDocCategory, MAX_DOCUMENT_BYTES, validateLinky, type LinkyData, type LinkyErrors } from "@/lib/documents";
import { getFormTemplate } from "@/lib/documents-data";
import { emailLayout, emailTable, escapeHtml, sendEmail, teamInbox } from "@/lib/email";
import { fillLinkyPdf } from "@/lib/linky-pdf";
import { site } from "@/lib/site";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";

export type DocState = { ok?: boolean; message: string; url?: string } | null;

const SHARE_SECONDS = 7 * 24 * 3600;
const notConfigured: DocState = { message: "Configurez Supabase pour gérer les documents." };
const text = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? "").trim().slice(0, max);
const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "document";
const isId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function readMeta(fd: FormData) {
  const category = fd.get("category");
  const form = fd.get("form_kind");
  return {
    title: text(fd, "title", 160),
    description: text(fd, "description", 600) || null,
    category: isDocCategory(category) ? category : "general",
    visible_to_mosques: fd.get("visible") === "on",
    form_kind: form === "linky" ? "linky" : null,
  };
}

async function storeFile(file: File) {
  const path = `bibliotheque/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await createAdminClient()
    .storage.from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  return error ? null : path;
}

export async function uploadDocument(_: DocState, fd: FormData): Promise<DocState> {
  const user = await requireStaff("/admin/documents");
  if (!isSupabaseConfigured) return notConfigured;
  const meta = readMeta(fd);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choisissez un fichier." };
  if (file.size > MAX_DOCUMENT_BYTES) return { message: "4 Mo maximum par fichier." };
  if (!meta.title) meta.title = file.name.replace(/\.[^.]+$/, "");
  const path = await storeFile(file);
  if (!path) return { message: "L’envoi du fichier a échoué." };
  const { error } = await createAdminClient()
    .from("documents")
    .insert({ ...meta, path, file_name: file.name, mime: file.type || null, size: file.size, created_by: user.id });
  if (error) return { message: "Enregistrement impossible." };
  refresh();
  return { ok: true, message: `« ${meta.title} » ajouté à la bibliothèque.` };
}

export async function updateDocument(_: DocState, fd: FormData): Promise<DocState> {
  await requireStaff("/admin/documents");
  if (!isSupabaseConfigured) return notConfigured;
  const id = text(fd, "id", 36);
  if (!isId(id)) return { message: "Document introuvable." };
  const meta = readMeta(fd);
  if (!meta.title) return { message: "Le titre est requis." };
  const db = createAdminClient();
  const { data: before } = await db.from("documents").select("path").eq("id", id).maybeSingle();
  if (!before) return { message: "Document introuvable." };

  // Remplacement du fichier (nouvelle version), l'ancien est supprimé du stockage.
  const file = fd.get("file");
  let fileFields = {};
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_DOCUMENT_BYTES) return { message: "4 Mo maximum par fichier." };
    const path = await storeFile(file);
    if (!path) return { message: "L’envoi du nouveau fichier a échoué." };
    fileFields = { path, file_name: file.name, mime: file.type || null, size: file.size };
  }
  const { error } = await db.from("documents").update({ ...meta, ...fileFields }).eq("id", id);
  if (error) return { message: "Enregistrement impossible." };
  if ("path" in fileFields) await db.storage.from(DOCUMENTS_BUCKET).remove([before.path]);
  refresh();
  return { ok: true, message: "Document mis à jour." };
}

export async function deleteDocument(fd: FormData) {
  await requireStaff("/admin/documents");
  const id = text(fd, "id", 36);
  if (!isSupabaseConfigured || !isId(id)) return;
  const db = createAdminClient();
  const { data } = await db.from("documents").delete().eq("id", id).select("path").maybeSingle();
  if (data) await db.storage.from(DOCUMENTS_BUCKET).remove([data.path]);
  refresh();
}

async function shareLink(id: string) {
  const db = createAdminClient();
  const { data: doc } = await db.from("documents").select("path, file_name, title").eq("id", id).maybeSingle();
  if (!doc) return null;
  const { data } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.path, SHARE_SECONDS, { download: doc.file_name });
  return data ? { url: data.signedUrl, title: doc.title as string, fileName: doc.file_name as string } : null;
}

/** Lien de téléchargement valable 7 jours, à transmettre à n'importe qui (sans compte). */
export async function shareDocument(_: DocState, fd: FormData): Promise<DocState> {
  await requireStaff("/admin/documents");
  if (!isSupabaseConfigured) return notConfigured;
  const link = await shareLink(text(fd, "id", 36));
  return link ? { ok: true, message: "Lien valable 7 jours, copié.", url: link.url } : { message: "Document introuvable." };
}

export async function emailDocument(_: DocState, fd: FormData): Promise<DocState> {
  const user = await requireStaff("/admin/documents");
  if (!isSupabaseConfigured) return notConfigured;
  const to = text(fd, "to", 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { message: "Adresse e-mail invalide." };
  const link = await shareLink(text(fd, "id", 36));
  if (!link) return { message: "Document introuvable." };
  const note = text(fd, "message", 1000);
  const sent = await sendEmail({
    to: [to],
    replyTo: user.email,
    subject: `Document : ${link.title}`,
    html: emailLayout(
      link.title,
      `<p>Assalamou alaykoum,</p><p>${escapeHtml(user.fullName)} vous transmet le document « ${escapeHtml(link.title)} ».</p>${
        note ? `<p style="background:#f3ede2;border-radius:10px;padding:12px 14px">${escapeHtml(note).replace(/\n/g, "<br>")}</p>` : ""
      }<p style="color:#55605c;font-size:13px">Lien de téléchargement valable 7 jours.</p>`,
      { label: "Télécharger le document", href: link.url },
      { eyebrow: "Document partagé", preheader: link.fileName },
    ),
  });
  return sent ? { ok: true, message: `Document envoyé à ${to}.` } : { message: "L’envoi de l’e-mail a échoué." };
}

// --- Formulaire Linky rempli en ligne -------------------------------------------

export type LinkyState = { ok?: boolean; message: string; errors?: LinkyErrors; submissionId?: string } | null;

export async function submitLinky(_: LinkyState, fd: FormData): Promise<LinkyState> {
  const user = await requireUser("/espace/documents/linky");
  const v = (k: string, max = 200) => text(fd, k, max);
  const digits = (k: string) => v(k, 40).replace(/\D/g, "");
  const data: LinkyData = {
    denomination: v("denomination"),
    legalForm: v("legalForm", 60) || "Association loi 1901",
    tradeName: v("tradeName"),
    siret: digits("siret"),
    naf: v("naf", 10).replace(/[\s.]/g, "").toUpperCase(),
    address: v("address"),
    postalCode: digits("postalCode"),
    city: v("city", 100),
    signerCivility: fd.get("signerCivility") === "Mme" ? "Mme" : "M",
    signerLastName: v("signerLastName", 80),
    signerFirstName: v("signerFirstName", 80),
    contractHolder: v("contractHolder"),
    phone: v("phone", 30),
    email: v("email", 120),
    prm: digits("prm"),
    siteAddress: v("siteAddress"),
    place: v("place", 100),
  };
  const errors = validateLinky(data);
  const signature = String(fd.get("signature") ?? "");
  if (!signature.startsWith("data:image/png;base64,") || signature.length < 2000) errors.signature = "Signez dans le cadre.";
  if (fd.get("consent") !== "on") errors.consent = "Cochez la case pour confirmer.";
  if (Object.keys(errors).length) return { message: "Merci de compléter le formulaire.", errors };
  if (!isSupabaseConfigured) return { message: "Configurez Supabase pour enregistrer le formulaire." };

  const template = await getFormTemplate("linky");
  if (!template) return { message: "Le modèle du formulaire n’est pas encore disponible. Contactez l’équipe." };
  const signedAt = new Date();
  const pdf = await fillLinkyPdf(template.bytes, data, Buffer.from(signature.split(",")[1], "base64"), signedAt);

  const db = createAdminClient();
  const path = `formulaires/${user.mosqueId ?? user.id}/${crypto.randomUUID()}-autorisation-linky.pdf`;
  const up = await db.storage.from(DOCUMENTS_BUCKET).upload(path, pdf, { contentType: "application/pdf" });
  if (up.error) return { message: "L’enregistrement du PDF a échoué. Réessayez." };
  const { data: row, error } = await db
    .from("document_submissions")
    .insert({ document_id: template.id, form_kind: "linky", mosque_id: user.mosqueId, submitted_by: user.id, data, pdf_path: path })
    .select("id")
    .single();
  if (error) return { message: "Enregistrement impossible. Réessayez." };

  await sendEmail({
    to: teamInbox(),
    replyTo: data.email || user.email,
    subject: `Autorisation Linky signée : ${data.tradeName}`,
    html: emailLayout(
      `Autorisation Linky signée : ${data.tradeName}`,
      emailTable([
        ["Mosquée", data.tradeName],
        ["Association", data.denomination],
        ["SIRET", data.siret],
        ["Compteur", data.prm ? `PRM ${data.prm}` : data.siteAddress],
        ["Signataire", `${data.signerFirstName} ${data.signerLastName}`],
        ["Contact", [data.phone, data.email].filter(Boolean).join(" · ") || "—"],
      ]),
      { label: "Voir le formulaire signé", href: `${site.url}/documents/formulaires/${row.id}?voir=1` },
      { eyebrow: "Formulaire en ligne", preheader: "Autorisation de communication des données de mesure Enedis" },
    ),
  });

  refresh();
  return { ok: true, message: "Merci ! Votre autorisation est signée et transmise à l’équipe.", submissionId: row.id };
}
