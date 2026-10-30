"use server";

import { dossierPieces, isMotivation, missingPieces, MOTIVATIONS, REQUIRED_BILLS, type Motivation } from "@/lib/dossier";
import { declaredFilesError, parseDeclaredFiles, registerUploads, signUploads } from "@/lib/dossier-data";
import { emailLayout, emailTable, sendEmail, teamInbox } from "@/lib/email";
import { site } from "@/lib/site";
import { type StudyRequestState } from "@/lib/study";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim().slice(0, 300);

const thanks = "Merci, votre demande a bien été envoyée. Nous vous recontactons très vite.";

export async function submitStudyRequest(formData: FormData): Promise<StudyRequestState> {
  // Champ piège invisible : seuls les robots le remplissent.
  if (text(formData, "website")) return { ok: true, message: thanks };

  const data = {
    mosqueName: text(formData, "mosqueName"),
    mosqueAddress: text(formData, "mosqueAddress"),
    mosqueOsm: text(formData, "mosqueOsm"),
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    phone: text(formData, "phone"),
    email: text(formData, "email").toLowerCase(),
    chargers: formData.get("chargers") === "oui",
    motivations: formData.getAll("motivations").filter(isMotivation) as Motivation[],
    context: String(formData.get("context") ?? "").trim().slice(0, 2000),
    message: String(formData.get("message") ?? "").trim().slice(0, 2000),
  };
  const files = parseDeclaredFiles(formData.get("files"));

  const errors: StudyRequestState["errors"] = {};
  if (!data.mosqueName) errors.mosque = "Sélectionnez ou indiquez votre mosquée.";
  if (!data.firstName) errors.firstName = "Prénom requis.";
  if (!data.lastName) errors.lastName = "Nom requis.";
  if (data.phone.replace(/\D/g, "").length < 9) errors.phone = "Numéro de téléphone invalide.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (!data.motivations.length && !data.context) errors.motivation = "Indiquez votre motivation ou le contexte du projet.";
  const filesError = files ? declaredFilesError(files) : "Fichiers invalides.";
  if (filesError) errors.bills = filesError;
  if (Object.keys(errors).length) return { ok: false, message: "Merci de vérifier le formulaire.", errors };

  const declared = files ?? [];
  const count = (kind: string) => declared.filter((f) => f.kind === kind).length;
  const pieces = dossierPieces({
    bills: count("facture"),
    enedisFiles: count("enedis"),
    roofFiles: count("toiture"),
    linkySigned: false,
    motivations: data.motivations,
    context: data.context || null,
  });
  const missing = missingPieces(pieces).map((p) => p.label);

  const osm = /^(node|way|relation)\/\d+$/.test(data.mosqueOsm) ? data.mosqueOsm : null;

  // 1. Enregistrement dans l'espace admin. Les fichiers sont ensuite envoyés directement au stockage.
  let saved: { id: string; number: number } | null = null;
  let uploads: StudyRequestState["uploads"];
  if (isSupabaseConfigured) {
    const db = createAdminClient();
    const { data: row, error } = await db
      .from("study_requests")
      .insert({
        mosque_name: data.mosqueName,
        mosque_address: data.mosqueAddress || null,
        mosque_osm: osm,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        chargers: data.chargers,
        project_motivations: data.motivations,
        project_context: data.context || null,
        message: data.message || null,
      })
      .select("id, number")
      .single();
    if (error) console.error("[demande d'étude] insertion impossible", error);
    else {
      saved = row;
      uploads = await signUploads(db, row.id, declared);
      await db.from("request_events").insert({ request_id: row.id, type: "created", data: {} });
    }
  }

  // 2. Notification de l'équipe.
  const rows: [string, string][] = [
    ["Mosquée", data.mosqueName],
    ["Adresse", data.mosqueAddress || "—"],
    ["Contact", `${data.firstName} ${data.lastName}`],
    ["Téléphone", data.phone],
    ["E-mail", data.email],
    ["Bornes de recharge", data.chargers ? "Oui, souhaitées" : "Non"],
    ["Motivation", data.motivations.map((m) => MOTIVATIONS[m]).join(", ") || "—"],
    ["Contexte", data.context || "—"],
    ["Factures annoncées", `${count("facture")} / ${REQUIRED_BILLS}`],
    ["Autorisation Enedis", count("enedis") ? "Jointe" : "À obtenir"],
    ["Vue aérienne", count("toiture") ? "Jointe" : "Non fournie"],
  ];
  if (data.message) rows.push(["Message", data.message]);

  const sent = await sendEmail({
    to: teamInbox(),
    replyTo: data.email,
    subject: `${saved ? `Demande n°${saved.number} : ` : "Demande d’étude : "}${data.mosqueName}${data.chargers ? " (+ bornes de recharge)" : ""}`,
    html: emailLayout(
      `Nouvelle demande d’étude : ${data.mosqueName}`,
      emailTable(rows),
      saved ? { label: "Ouvrir la demande dans l’espace admin", href: `${site.url}/admin/demandes/${saved.id}` } : undefined,
      {
        eyebrow: saved ? `Demande n°${saved.number}` : "Demande d’étude",
        preheader: `${data.firstName} ${data.lastName} · ${data.phone} · ${count("facture")} facture(s)`,
      },
    ),
  });

  if (!saved && !sent) {
    return { ok: false, message: `L’envoi a échoué. Réessayez ou appelez-nous au ${site.contact.phone}.` };
  }
  return { ok: true, message: thanks, requestId: saved?.id, uploads, missing };
}

/** Appelée après l'envoi direct des fichiers : l'identifiant de la demande n'est connu que de son auteur. */
export async function completeStudyRequest(requestId: string) {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(requestId)) return;
  await registerUploads(createAdminClient(), requestId, null);
}
