"use server";

import { demoGetRequest } from "@/lib/admin/demo";
import { requireStaff } from "@/lib/auth";
import { FILE_KIND_LABEL, type FileKind } from "@/lib/dossier";
import { emailLayout, emailTable, escapeHtml, sendEmail } from "@/lib/email";
import { refresh } from "next/cache";
import { studyUploadUrl } from "@/lib/study-link";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDate, formatSize, isRequestStatus, isStudyPath, STATUS_META } from "@/lib/workflow";
import type { ActionState } from "@/app/actions/admin";

const UUID = /^[0-9a-f-]{36}$/i;
/** Resend refuse les e-mails de plus de 40 Mo, pièces jointes encodées en base64 (+33 %) comprises. */
const MAX_ATTACHMENTS_BYTES = 25 * 1024 * 1024;

/** `study` : document de l'étude réalisée (renvoyé par le bureau d'études). */
export type ShareFile = { id: string; name: string; size: number; kind: FileKind; study: boolean };
export type ShareData = {
  id: string;
  number: number;
  mosqueName: string;
  address: string | null;
  contact: string;
  phone: string;
  email: string;
  chargers: boolean;
  status: string;
  receivedAt: string;
  sender: string;
  files: ShareFile[];
};

/** Résumé de la demande et liste de ses documents pour la fenêtre de partage. */
export async function getShareData(requestId: string): Promise<ShareData | null> {
  const user = await requireStaff();
  if (!UUID.test(requestId)) return null;

  type Req = {
    id: string;
    number: number;
    created_at: string;
    status: string;
    mosque_name: string;
    mosque_address: string | null;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    chargers: boolean;
  };
  let req: Req;
  let files: ShareFile[];

  if (!isSupabaseConfigured) {
    const demo = demoGetRequest(requestId);
    if (!demo) return null;
    req = demo.request;
    files = demo.files.map((f) => ({ id: f.id, name: f.name, size: f.size, kind: f.kind, study: f.study }));
  } else {
    const db = createAdminClient();
    const [r, f] = await Promise.all([
      db.from("study_requests").select("*").eq("id", requestId).maybeSingle<Req>(),
      db.from("request_files").select("id, path, name, size, kind").eq("request_id", requestId).order("created_at"),
    ]);
    if (!r.data) return null;
    req = r.data;
    files = ((f.data ?? []) as (Omit<ShareFile, "study"> & { path: string })[]).map(({ path, ...x }) => ({
      ...x,
      study: isStudyPath(path),
    }));
  }

  return {
    id: req.id,
    number: req.number,
    mosqueName: req.mosque_name,
    address: req.mosque_address,
    contact: `${req.first_name} ${req.last_name}`,
    phone: req.phone,
    email: req.email,
    chargers: req.chargers,
    status: isRequestStatus(req.status) ? STATUS_META[req.status].label : req.status,
    receivedAt: formatDate(req.created_at),
    sender: user.fullName || user.email,
    files,
  };
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const sectionTitle = (s: string) =>
  `<p style="margin:26px 0 6px;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c8a24c">${escapeHtml(s)}</p>`;

/**
 * Envoie par e-mail (mise en page du site), avec les documents choisis en pièces jointes :
 * - la demande, au bureau d'études, avec le bouton « Déposer l'étude » (lien signé) ;
 * - ou l'étude réalisée (`mode=study`), à la mosquée.
 */
export async function shareRequestByEmail(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const requestId = String(formData.get("id") ?? "");
  if (!UUID.test(requestId)) return { message: "Demande introuvable." };

  const to = [...new Set(String(formData.get("to") ?? "").split(/[\s,;]+/).filter(Boolean))];
  if (!to.length) return { message: "Indiquez au moins un destinataire." };
  if (to.length > 10) return { message: "10 destinataires au maximum." };
  const invalid = to.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (invalid) return { message: `Adresse e-mail invalide : ${invalid}` };

  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 10000);
  if (!subject) return { message: "Indiquez un objet." };
  const fileIds = formData.getAll("files").map(String).filter((v) => UUID.test(v));
  const studyMode = formData.get("mode") === "study";
  const uploadLink = !studyMode && formData.get("uploadLink") === "1";

  if (!isSupabaseConfigured) return { message: "Mode démo : configurez Supabase et Resend pour envoyer l’e-mail." };

  const db = createAdminClient();
  const [{ data: r }, { data: rows }] = await Promise.all([
    db.from("study_requests").select("*").eq("id", requestId).maybeSingle(),
    fileIds.length
      ? db.from("request_files").select("id, path, name, size, kind").eq("request_id", requestId).in("id", fileIds).order("created_at")
      : Promise.resolve({ data: [] as { id: string; path: string; name: string; size: number; kind: FileKind }[] }),
  ]);
  if (!r) return { message: "Demande introuvable." };
  const files = (rows ?? []) as { id: string; path: string; name: string; size: number; kind: FileKind }[];
  const total = files.reduce((s, f) => s + (f.size ?? 0), 0);
  if (total > MAX_ATTACHMENTS_BYTES) {
    return {
      message: `Pièces jointes trop lourdes (${formatSize(total)}, 25 Mo au maximum). Retirez des documents ou envoyez-les en plusieurs e-mails.`,
    };
  }

  const attachments: { filename: string; content: string }[] = [];
  for (const f of files) {
    const { data } = await db.storage.from(DOCUMENTS_BUCKET).download(f.path);
    if (!data) return { message: `Impossible de récupérer « ${f.name} ». Réessayez.` };
    attachments.push({ filename: f.name, content: Buffer.from(await data.arrayBuffer()).toString("base64") });
  }

  const recap: [string, string][] = [
    ["Mosquée", r.mosque_name],
    ["Adresse", r.mosque_address || "Non précisée"],
    ["Contact", `${r.first_name} ${r.last_name}`],
    ["Téléphone", r.phone],
    ["E-mail", r.email],
    ["Bornes de recharge", r.chargers ? "Oui, souhaitées" : "Non"],
    ["Reçue le", formatDate(r.created_at)],
  ];
  const list = files.length
    ? `${sectionTitle(`Pièces jointes (${files.length})`)}${emailTable(
        files.map((f) => [FILE_KIND_LABEL[f.kind] ?? "Document", `${f.name} · ${formatSize(f.size)}`]),
      )}`
    : "";

  const sent = await sendEmail({
    to,
    replyTo: user.email,
    subject,
    html: emailLayout(
      studyMode ? `Votre étude solaire : ${r.mosque_name}` : `Demande d’étude : ${r.mosque_name}`,
      studyMode
        ? `${paragraphs(message)}${list}`
        : `${paragraphs(message)}${sectionTitle("La demande")}${emailTable(recap)}${list}`,
      uploadLink ? { label: "Consulter la demande et déposer l’étude", href: studyUploadUrl(requestId) } : undefined,
      {
        eyebrow: `Demande n°${r.number}`,
        preheader: message.split("\n").find((l) => l.trim()) ?? `${r.mosque_name} · ${files.length} document(s)`,
      },
    ),
    attachments,
  });
  if (!sent) return { message: "L’envoi a échoué. Réessayez dans un instant." };

  await db.from("request_events").insert({
    request_id: requestId,
    actor_id: user.id,
    type: studyMode ? "study_shared" : "shared",
    data: { to: to.join(", "), files: files.length },
  });
  // L'étude part chez la mosquée : la demande passe à « Étude envoyée » si elle n'en était pas encore là.
  if (studyMode && ["nouvelle", "en_attente", "en_cours"].includes(r.status)) {
    await db.from("study_requests").update({ status: "etude_envoyee" }).eq("id", requestId);
    await db.from("request_events").insert({
      request_id: requestId,
      actor_id: user.id,
      type: "status",
      data: { from: r.status, to: "etude_envoyee" },
    });
  }
  refresh();
  const n = files.length;
  return {
    ok: true,
    message: `E-mail envoyé à ${to.join(", ")}${n ? ` avec ${n} pièce${n > 1 ? "s" : ""} jointe${n > 1 ? "s" : ""}` : ""}.`,
  };
}
