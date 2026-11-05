"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { MAX_FILE_BYTES, type SignedUpload } from "@/lib/dossier";
import { emailLayout, emailTable, sendEmail, teamInbox } from "@/lib/email";
import { site } from "@/lib/site";
import { verifyStudyToken } from "@/lib/study-link";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/workflow";

// Dépôt de l'étude par le bureau d'études (lien signé reçu par e-mail) ou par l'équipe depuis l'admin.
// Les fichiers partent directement du navigateur vers le stockage privé : `demandes/<id>/etude/<uuid>-<nom>`.

const MAX_STUDY_FILES = 10;
const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "fichier";

export type StudyUploadResult = { ok: true; uploads: SignedUpload[] } | { ok: false; message: string };

export async function prepareStudyUpload(
  token: string,
  files: { name: string; size: number }[],
): Promise<StudyUploadResult> {
  const requestId = verifyStudyToken(token);
  if (!requestId) return { ok: false, message: "Ce lien n’est plus valable. Demandez-en un nouveau à l’équipe Masjid Energie." };
  if (!isSupabaseConfigured) return { ok: false, message: "Mode démo : dépôt indisponible sans Supabase." };
  if (!files.length) return { ok: false, message: "Ajoutez au moins un document." };
  if (files.length > MAX_STUDY_FILES) return { ok: false, message: `${MAX_STUDY_FILES} documents au maximum par envoi.` };
  if (files.some((f) => !(f.size > 0) || f.size > MAX_FILE_BYTES)) return { ok: false, message: "20 Mo maximum par document." };

  const db = createAdminClient();
  const { data: req } = await db.from("study_requests").select("id").eq("id", requestId).maybeSingle();
  if (!req) return { ok: false, message: "Cette demande n’existe plus." };

  const uploads: SignedUpload[] = [];
  for (const [index, f] of files.entries()) {
    const path = `demandes/${requestId}/etude/${crypto.randomUUID()}-${safeName(String(f.name).slice(0, 200))}`;
    const { data, error } = await db.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
    if (error) return { ok: false, message: "Envoi impossible pour le moment. Réessayez dans un instant." };
    uploads.push({ index, path: data.path, token: data.token });
  }
  return { ok: true, uploads };
}

/**
 * Enregistre sur la demande les fichiers réellement arrivés dans le dossier de l'étude
 * (rien ne vient du navigateur), avec le nom et le message de la personne qui dépose.
 */
export async function finalizeStudyUpload(
  token: string,
  info: { name: string; company: string; note: string },
): Promise<{ ok: boolean; message: string }> {
  const requestId = verifyStudyToken(token);
  if (!requestId) return { ok: false, message: "Ce lien n’est plus valable." };
  if (!isSupabaseConfigured) return { ok: false, message: "Mode démo : dépôt indisponible sans Supabase." };

  const db = createAdminClient();
  const user = await getCurrentUser();
  const staff = user && isStaffRole(user.role) ? user : null;
  const by = String(info.name ?? "").trim().slice(0, 120) || staff?.fullName || "Bureau d’études";
  const company = String(info.company ?? "").trim().slice(0, 120);
  const note = String(info.note ?? "").trim().slice(0, 5000);

  const folder = `demandes/${requestId}/etude`;
  const [{ data: req }, { data: known }, { data: stored }] = await Promise.all([
    db.from("study_requests").select("id, number, mosque_name").eq("id", requestId).maybeSingle(),
    db.from("request_files").select("path").eq("request_id", requestId),
    db.storage.from(DOCUMENTS_BUCKET).list(folder, { limit: 100 }),
  ]);
  if (!req) return { ok: false, message: "Cette demande n’existe plus." };
  const paths = new Set((known ?? []).map((f) => f.path));

  const names: string[] = [];
  for (const f of stored ?? []) {
    const path = `${folder}/${f.name}`;
    if (!f.id || paths.has(path)) continue;
    const name = f.name.slice(37);
    const { error } = await db.from("request_files").insert({
      request_id: requestId,
      path,
      name,
      size: f.metadata?.size ?? 0,
      mime: f.metadata?.mimetype ?? null,
      kind: "document",
      uploaded_by: staff?.id ?? null,
    });
    if (error) console.error("[étude] enregistrement du fichier impossible", error);
    else names.push(name);
  }
  if (!names.length && !note) return { ok: false, message: "Aucun document n’est arrivé. Réessayez l’envoi." };

  await db.from("request_events").insert({
    request_id: requestId,
    actor_id: staff?.id ?? null,
    type: "study_uploaded",
    data: { by, company: company || null, names: names.join(", "), files: names.length, note: note || null },
  });

  if (!staff) {
    const rows: [string, string][] = [
      ["Déposée par", company ? `${by} (${company})` : by],
      ["Documents", names.join("\n") || "Aucun"],
    ];
    if (note) rows.push(["Message", note]);
    await sendEmail({
      to: teamInbox(),
      subject: `Étude reçue : demande n°${req.number}, ${req.mosque_name}`,
      html: emailLayout(
        `Étude reçue pour ${req.mosque_name}`,
        emailTable(rows),
        { label: "Voir la demande et l’étude", href: `${site.url}/admin/demandes/${requestId}` },
        { eyebrow: `Demande n°${req.number}`, preheader: `${names.length} document(s) déposé(s) par ${by}` },
      ),
    });
  }
  if (staff) refresh();
  return {
    ok: true,
    message: `Merci ! ${names.length} document${names.length > 1 ? "s" : ""} transmis à l’équipe Masjid Energie.`,
  };
}
