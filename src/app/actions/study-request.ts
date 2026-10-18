"use server";

import { emailLayout, escapeHtml, sendEmail, teamInbox } from "@/lib/email";
import { site } from "@/lib/site";
import { BILL_ACCEPT, MAX_BILLS, MAX_BILLS_BYTES, type StudyRequestState } from "@/lib/study";
import { createAdminClient, DOCUMENTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase/server";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim().slice(0, 300);

const thanks = "Merci, votre demande a bien été envoyée. Nous vous recontactons très vite.";

const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "fichier";

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
    message: String(formData.get("message") ?? "").trim().slice(0, 2000),
  };
  const bills = formData.getAll("bills").filter((f): f is File => f instanceof File && f.size > 0);

  const errors: StudyRequestState["errors"] = {};
  if (!data.mosqueName) errors.mosque = "Sélectionnez ou indiquez votre mosquée.";
  if (!data.firstName) errors.firstName = "Prénom requis.";
  if (!data.lastName) errors.lastName = "Nom requis.";
  if (data.phone.replace(/\D/g, "").length < 9) errors.phone = "Numéro de téléphone invalide.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (bills.length > MAX_BILLS) errors.bills = `${MAX_BILLS} fichiers maximum.`;
  else if (bills.reduce((n, f) => n + f.size, 0) > MAX_BILLS_BYTES) errors.bills = "4 Mo maximum au total.";
  else if (bills.some((f) => !BILL_ACCEPT.split(",").includes(f.type)))
    errors.bills = "Formats acceptés : PDF, JPG, PNG.";
  if (Object.keys(errors).length) return { ok: false, message: "Merci de vérifier le formulaire.", errors };

  const osm = /^(node|way|relation)\/\d+$/.test(data.mosqueOsm) ? data.mosqueOsm : null;

  // 1. Enregistrement dans l'espace admin (demande + factures).
  let saved: { id: string; number: number } | null = null;
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
        message: data.message || null,
      })
      .select("id, number")
      .single();
    if (error) console.error("[demande d'étude] insertion impossible", error);
    else {
      saved = row;
      for (const f of bills) {
        const path = `demandes/${row.id}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const up = await db.storage.from(DOCUMENTS_BUCKET).upload(path, f, { contentType: f.type });
        if (up.error) {
          console.error("[demande d'étude] envoi de facture impossible", up.error);
          continue;
        }
        await db.from("request_files").insert({ request_id: row.id, path, name: f.name, size: f.size, mime: f.type });
      }
      await db.from("request_events").insert({ request_id: row.id, type: "created", data: { bills: bills.length } });
    }
  }

  // 2. Notification de l'équipe. Sans base, les factures partent en pièces jointes.
  const rows: [string, string][] = [
    ["Mosquée", data.mosqueName],
    ["Adresse", data.mosqueAddress || "—"],
    ["Contact", `${data.firstName} ${data.lastName}`],
    ["Téléphone", data.phone],
    ["E-mail", data.email],
    ["Bornes de recharge", data.chargers ? "Oui, souhaitées" : "Non"],
    ["Factures", bills.length ? bills.map((f) => f.name).join(", ") : "Aucune"],
  ];
  if (data.message) rows.push(["Message", data.message]);
  const table = `<table cellpadding="6">${rows
    .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;

  const sent = await sendEmail({
    to: teamInbox(),
    replyTo: data.email,
    subject: `${saved ? `Demande n°${saved.number} : ` : "Demande d’étude : "}${data.mosqueName}${data.chargers ? " (+ bornes de recharge)" : ""}`,
    html: emailLayout(
      "Nouvelle demande d’étude",
      table,
      saved ? { label: "Ouvrir dans l’espace admin", href: `${site.url}/admin/demandes/${saved.id}` } : undefined,
    ),
    attachments: saved
      ? undefined
      : await Promise.all(
          bills.map(async (f) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()).toString("base64") })),
        ),
  });

  if (!saved && !sent) {
    return { ok: false, message: `L’envoi a échoué. Réessayez ou appelez-nous au ${site.contact.phone}.` };
  }
  return { ok: true, message: thanks };
}
