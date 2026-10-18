import "server-only";

import { site } from "@/lib/site";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const teamInbox = () => (process.env.STUDY_REQUEST_TO ?? site.contact.email).split(",").map((s) => s.trim());

/** Habillage commun des e-mails (texte déjà échappé). */
export function emailLayout(title: string, body: string, cta?: { label: string; href: string }) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${cta.href}" style="background:#0e5c47;color:#fff;padding:13px 22px;border-radius:9px;text-decoration:none;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1d2a26;line-height:1.5">
<p style="color:#c8a24c;font-weight:700;letter-spacing:.2em;font-size:12px">${escapeHtml(site.name.toUpperCase())}</p>
<h2 style="color:#13343b">${escapeHtml(title)}</h2>${body}${button}
<p style="color:#55605c;font-size:12px;margin-top:32px">${escapeHtml(site.name)} · ${escapeHtml(site.company)}</p></div>`;
}

type Email = {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
};

/** Envoie via Resend. Sans clé : affiche l'e-mail dans le terminal en développement, échoue en production. */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[e-mail non envoyé, RESEND_API_KEY absent] ${email.subject} → ${email.to.join(", ")}`);
      return true;
    }
    console.error("[e-mail] RESEND_API_KEY manquant");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.STUDY_REQUEST_FROM ?? `${site.name} <onboarding@resend.dev>`,
      to: email.to,
      reply_to: email.replyTo,
      subject: email.subject,
      html: email.html,
      attachments: email.attachments,
    }),
  });
  if (!res.ok) console.error("[e-mail] échec Resend", res.status, await res.text());
  return res.ok;
}
