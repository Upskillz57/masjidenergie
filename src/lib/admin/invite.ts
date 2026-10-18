import "server-only";

import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/workflow";

/** Lien d'activation à usage unique, vérifié par /auth/confirm puis redirigé vers le choix du mot de passe. */
const confirmUrl = (tokenHash: string, type: "invite" | "recovery") =>
  `${site.url}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${type}&next=/compte/mot-de-passe`;

/**
 * Crée (ou retrouve) le compte, fixe son rôle et sa mosquée, puis envoie le lien pour choisir un mot de passe.
 * Les e-mails passent par Resend plutôt que par l'envoi intégré de Supabase, limité à quelques messages par heure.
 */
export async function inviteUser(input: {
  email: string;
  fullName: string;
  role: Role;
  mosqueId?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = createAdminClient();
  const email = input.email.trim().toLowerCase();

  let link = await db.auth.admin.generateLink({ type: "invite", email, options: { data: { full_name: input.fullName } } });
  let type: "invite" | "recovery" = "invite";
  if (link.error) {
    // Compte déjà existant : on lui envoie un lien de réinitialisation à la place.
    link = await db.auth.admin.generateLink({ type: "recovery", email });
    type = "recovery";
  }
  if (link.error || !link.data.user) {
    console.error("[invitation] lien impossible", link.error);
    return { ok: false, message: "Impossible de créer le compte. Vérifiez l’adresse e-mail." };
  }

  const { error } = await db.from("profiles").upsert({
    id: link.data.user.id,
    email,
    full_name: input.fullName,
    role: input.role,
    mosque_id: input.mosqueId ?? null,
  });
  if (error) {
    console.error("[invitation] profil impossible", error);
    return { ok: false, message: "Le compte a été créé mais son rôle n’a pas pu être enregistré." };
  }

  const isMosque = input.role === "mosquee";
  const sent = await sendEmail({
    to: [email],
    subject: isMosque ? `Votre espace ${site.name} est prêt` : `Invitation à l’espace admin ${site.name}`,
    html: emailLayout(
      isMosque ? "Votre espace mosquée est prêt" : "Vous êtes invité à rejoindre l’équipe",
      `<p>Assalamou alaykoum ${escapeHtml(input.fullName)},</p><p>${
        isMosque
          ? "Votre compte a été validé. Choisissez votre mot de passe pour accéder à votre consommation, vos factures et le suivi de votre projet solaire."
          : "Un compte vous a été créé pour gérer les demandes d’étude. Choisissez votre mot de passe pour y accéder."
      }</p><p style="color:#55605c;font-size:13px">Ce lien est valable 24 heures et ne peut être utilisé qu’une fois.</p>`,
      { label: "Choisir mon mot de passe", href: confirmUrl(link.data.properties.hashed_token, type) },
    ),
  });
  return sent ? { ok: true } : { ok: false, message: "Compte créé, mais l’e-mail d’invitation n’a pas pu partir." };
}

/** Lien « mot de passe oublié ». Ne révèle jamais si l'adresse existe. */
export async function sendPasswordReset(email: string) {
  const db = createAdminClient();
  const link = await db.auth.admin.generateLink({ type: "recovery", email: email.trim().toLowerCase() });
  if (link.error) return;
  await sendEmail({
    to: [email],
    subject: `Réinitialisation de votre mot de passe ${site.name}`,
    html: emailLayout(
      "Réinitialiser votre mot de passe",
      "<p>Vous avez demandé à changer votre mot de passe. Si ce n’est pas vous, ignorez cet e-mail.</p>",
      { label: "Choisir un nouveau mot de passe", href: confirmUrl(link.data.properties.hashed_token, "recovery") },
    ),
  });
}
