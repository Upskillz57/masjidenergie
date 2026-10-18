"use server";

import { emailLayout, emailTable, sendEmail, teamInbox } from "@/lib/email";
import { site } from "@/lib/site";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AccountRequestState = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<"mosqueName" | "firstName" | "lastName" | "email" | "phone", string>>;
} | null;

const text = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? "").trim().slice(0, max);

export async function submitAccountRequest(_: AccountRequestState, formData: FormData): Promise<AccountRequestState> {
  if (text(formData, "website")) return { ok: true, message: "Merci, votre demande a bien été envoyée." };
  if (!isSupabaseConfigured) {
    return { ok: false, message: `La création de compte ouvre bientôt. Appelez-nous au ${site.contact.phone}.` };
  }

  const data = {
    mosque_name: text(formData, "mosqueName"),
    mosque_address: text(formData, "mosqueAddress") || null,
    first_name: text(formData, "firstName"),
    last_name: text(formData, "lastName"),
    role_in_mosque: text(formData, "roleInMosque") || null,
    email: text(formData, "email").toLowerCase(),
    phone: text(formData, "phone", 40),
    message: text(formData, "message", 2000) || null,
  };

  const errors: NonNullable<AccountRequestState>["errors"] = {};
  if (!data.mosque_name) errors.mosqueName = "Nom de la mosquée requis.";
  if (!data.first_name) errors.firstName = "Prénom requis.";
  if (!data.last_name) errors.lastName = "Nom requis.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (data.phone.replace(/\D/g, "").length < 9) errors.phone = "Numéro de téléphone invalide.";
  if (Object.keys(errors).length) return { ok: false, message: "Merci de vérifier le formulaire.", errors };

  const db = createAdminClient();
  const { data: pending } = await db
    .from("account_requests")
    .select("id")
    .eq("email", data.email)
    .eq("status", "en_attente")
    .maybeSingle();
  if (pending) return { ok: true, message: "Votre demande est déjà en cours d’examen. Nous revenons vers vous rapidement." };

  const { data: row, error } = await db.from("account_requests").insert(data).select("number").single();
  if (error) {
    console.error("[demande de compte] insertion impossible", error);
    return { ok: false, message: `L’envoi a échoué. Réessayez ou appelez-nous au ${site.contact.phone}.` };
  }

  await sendEmail({
    to: teamInbox(),
    replyTo: data.email,
    subject: `Demande de compte n°${row.number} : ${data.mosque_name}`,
    html: emailLayout(
      `Demande de compte : ${data.mosque_name}`,
      emailTable([
        ["Mosquée", data.mosque_name],
        ["Adresse", data.mosque_address ?? "—"],
        ["Responsable", `${data.first_name} ${data.last_name}${data.role_in_mosque ? ` (${data.role_in_mosque})` : ""}`],
        ["Téléphone", data.phone],
        ["E-mail", data.email],
        ...(data.message ? ([["Message", data.message]] as [string, string][]) : []),
      ]),
      { label: "Valider dans l’espace admin", href: `${site.url}/admin/comptes` },
      { eyebrow: `Demande de compte n°${row.number}`, preheader: `${data.first_name} ${data.last_name} · ${data.phone}` },
    ),
  });

  return {
    ok: true,
    message: "Merci ! Votre demande est enregistrée. Vous recevrez un e-mail dès que votre espace sera activé.",
  };
}
